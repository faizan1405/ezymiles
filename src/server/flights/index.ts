import "server-only";
import { integrations } from "@/lib/env";
import type { FlightOffer, FlightProvider, FlightSearchQuery, FlightSearchResult } from "./types";
import { connectDB } from "@/lib/db";
import { FlightSearch } from "@/models";

/**
 * Flight provider registry.
 *
 * Adding an authorised GDS/NDC supplier (Amadeus, Travelport, a consolidator)
 * means implementing `FlightProvider` and registering it here. Nothing in the
 * UI or the booking flow needs to change — they only speak the interface.
 *
 * We never scrape airline or OTA websites; a provider must be a contracted API.
 */

class AmadeusFlightProvider implements FlightProvider {
  readonly name = "amadeus";

  get configured() {
    return integrations.liveFlights;
  }

  async search(): Promise<FlightSearchResult> {
    throw new Error(
      "The Amadeus provider is registered but not implemented. Add your Self-Service credentials and implement search() against the Flight Offers Search API.",
    );
  }

  async getOffer(): Promise<FlightOffer | null> {
    throw new Error("The Amadeus provider is not implemented yet.");
  }
}

const amadeus = new AmadeusFlightProvider();

export function getFlightProvider(): FlightProvider {
  if (process.env.FLIGHT_PROVIDER === "amadeus" && amadeus.configured) return amadeus;
  throw new Error(
    "No flight provider is available. Set FLIGHT_PROVIDER=amadeus and configure AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET to enable flight search.",
  );
}

/** Search + record the query (powers "popular routes" in the admin dashboard). */
export async function searchFlights(query: FlightSearchQuery): Promise<FlightSearchResult> {
  const provider = getFlightProvider();

  let result: FlightSearchResult;

  try {
    result = await provider.search(query);
  } catch (error) {
    console.error("[flights] provider failed:", error);
    return {
      offers: [],
      provider: provider.name,
      dataSource: "estimated",
      notice:
        "We could not reach the flight supplier just now. Please try again, or send us an enquiry and we'll quote it manually.",
    };
  }

  // Analytics only — never blocks the response.
  try {
    await connectDB();
    await FlightSearch.create({
      tripType: query.tripType,
      legs: [{ from: query.from, to: query.to, date: new Date(query.departDate) }],
      adults: query.adults,
      children: query.children,
      infants: query.infants,
      cabinClass: query.cabinClass,
      nonStopOnly: Boolean(query.nonStopOnly),
      provider: result.provider,
      dataSource: result.dataSource,
      resultCount: result.offers.length,
    });
  } catch {
    // A logging failure must never break a search.
  }

  return result;
}

export * from "./types";
