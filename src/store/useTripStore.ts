import { create } from 'zustand';
import type { Trip } from '../types/trip';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyAPWwfZ-59BXwkKlY88N4NZm7-nXrrJH4Y");

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

  // 📡 ESTA É A MÁGICA DO TEMPO REAL
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
    // 1. Instancia o modelo
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // 2. Monta o prompt dinâmico
    const prompt = `Escreva uma dica de planejamento de viagem muito útil, em português, com no máximo 3 frases, para o destino: ${trip.destination}.`;
    
    // 3. Pede para a IA gerar
    const result = await model.generateContent(prompt);
    const generatedTip = result.response.text();

    // 4. Adiciona a dica gerada ao objeto da viagem
    const tripWithAI = { ...trip, aiTip: generatedTip };

    // 5. Salva no Firestore (já com a dica embutida!)
    const tripRef = doc(db, 'trips', tripWithAI.id);
    await setDoc(tripRef, tripWithAI);
    
  } catch (error) {
    console.error("Erro ao gerar dica ou salvar:", error);
    // Fallback: salva sem a dica caso falhe ou fique sem internet
    const tripRef = doc(db, 'trips', trip.id);
    await setDoc(tripRef, trip);
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