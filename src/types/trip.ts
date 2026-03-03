export interface Expense {
  id: string;
  category: 'Voo' | 'Hospedagem' | 'Transfer' | 'Passeio' | 'Alimentação' | 'Seguro' | 'Outro';
  description: string;
  amount: number;
}

export interface Activity {
  id: string;
  description: string;
  startTime: string;
  endTime?: string;
  category: string;
  cost?: number;
}

export interface ItineraryItem {
  id: string;
  day: string;
  activities: Activity[]; 
}

export interface Travelers {
  adults: number;
  children: number;
  seniors: number;
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string; // Data de ida
  endDate: string;   // Data de volta
  travelers: Travelers;
  expenses: Expense[];
  itinerary: ItineraryItem[];
  secretCode: string;
  aiTip?: string;
  flight: FlightDetails;
  hotel: HotelDetails;
}

export interface FlightDetails {
  needsFlight: boolean;
  isBooked: boolean;
  airline?: string;
  flightNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
  hasConnection?: boolean;
  connectionDetails?: string;
  seats?: string;
  totalCost?: number;
  bookingLink?: string;
}

export interface HotelDetails {
  needsHotel: boolean;
  isBooked: boolean;
  hotelName?: string;
  checkInTime?: string;
  checkOutTime?: string;
  roomType?: string;
  totalCost?: number;
  bookingLink?: string;
  imageUrl?: string;
}