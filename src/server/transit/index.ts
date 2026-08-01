export interface BusRoute {
  id: string;
  from: string;
  to: string;
  operator: string;
  type: "ac-sleeper" | "non-ac-sleeper" | "ac-seater" | "non-ac-seater" | "volvo";
  departureTime: string;
  arrivalTime: string;
  durationHours: number;
  durationMinutes: number;
  startingPriceINR: number;
  rating: number;
  amenities: string[];
}

export interface TrainRoute {
  id: string;
  from: string;
  to: string;
  trainNumber: string;
  trainName: string;
  trainType: "express" | "superfast" | "vande-bharat" | "rajdhani" | "shatabdi";
  departureTime: string;
  arrivalTime: string;
  durationHours: number;
  durationMinutes: number;
  startingPriceINR: number;
  classes: { code: string; label: string; priceINR: number; available: number }[];
  daysOfWeek: number[];
  rating: number;
}

const BUS_ROUTES: BusRoute[] = [
  {
    id: "bus-delhi-chandigarh-1",
    from: "Delhi",
    to: "Chandigarh",
    operator: "Himachal Tourism",
    type: "ac-sleeper",
    departureTime: "08:00",
    arrivalTime: "13:00",
    durationHours: 5,
    durationMinutes: 0,
    startingPriceINR: 650,
    rating: 4.2,
    amenities: ["WiFi", "Charging", "Blanket"],
  },
  {
    id: "bus-delhi-chandigarh-2",
    from: "Delhi",
    to: "Chandigarh",
    operator: "Zingbus",
    type: "volvo",
    departureTime: "14:00",
    arrivalTime: "19:00",
    durationHours: 5,
    durationMinutes: 0,
    startingPriceINR: 800,
    rating: 4.4,
    amenities: ["WiFi", "Charging", "Water", "Blanket", "Snacks"],
  },
  {
    id: "bus-delhi-manali-1",
    from: "Delhi",
    to: "Manali",
    operator: "HRTC",
    type: "ac-sleeper",
    departureTime: "20:00",
    arrivalTime: "08:00",
    durationHours: 12,
    durationMinutes: 0,
    startingPriceINR: 1500,
    rating: 4.0,
    amenities: ["Charging", "Blanket", "Reading light"],
  },
  {
    id: "bus-chandigarh-shimla-1",
    from: "Chandigarh",
    to: "Shimla",
    operator: "Himachal Tourism",
    type: "ac-seater",
    departureTime: "07:00",
    arrivalTime: "10:30",
    durationHours: 3,
    durationMinutes: 30,
    startingPriceINR: 450,
    rating: 4.3,
    amenities: ["WiFi", "Charging"],
  },
  {
    id: "bus-chandigarh-shimla-2",
    from: "Chandigarh",
    to: "Shimla",
    operator: "HPTDC",
    type: "volvo",
    departureTime: "13:00",
    arrivalTime: "16:30",
    durationHours: 3,
    durationMinutes: 30,
    startingPriceINR: 550,
    rating: 4.5,
    amenities: ["WiFi", "Charging", "Water", "Blanket", "Reclining seat"],
  },
  {
    id: "bus-delhi-jaipur-1",
    from: "Delhi",
    to: "Jaipur",
    operator: "RSRTC",
    type: "ac-sleeper",
    departureTime: "22:00",
    arrivalTime: "07:00",
    durationHours: 9,
    durationMinutes: 0,
    startingPriceINR: 900,
    rating: 4.1,
    amenities: ["Charging", "Blanket", "Reading light"],
  },
  {
    id: "bus-delhi-agra-1",
    from: "Delhi",
    to: "Agra",
    operator: "UPSRTC",
    type: "volvo",
    departureTime: "06:00",
    arrivalTime: "10:00",
    durationHours: 4,
    durationMinutes: 0,
    startingPriceINR: 550,
    rating: 4.2,
    amenities: ["WiFi", "Charging", "Water", "Blanket"],
  },
  {
    id: "bus-delhi-amritsar-1",
    from: "Delhi",
    to: "Amritsar",
    operator: "PUNBUS",
    type: "ac-seater",
    departureTime: "21:00",
    arrivalTime: "07:00",
    durationHours: 10,
    durationMinutes: 0,
    startingPriceINR: 850,
    rating: 3.9,
    amenities: ["Charging", "Water"],
  },
  {
    id: "bus-mumbai-pune-1",
    from: "Mumbai",
    to: "Pune",
    operator: "MSRTC",
    type: "volvo",
    departureTime: "07:00",
    arrivalTime: "11:30",
    durationHours: 4,
    durationMinutes: 30,
    startingPriceINR: 600,
    rating: 4.3,
    amenities: ["WiFi", "Charging", "Water", "Blanket"],
  },
  {
    id: "bus-bangalore-goa-1",
    from: "Bangalore",
    to: "Goa",
    operator: "VRL",
    type: "ac-sleeper",
    departureTime: "21:00",
    arrivalTime: "10:00",
    durationHours: 13,
    durationMinutes: 0,
    startingPriceINR: 1800,
    rating: 4.4,
    amenities: ["WiFi", "Charging", "Water", "Blanket", "Snacks"],
  },
  {
    id: "bus-chennai-bangalore-1",
    from: "Chennai",
    to: "Bangalore",
    operator: "SRM",
    type: "volvo",
    departureTime: "06:00",
    arrivalTime: "12:30",
    durationHours: 6,
    durationMinutes: 30,
    startingPriceINR: 700,
    rating: 4.1,
    amenities: ["Charging", "Water", "Blanket"],
  },
  {
    id: "bus-hyderabad-bangalore-1",
    from: "Hyderabad",
    to: "Bangalore",
    operator: "ORR",
    type: "ac-seater",
    departureTime: "22:00",
    arrivalTime: "06:00",
    durationHours: 8,
    durationMinutes: 0,
    startingPriceINR: 900,
    rating: 4.2,
    amenities: ["Charging", "Blanket", "Reading light"],
  },
];

const TRAIN_ROUTES: TrainRoute[] = [
  {
    id: "train-delhi-chandigarh-1",
    from: "Delhi",
    to: "Chandigarh",
    trainNumber: "12045",
    trainName: "Kalka Shatabdi",
    trainType: "shatabdi",
    departureTime: "07:15",
    arrivalTime: "10:50",
    durationHours: 3,
    durationMinutes: 35,
    startingPriceINR: 380,
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    classes: [
      { code: "CC", label: "Chair Car", priceINR: 380, available: 120 },
      { code: "EC", label: "Executive Chair", priceINR: 580, available: 40 },
    ],
    rating: 4.5,
  },
  {
    id: "train-delhi-chandigarh-2",
    from: "Delhi",
    to: "Chandigarh",
    trainNumber: "12011",
    trainName: "New Delhi–Chandigarh Shatabdi",
    trainType: "shatabdi",
    departureTime: "12:15",
    arrivalTime: "16:00",
    durationHours: 3,
    durationMinutes: 45,
    startingPriceINR: 360,
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    classes: [
      { code: "CC", label: "Chair Car", priceINR: 360, available: 80 },
      { code: "EC", label: "Executive Chair", priceINR: 560, available: 30 },
    ],
    rating: 4.4,
  },
  {
    id: "train-delhi-shimla-1",
    from: "Delhi",
    to: "Shimla",
    trainNumber: "22405",
    trainName: "Kalka Shimla Express",
    trainType: "express",
    departureTime: "09:30",
    arrivalTime: "19:30",
    durationHours: 10,
    durationMinutes: 0,
    startingPriceINR: 250,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    classes: [
      { code: "SL", label: "Sleeper", priceINR: 250, available: 60 },
      { code: "3A", label: "3rd AC", priceINR: 750, available: 20 },
    ],
    rating: 4.0,
  },
  {
    id: "train-delhi-jaipur-1",
    from: "Delhi",
    to: "Jaipur",
    trainNumber: "12015",
    trainName: "Ajmer Shatabdi",
    trainType: "shatabdi",
    departureTime: "06:05",
    arrivalTime: "10:35",
    durationHours: 4,
    durationMinutes: 30,
    startingPriceINR: 400,
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    classes: [
      { code: "CC", label: "Chair Car", priceINR: 400, available: 100 },
      { code: "EC", label: "Executive Chair", priceINR: 650, available: 25 },
    ],
    rating: 4.3,
  },
  {
    id: "train-delhi-agra-1",
    from: "Delhi",
    to: "Agra",
    trainNumber: "12051",
    trainName: "Taj Express",
    trainType: "express",
    departureTime: "07:00",
    arrivalTime: "10:30",
    durationHours: 3,
    durationMinutes: 30,
    startingPriceINR: 280,
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    classes: [
      { code: "CC", label: "Chair Car", priceINR: 280, available: 150 },
      { code: "2S", label: "2nd Seater", priceINR: 180, available: 200 },
    ],
    rating: 4.1,
  },
  {
    id: "train-mumbai-pune-1",
    from: "Mumbai",
    to: "Pune",
    trainNumber: "22226",
    trainName: "Pune Vande Bharat",
    trainType: "vande-bharat",
    departureTime: "06:00",
    arrivalTime: "09:15",
    durationHours: 3,
    durationMinutes: 15,
    startingPriceINR: 450,
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    classes: [
      { code: "CC", label: "Chair Car", priceINR: 450, available: 90 },
      { code: "EC", label: "Executive Chair", priceINR: 750, available: 20 },
    ],
    rating: 4.6,
  },
  {
    id: "train-chennai-bangalore-1",
    from: "Chennai",
    to: "Bangalore",
    trainNumber: "22677",
    trainName: "Uday Express",
    trainType: "superfast",
    departureTime: "06:10",
    arrivalTime: "12:15",
    durationHours: 6,
    durationMinutes: 5,
    startingPriceINR: 350,
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    classes: [
      { code: "CC", label: "Chair Car", priceINR: 350, available: 110 },
      { code: "SL", label: "Sleeper", priceINR: 500, available: 40 },
    ],
    rating: 4.2,
  },
  {
    id: "train-hyderabad-bangalore-1",
    from: "Hyderabad",
    to: "Bangalore",
    trainNumber: "22691",
    trainName: "Rajdhani Express",
    trainType: "rajdhani",
    departureTime: "18:00",
    arrivalTime: "08:30",
    durationHours: 14,
    durationMinutes: 30,
    startingPriceINR: 600,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    classes: [
      { code: "3A", label: "3rd AC", priceINR: 600, available: 30 },
      { code: "2A", label: "2nd AC", priceINR: 950, available: 15 },
    ],
    rating: 4.4,
  },
  {
    id: "train-delhi-amritsar-1",
    from: "Delhi",
    to: "Amritsar",
    trainNumber: "12029",
    trainName: "Swarna Shatabdi",
    trainType: "shatabdi",
    departureTime: "07:20",
    arrivalTime: "13:30",
    durationHours: 6,
    durationMinutes: 10,
    startingPriceINR: 420,
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    classes: [
      { code: "CC", label: "Chair Car", priceINR: 420, available: 85 },
      { code: "EC", label: "Executive Chair", priceINR: 680, available: 20 },
    ],
    rating: 4.5,
  },
  {
    id: "train-kolkata-delhi-1",
    from: "Kolkata",
    to: "Delhi",
    trainNumber: "12301",
    trainName: "Howrah Rajdhani",
    trainType: "rajdhani",
    departureTime: "16:55",
    arrivalTime: "10:05",
    durationHours: 17,
    durationMinutes: 10,
    startingPriceINR: 1400,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    classes: [
      { code: "3A", label: "3rd AC", priceINR: 1400, available: 25 },
      { code: "2A", label: "2nd AC", priceINR: 2100, available: 12 },
    ],
    rating: 4.6,
  },
];

export function getBusRoutes(): BusRoute[] {
  return BUS_ROUTES;
}

export function getTrainRoutes(): TrainRoute[] {
  return TRAIN_ROUTES;
}

export function getBusRouteById(id: string): BusRoute | undefined {
  return BUS_ROUTES.find((r) => r.id === id);
}

export function getTrainRouteById(id: string): TrainRoute | undefined {
  return TRAIN_ROUTES.find((r) => r.id === id);
}

export function searchBusRoutes(filters: {
  from?: string;
  to?: string;
  date?: string;
  maxPrice?: number;
}): BusRoute[] {
  return BUS_ROUTES.filter((r) => {
    if (filters.from && r.from.toLowerCase() !== filters.from.toLowerCase()) return false;
    if (filters.to && r.to.toLowerCase() !== filters.to.toLowerCase()) return false;
    if (filters.maxPrice && r.startingPriceINR > filters.maxPrice) return false;
    return true;
  });
}

export function searchTrainRoutes(filters: {
  from?: string;
  to?: string;
  date?: string;
  maxPrice?: number;
}): TrainRoute[] {
  return TRAIN_ROUTES.filter((r) => {
    if (filters.from && r.from.toLowerCase() !== filters.from.toLowerCase()) return false;
    if (filters.to && r.to.toLowerCase() !== filters.to.toLowerCase()) return false;
    if (filters.maxPrice && r.startingPriceINR > filters.maxPrice) return false;
    return true;
  });
}

export function getBusCities(): string[] {
  const cities = new Set<string>();
  for (const r of BUS_ROUTES) {
    cities.add(r.from);
    cities.add(r.to);
  }
  return [...cities].sort();
}

export function getTrainCities(): string[] {
  const cities = new Set<string>();
  for (const r of TRAIN_ROUTES) {
    cities.add(r.from);
    cities.add(r.to);
  }
  return [...cities].sort();
}
