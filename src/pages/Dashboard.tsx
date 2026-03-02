import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/useTripStore';
import { Plus, MapPin, Calendar, Users, LogOut, X } from 'lucide-react';
import type { Trip } from '../types/trip';

const Dashboard = () => {
  const { trips, logout, addTrip } = useTripStore();
  const navigate = useNavigate();

  // --- ESTADOS DO MODAL DE NOVA VIAGEM ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [travelers, setTravelers] = useState('');
  const [secretCode, setSecretCode] = useState('');

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!destination || !date || !secretCode) return;

    // Converte a string de viajantes num array (ex: "João, Ana" -> ["João", "Ana"])
    const travelersArray = travelers.split(',').map(t => t.trim()).filter(Boolean);

    const newTrip: Trip = {
      id: crypto.randomUUID(),
      destination,
      date,
      travelers: travelersArray.length > 0 ? travelersArray : ['Eu'],
      secretCode,
      expenses: [],
      itinerary: []
    };

    addTrip(newTrip);
    
    // Limpa o formulário e fecha o modal
    setDestination('');
    setDate('');
    setTravelers('');
    setSecretCode('');
    setIsModalOpen(false);

    // Redireciona o utilizador diretamente para o painel da nova viagem
    navigate(`/viagem/${newTrip.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white px-6 py-8 shadow-sm rounded-b-3xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Suas Viagens</h1>
            <h2 className="text-2xl font-bold text-slate-800">Olá, João! 👋</h2>
          </div>
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="p-2 bg-slate-100 rounded-full text-slate-600 active:bg-red-50 active:text-red-500"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Lista de Viagens */}
      <main className="p-6 space-y-4">
        {trips.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-medium">Você ainda não tem viagens planejadas.</p>
          </div>
        ) : (
          trips.map((trip) => (
            <div 
              key={trip.id}
              onClick={() => navigate(`/viagem/${trip.id}`)}
              className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 active:scale-[0.98] transition-transform"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-100 p-3 rounded-xl text-primary">
                  <MapPin size={24} />
                </div>
                <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase">
                  Confirmado
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-1">{trip.destination}</h3>
              
              <div className="flex items-center space-x-4 mt-4 text-slate-500 text-sm">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1" />
                  {trip.date}
                </div>
                <div className="flex items-center">
                  <Users size={16} className="mr-1" />
                  {trip.travelers.join(' e ')}
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Botão Flutuante (FAB) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-6 bg-primary text-white p-4 rounded-full shadow-2xl shadow-primary/40 active:scale-90 transition-transform z-40"
      >
        <Plus size={32} />
      </button>

      {/* OVERLAY E MODAL DE NOVA VIAGEM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsModalOpen(false)}
          />
          
          <div className="bg-white w-full h-[85vh] rounded-t-[2rem] p-6 relative animate-in slide-in-from-bottom-full duration-300 z-10 shadow-2xl overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-2 z-20">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nova Viagem</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-slate-100 text-slate-500 rounded-full active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-5 pb-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Destino</label>
                <input 
                  type="text" 
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Para onde vamos?" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium text-lg"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quando?</label>
                <input 
                  type="text" 
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="Ex: Dezembro 2026" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Viajantes</label>
                <input 
                  type="text" 
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  placeholder="Ex: João, Ana" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium"
                />
                <p className="text-xs text-slate-400 mt-2 ml-1">Separe os nomes por vírgula.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Código Secreto</label>
                <input 
                  type="password" 
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  placeholder="Crie uma senha numérica" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium tracking-widest"
                />
                <p className="text-xs text-slate-400 mt-2 ml-1">Você usará este código para acessar o app.</p>
              </div>

              <button 
                type="submit"
                className="w-full bg-primary hover:bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl mt-8 active:scale-95 transition-transform shadow-lg shadow-primary/30"
              >
                Criar Roteiro
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;