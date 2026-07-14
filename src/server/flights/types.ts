import type { DataSource } from "@/config/site";

export interface FlightSegment {
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  from: string;
  fromAirport: string;
  to: string;
  toAirport: string;
  departAt: string;
  arriveAt: string;
  durationMinutes: number;
  cabinClass: string;
  aircraft?: string;
}

export interface FlightFare {
  baseINR: number;
  taxesINR: number;
  totalINR: number;
  /** Total for the whole party, not per traveller. */
  totalForPartyINR: number;
  refundable: boolean;
  baggage: string;
  cabinBaggage: string;
  fareRules: string[];
  seatsRemaining?: number;
}

export interface FlightOffer {
  /** Encodes the *inputs* that define this itinerary — never the price. */
  id: string;
  provider: string;
  /** Always displayed to the traveller. Demo fares are never dressed up as live. */
  dataSource: DataSource;
  outbound: FlightSegment[];
  inbound?: FlightSegment[];
  fare: FlightFare;
  stops: number;
  totalDurationMinutes: number;
  airlineCode: string;
  airlineName: string;
}

export interface FlightSearchQuery {
  tripType: "one_way" | "round_trip" | "multi_city";
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  cabinClass: string;
  nonStopOnly?: boolean;
}

export interface FlightSearchResult {
  offers: FlightOffer[];
  dataSource: DataSource;
  provider: string;
  /** Present when we could not reach a live provider and had to explain why. */
  notice?: string;
}

export interface FlightProvider {
  readonly name: string;
  readonly configured: boolean;
  search(query: FlightSearchQuery): Promise<FlightSearchResult>;
  /** Re-price a single offer server-side before any money is taken. */
  getOffer(offerId: string, query: FlightSearchQuery): Promise<FlightOffer | null>;
}
