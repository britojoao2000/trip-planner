export interface Expense {
  id: string;
  category: 'Voo' | 'Hospedagem' | 'Transfer' | 'Passeio' | 'Alimentação' | 'Seguro';
  description: string;
  amount: number;
}

export interface ItineraryItem {
  id: string;
  day: string; // Ex: "Dia 1" ou "15/10"
  activities: string[];
}

export interface Trip {
  id: string;
  destination: string;
  date: string;
  travelers: string[];
  expenses: Expense[];
  itinerary: ItineraryItem[];
  secretCode: string;
  aiTip?: string;
}