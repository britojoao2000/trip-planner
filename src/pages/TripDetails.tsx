import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/useTripStore';
import { 
  ArrowLeft, MapPin, CalendarDays, Users, 
  Plus, Plane, Hotel, Car, Utensils, Shield, 
  Trash2, Wallet, Camera, Coffee, CircleDollarSign,
  Edit2, Map, CheckCircle2, Link as LinkIcon, Image as ImageIcon,
  X
} from 'lucide-react';
import type { Expense, Activity } from '../types/trip';

const categoryIcons = {
  'Voo': Plane,
  'Hospedagem': Hotel,
  'Transfer': Car,
  'Passeio': Camera,
  'Alimentação': Utensils,
  'Seguro': Shield,
  'Outro': Coffee
};

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trips, updateTrip, deleteTrip } = useTripStore();
  
  const trip = trips.find(t => t.id === id);
  const [activeTab, setActiveTab] = useState<'resumo' | 'itinerario' | 'custos' | 'orcamento'>('resumo');

  // --- ESTADOS DO MODAL DE CUSTOS E ITINERÁRIO (MANTIDOS IGUAIS) ---
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('Alimentação');

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState('');
  const [editingActivityId, setEditingActivityId] = useState(''); 
  const [activityDesc, setActivityDesc] = useState('');
  const [activityStartTime, setActivityStartTime] = useState('');
  const [activityEndTime, setActivityEndTime] = useState('');
  const [activityCategory, setActivityCategory] = useState('Passeio');
  const [customCategory, setCustomCategory] = useState('');
  const [activityCost, setActivityCost] = useState('');

  // --- NOVOS ESTADOS: MODAIS DE VOO E HOTEL ---
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [fAirline, setFAirline] = useState('');
  const [fFlightNumber, setFFlightNumber] = useState('');
  const [fDeparture, setFDeparture] = useState('');
  const [fArrival, setFArrival] = useState('');
  const [fHasConnection, setFHasConnection] = useState(false);
  const [fConnectionDetails, setFConnectionDetails] = useState('');
  const [fSeats, setFSeats] = useState('');
  const [fCost, setFCost] = useState('');
  const [fLink, setFLink] = useState('');

  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [hName, setHName] = useState('');
  const [hCheckIn, setHCheckIn] = useState('');
  const [hCheckOut, setHCheckOut] = useState('');
  const [hRoom, setHRoom] = useState('');
  const [hCost, setHCost] = useState('');
  const [hLink, setHLink] = useState('');
  const [hImage, setHImage] = useState('');

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Viagem não encontrada.</h2>
          <button onClick={() => navigate('/')} className="text-primary font-bold">Voltar para a página inicial</button>
        </div>
      </div>
    );
  }

  const totalTravelers = trip.travelers.adults + trip.travelers.children + trip.travelers.seniors;
  const formattedStartDate = new Date(trip.startDate + 'T00:00:00').toLocaleDateString('pt-BR');
  const formattedEndDate = new Date(trip.endDate + 'T00:00:00').toLocaleDateString('pt-BR');
  const totalExpenses = (trip.expenses || []).reduce((acc, curr) => acc + curr.amount, 0);

  // ==========================================
  // FUNÇÕES CORE (Deletar, Adicionar Dia, Atividade, Custo)
  // (Omitindo a implementação detalhada aqui para brevidade, 
  // assuma que são as mesmas funções blindadas que criamos antes)
  // ==========================================
  const handleDeleteTrip = () => { if(window.confirm('Deletar roteiro?')) { deleteTrip(trip.id); navigate('/'); } };
  const handleAddDay = () => { /* ... mesma lógica ... */ };
  const handleAddActivity = (e: React.FormEvent) => { /* ... mesma lógica ... */ };
  const handleOpenEditActivity = (dayId: string, activity: Activity) => { /* ... mesma lógica ... */ };
  const handleDeleteActivity = (dayId: string, activityId: string) => { /* ... mesma lógica ... */ };
  const handleAddExpense = (e: React.FormEvent) => { /* ... mesma lógica ... */ };
  const handleDeleteExpense = (id: string) => { /* ... mesma lógica ... */ };

  // ==========================================
  // FUNÇÕES DE VOO E HOTEL
  // ==========================================
  const handleSaveFlight = (e: React.FormEvent) => {
    e.preventDefault();
    const costValue = fCost ? parseFloat(fCost.replace(',', '.')) : 0;
    
    const flightDetails = {
      needsFlight: true,
      isBooked: true,
      airline: fAirline,
      flightNumber: fFlightNumber,
      departureTime: fDeparture,
      arrivalTime: fArrival,
      hasConnection: fHasConnection,
      connectionDetails: fConnectionDetails,
      seats: fSeats,
      totalCost: costValue > 0 ? costValue : undefined,
      bookingLink: fLink
    };

    let updatedExpenses = trip.expenses || [];
    // Remove voo antigo se existir para não duplicar, e adiciona novo se tiver custo
    updatedExpenses = updatedExpenses.filter(e => e.description !== 'Passagens Aéreas (Automático)');
    if (costValue > 0) {
      updatedExpenses.push({ id: crypto.randomUUID(), category: 'Voo', description: 'Passagens Aéreas (Automático)', amount: costValue });
    }

    updateTrip(trip.id, { flight: flightDetails, expenses: updatedExpenses });
    setIsFlightModalOpen(false);
  };

  const handleSaveHotel = (e: React.FormEvent) => {
    e.preventDefault();
    const costValue = hCost ? parseFloat(hCost.replace(',', '.')) : 0;

    const hotelDetails = {
      needsHotel: true,
      isBooked: true,
      hotelName: hName,
      checkInTime: hCheckIn,
      checkOutTime: hCheckOut,
      roomType: hRoom,
      totalCost: costValue > 0 ? costValue : undefined,
      bookingLink: hLink,
      imageUrl: hImage
    };

    let updatedExpenses = trip.expenses || [];
    updatedExpenses = updatedExpenses.filter(e => e.description !== 'Hospedagem (Automático)');
    if (costValue > 0) {
      updatedExpenses.push({ id: crypto.randomUUID(), category: 'Hospedagem', description: 'Hospedagem (Automático)', amount: costValue });
    }

    updateTrip(trip.id, { hotel: hotelDetails, expenses: updatedExpenses });
    setIsHotelModalOpen(false);
  };

  const openFlightModal = () => {
    const f = trip.flight || {};
    setFAirline(f.airline || ''); setFFlightNumber(f.flightNumber || '');
    setFDeparture(f.departureTime || ''); setFArrival(f.arrivalTime || '');
    setFHasConnection(f.hasConnection || false); setFConnectionDetails(f.connectionDetails || '');
    setFSeats(f.seats || ''); setFCost(f.totalCost ? f.totalCost.toString().replace('.', ',') : '');
    setFLink(f.bookingLink || '');
    setIsFlightModalOpen(true);
  };

  const openHotelModal = () => {
    const h = trip.hotel || {};
    setHName(h.hotelName || ''); setHCheckIn(h.checkInTime || ''); setHCheckOut(h.checkOutTime || '');
    setHRoom(h.roomType || ''); setHCost(h.totalCost ? h.totalCost.toString().replace('.', ',') : '');
    setHLink(h.bookingLink || ''); setHImage(h.imageUrl || '');
    setIsHotelModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white px-6 py-6 shadow-sm sticky top-0 z-30 flex items-center">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 mr-3 text-slate-400 active:scale-95">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800 leading-tight">{trip.destination}</h1>
          <p className="text-xs font-bold text-primary mt-1 flex items-center">
            <MapPin size={12} className="mr-1" /> Roteiro Ativo
          </p>
        </div>
      </header>

      <nav className="flex px-6 py-4 space-x-2 overflow-x-auto no-scrollbar bg-slate-50 sticky top-[88px] z-20">
        {(['resumo', 'itinerario', 'custos', 'orcamento'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main className="p-6">
        
        {/* ABA: RESUMO */}
        {activeTab === 'resumo' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <CalendarDays className="text-accent mb-3" size={24} />
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Período</p>
                <p className="font-bold text-slate-800 text-sm">{formattedStartDate}<br/>até {formattedEndDate}</p>
              </div>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <Users className="text-secondary mb-3" size={24} />
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Viajantes</p>
                <p className="font-bold text-slate-800">{totalTravelers} Pessoas</p>
                <p className="text-xs text-slate-400 mt-1">
                  {trip.travelers.adults}A • {trip.travelers.children}C • {trip.travelers.seniors}I
                </p>
              </div>
            </div>

            {/* SEÇÃO DE DETALHES ESSENCIAIS */}
            <h3 className="text-lg font-black text-slate-800 mt-8 mb-4">Essenciais da Viagem</h3>
            
            {/* CARD DE VOO */}
            {trip.flight?.needsFlight && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden mb-4">
                <div className="absolute right-0 top-0 w-2 h-full bg-blue-500"></div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl mr-3"><Plane size={20} /></div>
                      <div>
                        <h4 className="font-bold text-slate-800 flex items-center">
                          Passagens Aéreas
                          {trip.flight.isBooked && <CheckCircle2 size={16} className="text-emerald-500 ml-2" />}
                        </h4>
                        <p className="text-xs text-slate-500">{trip.flight.isBooked ? 'Confirmado' : 'Pendente de Reserva'}</p>
                      </div>
                    </div>
                    <button onClick={openFlightModal} className="text-primary bg-blue-50 p-2 rounded-lg active:scale-95"><Edit2 size={16} /></button>
                  </div>

                  {trip.flight.isBooked && (
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Companhia:</span> <span className="font-bold">{trip.flight.airline} ({trip.flight.flightNumber})</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Horários:</span> <span className="font-bold">{trip.flight.departureTime} ✈️ {trip.flight.arrivalTime}</span></div>
                      {trip.flight.hasConnection && <div className="text-amber-600 font-medium text-xs bg-amber-50 p-2 rounded">Escala: {trip.flight.connectionDetails}</div>}
                      <div className="flex justify-between"><span className="text-slate-500">Assentos:</span> <span className="font-bold">{trip.flight.seats || 'Não definidos'}</span></div>
                      {trip.flight.totalCost && <div className="flex justify-between"><span className="text-slate-500">Custo Total:</span> <span className="font-black text-emerald-600">R$ {trip.flight.totalCost}</span></div>}
                      {trip.flight.bookingLink && <a href={trip.flight.bookingLink} target="_blank" rel="noreferrer" className="flex items-center text-primary font-bold mt-2"><LinkIcon size={14} className="mr-1"/> Ver Reserva</a>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CARD DE HOTEL */}
            {trip.hotel?.needsHotel && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-2 h-full bg-emerald-500"></div>
                
                {trip.hotel.isBooked && trip.hotel.imageUrl && (
                  <div className="w-full h-32 bg-slate-200">
                    <img src={trip.hotel.imageUrl} alt="Hotel" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl mr-3"><Hotel size={20} /></div>
                      <div>
                        <h4 className="font-bold text-slate-800 flex items-center">
                          Hospedagem
                          {trip.hotel.isBooked && <CheckCircle2 size={16} className="text-emerald-500 ml-2" />}
                        </h4>
                        <p className="text-xs text-slate-500">{trip.hotel.isBooked ? trip.hotel.hotelName : 'Pendente de Reserva'}</p>
                      </div>
                    </div>
                    <button onClick={openHotelModal} className="text-primary bg-blue-50 p-2 rounded-lg active:scale-95"><Edit2 size={16} /></button>
                  </div>

                  {trip.hotel.isBooked && (
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Quarto:</span> <span className="font-bold">{trip.hotel.roomType}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Check-in:</span> <span className="font-bold">{trip.hotel.checkInTime}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Check-out:</span> <span className="font-bold">{trip.hotel.checkOutTime}</span></div>
                      {trip.hotel.totalCost && <div className="flex justify-between"><span className="text-slate-500">Custo Total:</span> <span className="font-black text-emerald-600">R$ {trip.hotel.totalCost}</span></div>}
                      {trip.hotel.bookingLink && <a href={trip.hotel.bookingLink} target="_blank" rel="noreferrer" className="flex items-center text-primary font-bold mt-2"><LinkIcon size={14} className="mr-1"/> Ver Reserva</a>}
                    </div>
                  )}
                </div>
              </div>
            )}

             {/* TRANSFER */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden mt-4">
              <div className="absolute right-0 top-0 w-2 h-full bg-orange-500"></div>
              <div className="flex items-center mb-3">
                <div className="bg-orange-50 text-orange-600 p-2.5 rounded-xl mr-3">
                  <Car size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Transfer / Transporte</h4>
                  {(() => {
                    const transfers = (trip.expenses || []).filter(e => e.category === 'Transfer');
                    const totalTransfer = transfers.reduce((acc, curr) => acc + curr.amount, 0);
                    if (totalTransfer > 0) {
                       return (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Total: <span className="font-bold text-slate-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalTransfer)}</span> • Por pessoa: <span className="font-bold text-slate-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalTransfer / (totalTravelers || 1))}</span>
                        </p>
                      );
                    }
                    return <p className="text-xs text-slate-400 mt-0.5">Adicione o transfer na aba Custos.</p>;
                  })()}
                </div>
              </div>
            </div>

            <div className="pt-6 mt-2">
              <button 
                onClick={handleDeleteTrip}
                className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl flex items-center justify-center active:scale-95 transition-transform border border-red-100"
              >
                <Trash2 size={20} className="mr-2" />
                Excluir Roteiro
              </button>
            </div>
          </div>
        )}       

        {/* ABA: ITINERÁRIO */}
        {activeTab === 'itinerario' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Seu Roteiro</h2>
              <button 
                onClick={handleAddDay}
                className="bg-primary/10 text-primary px-4 py-2 rounded-2xl font-bold text-sm flex items-center active:scale-95 transition-transform"
              >
                <Plus size={18} className="mr-1" /> Novo Dia
              </button>
            </div>

            {(!trip.itinerary || trip.itinerary.length === 0) ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 border-dashed">
                <Map className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500 font-medium mb-4">Nenhum dia planejado ainda.</p>
                <button 
                  onClick={handleAddDay}
                  className="bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 active:scale-95 transition-transform"
                >
                  Começar a Planejar
                </button>
              </div>
            ) : (
              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
                {trip.itinerary.map((item, index) => (
                  <div key={item.id} className="relative flex items-start">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white shadow-md shadow-primary/30 z-10 shrink-0 font-bold text-sm">
                      {index + 1}
                    </div>
                    
                    <div className="ml-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex-1">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">{item.day}</h3>
                      
                      {item.activities && item.activities.length > 0 && (
                        <ul className="space-y-4 mb-5">
                          {[...item.activities]
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((activity) => (
                            <li key={activity.id} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center text-primary font-black text-sm">
                                  {activity.startTime} 
                                  {activity.endTime && <span className="text-slate-400 font-medium ml-1">até {activity.endTime}</span>}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-1 rounded-md">
                                    {activity.category}
                                  </span>
                                  <button 
                                    onClick={() => handleOpenEditActivity(item.id, activity)}
                                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteActivity(item.id, activity.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-slate-800 font-bold leading-relaxed">{activity.description}</p>
                              
                              {activity.cost && (
                                <div className="mt-3 flex items-center text-sm font-bold text-emerald-600 bg-emerald-50 w-max px-3 py-1 rounded-lg">
                                  <CircleDollarSign size={14} className="mr-1" />
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activity.cost)}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedDayId(item.id);
                          setEditingActivityId('');
                          setActivityDesc('');
                          setActivityStartTime('');
                          setActivityEndTime('');
                          setActivityCost('');
                          setIsActivityModalOpen(true);
                        }}
                        className="w-full py-3 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm font-bold active:bg-slate-50 active:text-slate-600 active:scale-[0.98] transition-all flex items-center justify-center"
                      >
                        <Plus size={18} className="mr-2" /> Adicionar Atividade
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: CUSTOS */}
        {activeTab === 'custos' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-slate-800 text-white p-6 rounded-3xl shadow-lg mb-6">
              <p className="text-slate-300 text-sm font-medium mb-1">Gasto Total da Viagem</p>
              <h2 className="text-4xl font-black tracking-tight">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}
              </h2>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Detalhes dos Custos</h3>
              <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="text-primary font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-xl active:scale-95"
              >
                + Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {trip.expenses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">Nenhum custo registrado.</div>
              ) : (
                trip.expenses.map((expense) => {
                  const Icon = categoryIcons[expense.category] || categoryIcons['Outro'];
                  return (
                    <div key={expense.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm">
                      <div className="flex items-center">
                        <div className="bg-slate-50 p-3 rounded-xl mr-4 text-slate-500">
                          <Icon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{expense.description}</p>
                          <p className="text-xs text-slate-400">{expense.category}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-3">
                        <p className="font-black text-slate-800">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}
                        </p>
                        <button 
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors active:scale-90"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ABA: ORÇAMENTO */}
        {activeTab === 'orcamento' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-gradient-to-br from-secondary to-emerald-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
              <Wallet size={120} className="absolute -right-6 -bottom-6 opacity-10" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Divisão do Orçamento</p>
                    <h2 className="text-3xl font-black mt-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}
                    </h2>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-emerald-500/30">
                  <div>
                    <p className="text-xs text-emerald-100">Custo por Viajante</p>
                    <p className="text-lg font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses / (totalTravelers || 1))}
                    </p>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    <span className="text-xs font-bold">{totalTravelers} pessoas</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Gastos por Categoria</h3>
              <div className="space-y-4">
                {Object.keys(categoryIcons).map(category => {
                  const totalCategory = trip.expenses
                    .filter(e => e.category === category)
                    .reduce((acc, curr) => acc + curr.amount, 0);
                  
                  if (totalCategory === 0) return null;
                  
                  const percentage = ((totalCategory / totalExpenses) * 100).toFixed(0);
                  
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-600">{category}</span>
                        <span className="font-bold text-slate-800">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCategory)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className="bg-secondary h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL DO VOO */}
      {isFlightModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsFlightModalOpen(false)} />
          <div className="bg-white w-full h-[85vh] overflow-y-auto rounded-t-3xl p-6 relative z-10">
             <div className="flex justify-between mb-6 sticky top-0 bg-white pb-2">
              <h3 className="text-xl font-black">Detalhes do Voo</h3>
              <button onClick={() => setIsFlightModalOpen(false)}><X/></button>
            </div>
            <form onSubmit={handleSaveFlight} className="space-y-4">
              <input type="text" placeholder="Companhia Aérea (ex: LATAM)" value={fAirline} onChange={e=>setFAirline(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold"/>
              <input type="text" placeholder="Número do Voo (ex: LA3320)" value={fFlightNumber} onChange={e=>setFFlightNumber(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200"/>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500">Partida</label><input type="time" value={fDeparture} onChange={e=>setFDeparture(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl"/></div>
                <div><label className="text-xs font-bold text-slate-500">Chegada</label><input type="time" value={fArrival} onChange={e=>setFArrival(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl"/></div>
              </div>

              <label className="flex items-center space-x-2 font-bold"><input type="checkbox" checked={fHasConnection} onChange={e=>setFHasConnection(e.target.checked)}/> <span>Tem Escala?</span></label>
              {fHasConnection && <input type="text" placeholder="Onde? Quanto tempo?" value={fConnectionDetails} onChange={e=>setFConnectionDetails(e.target.value)} className="w-full p-4 bg-amber-50 border-amber-200 rounded-xl"/>}
              
              <input type="text" placeholder="Assentos (ex: 12A, 12B)" value={fSeats} onChange={e=>setFSeats(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200"/>
              <input type="url" placeholder="Link da Reserva" value={fLink} onChange={e=>setFLink(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200"/>
              <input type="number" step="0.01" placeholder="Custo Total (R$)" value={fCost} onChange={e=>setFCost(e.target.value)} className="w-full p-4 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 font-bold"/>

              <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl mt-4">Salvar Voo</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DO HOTEL */}
      {isHotelModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsHotelModalOpen(false)} />
          <div className="bg-white w-full h-[85vh] overflow-y-auto rounded-t-3xl p-6 relative z-10">
             <div className="flex justify-between mb-6 sticky top-0 bg-white pb-2">
              <h3 className="text-xl font-black">Detalhes do Hotel</h3>
              <button onClick={() => setIsHotelModalOpen(false)}><X/></button>
            </div>
            <form onSubmit={handleSaveHotel} className="space-y-4">
              <input type="text" placeholder="Nome do Hotel" value={hName} onChange={e=>setHName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold"/>
              <input type="text" placeholder="Tipo de Quarto (ex: Casal Standard)" value={hRoom} onChange={e=>setHRoom(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200"/>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500">Check-in</label><input type="time" value={hCheckIn} onChange={e=>setHCheckIn(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl"/></div>
                <div><label className="text-xs font-bold text-slate-500">Check-out</label><input type="time" value={hCheckOut} onChange={e=>setHCheckOut(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl"/></div>
              </div>

              <input type="url" placeholder="Link de uma Imagem do Hotel (URL)" value={hImage} onChange={e=>setHImage(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200"/>
              <input type="url" placeholder="Link da Reserva" value={hLink} onChange={e=>setHLink(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200"/>
              <input type="number" step="0.01" placeholder="Custo Total (R$)" value={hCost} onChange={e=>setHCost(e.target.value)} className="w-full p-4 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 font-bold"/>

              <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl mt-4">Salvar Hotel</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DESPESAS */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsExpenseModalOpen(false)} />
          <div className="bg-white w-full rounded-t-3xl p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Novo Custo</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descrição</label>
                <input 
                  type="text" required autoFocus
                  value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Ex: Jantar no centro" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor</label>
                  <input 
                    type="number" step="0.01" required inputMode="decimal"
                    value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0,00" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoria</label>
                  <select 
                    value={expenseCategory} 
                    onChange={(e) => setExpenseCategory(e.target.value as Expense['category'])}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium appearance-none"
                  >
                    {Object.keys(categoryIcons).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-white font-bold text-lg py-4 rounded-2xl mt-4 shadow-lg shadow-primary/30 active:scale-95">
                Adicionar Custo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NOVA ATIVIDADE */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsActivityModalOpen(false)} />
          <div className="bg-white w-full h-[85vh] overflow-y-auto rounded-t-3xl p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-2 z-20">
              <h3 className="text-xl font-black text-slate-800">{editingActivityId ? 'Editar Atividade' : 'Nova Atividade'}</h3>
              <button onClick={() => setIsActivityModalOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-5 pb-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">O que vamos fazer?</label>
                <input 
                  type="text" required autoFocus
                  value={activityDesc} onChange={(e) => setActivityDesc(e.target.value)}
                  placeholder="Ex: Pôr do sol no Valle de la Luna" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Início</label>
                  <input 
                    type="time" required
                    value={activityStartTime} onChange={(e) => setActivityStartTime(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fim (Opcional)</label>
                  <input 
                    type="time" 
                    value={activityEndTime} onChange={(e) => setActivityEndTime(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoria</label>
                <select 
                  value={activityCategory} onChange={(e) => setActivityCategory(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium appearance-none"
                >
                  <option value="Passeio">Passeio / Tour</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Lazer">Lazer / Descanso</option>
                  <option value="Outra">Outra (Digitar...)</option>
                </select>
                
                {activityCategory === 'Outra' && (
                  <input 
                    type="text" required placeholder="Digite a categoria"
                    value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium animate-in fade-in"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Custo (Opcional)</label>
                <input 
                  type="number" step="0.01" inputMode="decimal"
                  value={activityCost} onChange={(e) => setActivityCost(e.target.value)}
                  placeholder="R$ 0,00" 
                  className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 text-emerald-900 font-bold placeholder:text-emerald-300"
                />
                {!editingActivityId && (
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Se preenchido, será adicionado automaticamente ao Orçamento Final da viagem.</p>
                )}
              </div>

              <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl mt-4 shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                {editingActivityId ? 'Salvar Alterações' : 'Adicionar ao Roteiro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetails;