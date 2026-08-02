import "server-only";
import type {
  FlightOffer,
  FlightProvider,
  FlightSearchQuery,
  FlightSearchResult,
  FlightSegment,
} from "./types";

/**
 * Demo flight inventory.
 *
 * This is NOT live airline data and is labelled as demo everywhere it surfaces.
 * It exists so the entire booking flow — search, filter, select, passenger
 * details, payment, confirmation — can be built and tested before a supplier
 * contract is signed. We never scrape airline or OTA websites.
 *
 * Two properties make it safe to build a real checkout on top of:
 *
 *  1. Deterministic. The same query always yields the same itineraries and the
 *     same fares, so an offer can be re-priced later without a cache.
 *  2. The offer id encodes only the *inputs* (route, date, flight number, cabin)
 *     — never the price. A tampered id changes the itinerary, and the fare is
 *     recomputed from those inputs on the server, so a user cannot rewrite a
 *     fare to ₹1.
 */

const AIRLINES = [
  { code: "AI", name: "Meridian Air", aircraft: "Boeing 787-8" },
  { code: "VY", name: "Voyager Airways", aircraft: "Airbus A320neo" },
  { code: "IX", name: "Indigo Sky", aircraft: "Airbus A321" },
  { code: "SQ", name: "Sunlark", aircraft: "Boeing 777-300ER" },
  { code: "EK", name: "Dune Air", aircraft: "Airbus A380" },
  { code: "QR", name: "Pearl Wings", aircraft: "Airbus A350-900" },
] as const;

const AIRPORTS: Record<string, { name: string; city: string }> = {
  DEL: { name: "Indira Gandhi International", city: "Delhi" },
  BOM: { name: "Chhatrapati Shivaji Maharaj International", city: "Mumbai" },
  BLR: { name: "Kempegowda International", city: "Bengaluru" },
  MAA: { name: "Chennai International", city: "Chennai" },
  HYD: { name: "Rajiv Gandhi International", city: "Hyderabad" },
  CCU: { name: "Netaji Subhas Chandra Bose International", city: "Kolkata" },
  GOI: { name: "Goa International", city: "Goa" },
  COK: { name: "Cochin International", city: "Kochi" },
  AMD: { name: "Sardar Vallabhbhai Patel International", city: "Ahmedabad" },
  DXB: { name: "Dubai International", city: "Dubai" },
  SIN: { name: "Changi", city: "Singapore" },
  BKK: { name: "Suvarnabhumi", city: "Bangkok" },
  DPS: { name: "Ngurah Rai International", city: "Bali" },
  CDG: { name: "Charles de Gaulle", city: "Paris" },
  LHR: { name: "Heathrow", city: "London" },
  MLE: { name: "Velana International", city: "Malé" },
  KTM: { name: "Tribhuvan International", city: "Kathmandu" },
  CMB: { name: "Bandaranaike International", city: "Colombo" },
  ZRH: { name: "Zurich", city: "Zurich" },
  IST: { name: "Istanbul", city: "Istanbul" },
};

/** Rough great-circle-ish distance proxy, used only to shape demo durations. */
const HUB_DISTANCE: Record<string, number> = {
  DEL: 0, BOM: 1150, BLR: 1740, MAA: 1760, HYD: 1250, CCU: 1300, GOI: 1520,
  COK: 2060, AMD: 780, DXB: 2200, SIN: 4150, BKK: 2920, DPS: 5100, CDG: 6600,
  LHR: 6700, MLE: 2500, KTM: 810, CMB: 2450, ZRH: 6100, IST: 4550,
};

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic PRNG seeded from the query — same query, same results. */
function seeded(seed: number) {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 100000) / 100000;
  };
}

function distanceKm(from: string, to: string) {
  const a = HUB_DISTANCE[from] ?? 1500;
  const b = HUB_DISTANCE[to] ?? 1500;
  return Math.max(350, Math.abs(a - b) || (a + b) / 2);
}

const CABIN_MULTIPLIER: Record<string, number> = {
  economy: 1,
  premium_economy: 1.6,
  business: 2.9,
  first: 4.4,
};

function airport(code: string) {
  return AIRPORTS[code] ?? { name: `${code} Airport`, city: code };
}

function buildSegment(
  from: string,
  to: string,
  departISO: Date,
  durationMinutes: number,
  airline: (typeof AIRLINES)[number],
  flightNumber: string,
  cabinClass: string,
): FlightSegment {
  const arrive = new Date(departISO.getTime() + durationMinutes * 60_000);
  return {
    airlineCode: airline.code,
    airlineName: airline.name,
    flightNumber,
    from,
    fromAirport: airport(from).name,
    to,
    toAirport: airport(to).name,
    departAt: departISO.toISOString(),
    arriveAt: arrive.toISOString(),
    durationMinutes,
    cabinClass,
    aircraft: airline.aircraft,
  };
}

/**
 * The offer id encodes the itinerary's defining inputs. It is re-parsed on the
 * server at booking time and the fare recomputed — the price never travels in
 * the token.
 */
function encodeOfferId(parts: {
  from: string;
  to: string;
  date: string;
  cabin: string;
  index: number;
  stops: number;
}) {
  const raw = `${parts.from}|${parts.to}|${parts.date}|${parts.cabin}|${parts.index}|${parts.stops}`;
  return Buffer.from(raw).toString("base64url");
}

function decodeOfferId(id: string) {
  try {
    const [from, to, date, cabin, index, stops] = Buffer.from(id, "base64url")
      .toString("utf8")
      .split("|");
    if (!from || !to || !date) return null;
    return {
      from,
      to,
      date,
      cabin,
      index: Number(index),
      stops: Number(stops),
    };
  } catch {
    return null;
  }
}

function buildOffers(query: FlightSearchQuery): FlightOffer[] {
  const { from, to, departDate, cabinClass } = query;
  const rand = seeded(hash(`${from}${to}${departDate}${cabinClass}`));

  const km = distanceKm(from, to);
  const baseMinutes = Math.round(60 + km / 11);
  const cabinMult = CABIN_MULTIPLIER[cabinClass] ?? 1;

  const pax = Math.max(1, query.adults) + query.children + query.infants * 0.1;

  const offers: FlightOffer[] = [];
  const count = 9;

  for (let i = 0; i < count; i++) {
    const airline = AIRLINES[Math.floor(rand() * AIRLINES.length)];
    const stops = i % 3 === 0 ? 0 : i % 4 === 0 ? 2 : 1;

    if (query.nonStopOnly && stops > 0) continue;

    const departHour = 5 + Math.floor(rand() * 17);
    const departMinute = [0, 15, 30, 45][Math.floor(rand() * 4)];

    const departAt = new Date(`${departDate}T00:00:00`);
    departAt.setHours(departHour, departMinute, 0, 0);

    const layoverMinutes = stops * (60 + Math.round(rand() * 120));
    const totalMinutes = baseMinutes + layoverMinutes + Math.round(rand() * 40);

    // Fare shape: distance + cabin + a stop discount + a stable per-offer jitter.
    const stopDiscount = stops === 0 ? 1.18 : stops === 1 ? 1 : 0.88;
    const jitter = 0.86 + rand() * 0.34;
    const basePerAdult = Math.round(((1800 + km * 3.6) * cabinMult * stopDiscount * jitter) / 10) * 10;
    const taxesPerAdult = Math.round(basePerAdult * 0.16);

    const outbound: FlightSegment[] = [];

    if (stops === 0) {
      outbound.push(
        buildSegment(from, to, departAt, totalMinutes, airline, `${airline.code}${100 + i * 7}`, cabinClass),
      );
    } else {
      const hubs = ["DXB", "BOM", "DEL", "SIN", "IST"].filter((h) => h !== from && h !== to);
      const hub = hubs[Math.floor(rand() * hubs.length)];
      const leg1 = Math.round(totalMinutes * 0.45);
      const leg2 = totalMinutes - leg1 - 90;

      outbound.push(
        buildSegment(from, hub, departAt, leg1, airline, `${airline.code}${100 + i * 7}`, cabinClass),
      );
      outbound.push(
        buildSegment(
          hub,
          to,
          new Date(departAt.getTime() + (leg1 + 90) * 60_000),
          Math.max(60, leg2),
          airline,
          `${airline.code}${200 + i * 7}`,
          cabinClass,
        ),
      );
    }

    let inbound: FlightSegment[] | undefined;
    let inboundBase = 0;

    if (query.tripType === "round_trip" && query.returnDate) {
      const returnAt = new Date(`${query.returnDate}T00:00:00`);
      returnAt.setHours(8 + Math.floor(rand() * 12), 0, 0, 0);

      inbound = [
        buildSegment(
          to,
          from,
          returnAt,
          baseMinutes + Math.round(rand() * 40),
          airline,
          `${airline.code}${300 + i * 7}`,
          cabinClass,
        ),
      ];
      inboundBase = Math.round(basePerAdult * 0.94);
    }

    const perAdultBase = basePerAdult + inboundBase;
    const perAdultTaxes = taxesPerAdult + (inboundBase ? Math.round(inboundBase * 0.16) : 0);
    const perAdultTotal = perAdultBase + perAdultTaxes;

    offers.push({
      id: encodeOfferId({ from, to, date: departDate, cabin: cabinClass, index: i, stops }),
      provider: "demo",
      dataSource: "demo",
      outbound,
      inbound,
      fare: {
        baseINR: perAdultBase,
        taxesINR: perAdultTaxes,
        totalINR: perAdultTotal,
        totalForPartyINR: Math.round(perAdultTotal * pax),
        refundable: i % 3 === 1,
        baggage: cabinClass === "economy" ? "25 kg check-in" : "35 kg check-in",
        cabinBaggage: "7 kg cabin",
        fareRules: [
          i % 3 === 1
            ? "Refundable — cancellation fee applies as per airline policy."
            : "Non-refundable — only statutory taxes are returned on cancellation.",
          "Date change permitted with an airline change fee plus fare difference.",
          "Name changes are not permitted after ticketing.",
          "Seat selection and meals may be chargeable depending on the fare family.",
        ],
        seatsRemaining: 2 + Math.floor(rand() * 8),
      },
      stops,
      totalDurationMinutes: totalMinutes,
      airlineCode: airline.code,
      airlineName: airline.name,
    });
  }

  return offers;
}

export class DemoFlightProvider implements FlightProvider {
  readonly name = "demo";
  readonly configured = true;

  async search(query: FlightSearchQuery): Promise<FlightSearchResult> {
    const offers = buildOffers(query);

    return {
      offers,
      dataSource: "demo",
      provider: "demo",
      notice:
        "These are demo itineraries and demo fares generated for this environment. They are not live airline inventory and cannot be ticketed with an airline.",
    };
  }

  async getOffer(offerId: string, query: FlightSearchQuery): Promise<FlightOffer | null> {
    const decoded = decodeOfferId(offerId);
    if (!decoded) return null;

    // Rebuild from the *decoded inputs*, so a tampered id yields a legitimately
    // re-priced itinerary rather than a discounted one.
    const offers = buildOffers({
      ...query,
      from: decoded.from,
      to: decoded.to,
      departDate: decoded.date,
      cabinClass: decoded.cabin,
      nonStopOnly: false,
    });

    return offers.find((o) => o.id === offerId) ?? null;
  }
}

export { AIRPORTS, decodeOfferId };
