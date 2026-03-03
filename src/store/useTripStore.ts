import { create } from 'zustand';
import type { Trip } from '../types/trip';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface TripState {
  trips: Trip[];
  isAuthenticated: boolean;
  login: (code: string) => boolean;
  logout: () => void;
  addTrip: (trip: Trip) => Promise<void>;
  updateTrip: (id: string, updatedTrip: Partial<Trip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  listenToTrips: () => () => void; // Retorna a função de unsubscribe
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [], // Começa vazio, o Firebase vai preencher automaticamente
  isAuthenticated: false,

  login: (code: string) => {
    // Valida se o código é '1234' (admin padrão) ou o código de alguma viagem específica
    const isValid = code === '1234' || get().trips.some(t => t.secretCode === code);
    set({ isAuthenticated: isValid });
    return isValid;
  },

  logout: () => set({ isAuthenticated: false }),

  listenToTrips: () => {
    const tripsCol = collection(db, 'trips');
    
    // onSnapshot escuta o banco. Se a Ana adicionar um custo no celular dela, 
    // esta função roda sozinha no seu celular e atualiza a tela na hora!
    const unsubscribe = onSnapshot(tripsCol, (snapshot) => {
      const tripsData = snapshot.docs.map(doc => doc.data() as Trip);
      set({ trips: tripsData });
    }, (error) => {
      console.error("Erro ao escutar viagens:", error);
    });

    return unsubscribe; 
  },

  addTrip: async (trip: Trip) => {
    try {
      let generatedTip = "Organize bem seu roteiro e baixe os mapas offline antes de sair do hotel!";

      // Tenta gerar a dica com a IA se a chave estiver configurada
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const totalTravelers = trip.travelers.adults + trip.travelers.children + trip.travelers.seniors;
          const prompt = `Atue como um guia de turismo local experiente. Escreva uma dica de planejamento de viagem muito útil e direta, em português, com no máximo 3 frases curtas. O destino é: ${trip.destination}. A viagem ocorrerá entre as datas: ${trip.startDate} e ${trip.endDate}. O grupo possui ${totalTravelers} pessoas (Adultos: ${trip.travelers.adults}, Crianças: ${trip.travelers.children}, Idosos: ${trip.travelers.seniors}). Foque em dicas práticas sobre clima, cultura local ou um conselho de ouro imperdível.`;
          const result = await model.generateContent(prompt);
          generatedTip = result.response.text().trim();
        } catch (aiError) {
          console.error("Falha ao gerar dica com IA (usando fallback):", aiError);
        }
      }

      // Adiciona a dica gerada ao objeto da viagem
      const tripWithAI: Trip = { ...trip, aiTip: generatedTip };

      const tripRef = doc(db, 'trips', tripWithAI.id);
      await setDoc(tripRef, tripWithAI); // Salva na nuvem com a dica
    } catch (error) {
      console.error("Erro ao adicionar viagem:", error);
    }
  },

  updateTrip: async (id: string, updatedTrip: Partial<Trip>) => {
    try {
      const tripRef = doc(db, 'trips', id);
      await updateDoc(tripRef, updatedTrip); // Atualiza na nuvem
    } catch (error) {
      console.error("Erro ao atualizar viagem:", error);
    }
  },

  deleteTrip: async (id: string) => {
    try {
      const tripRef = doc(db, 'trips', id);
      await deleteDoc(tripRef); // Deleta da nuvem
    } catch (error) {
      console.error("Erro ao deletar viagem:", error);
    }
  },
}));