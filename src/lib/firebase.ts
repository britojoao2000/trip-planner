import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// SUBSTITUA ESTE OBJETO PELAS SUAS CHAVES DO FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyDPSho5x2Uhf_HDgN3UZ5fVB-9M_ZnGGjI",
  authDomain: "trip-planner-pwa-5011d.firebaseapp.com",
  projectId: "trip-planner-pwa-5011d",
  storageBucket: "trip-planner-pwa-5011d.firebasestorage.app",
  messagingSenderId: "236080345621",
  appId: "1:236080345621:web:a618922e9aca67bdf4541c",
  measurementId: "G-58E335352T"
};


// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Firestore (Banco de Dados)
export const db = getFirestore(app);
export const storage = getStorage(app);

// Ativa a persistência offline (A mágica do PWA para o deserto!)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Múltiplas abas abertas, persistência offline ativada apenas em uma.');
  } else if (err.code == 'unimplemented') {
    console.warn('O navegador atual não suporta persistência offline.');
  }
});