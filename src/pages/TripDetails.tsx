import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/useTripStore';
import { 
  ArrowLeft, MapPin, CalendarDays, Users, 
  Plus, Plane, Hotel, Car, Utensils, Shield, 
  Trash2, Wallet, Camera, Coffee, CircleDollarSign,
  Edit2, Map, X, BedDouble, Building2, Navigation,
  Star, ExternalLink, ImagePlus, Link, CheckCircle2, Circle
} from 'lucide-react';
import type { Expense, Activity } from '../types/trip';

// ==========================================
// TYPES
// ==========================================
interface HotelRoom {
  id: string;
  type: string;
  quantity: number;
  pricePerNight: number;
  guests: number;
}

interface HotelInfo {
  id: string;
  name: string;
  address: string;
  stars: number;
  checkIn: string;
  checkOut: string;
  checkInTime: string;
  checkOutTime: string;
  phone: string;
  notes: string;
  rooms: HotelRoom[];
  images: string[];       // base64 data URLs
  bookingUrl: string;     // link para reserva
  isSelected?: boolean;   // Nova flag para definir se é a opção escolhida
}

interface FlightLeg {
  id: string;
  direction: 'ida' | 'volta';
  airline: string;
  flightNumber: string;
  fromAirport: string;
  fromCity: string;
  toAirport: string;
  toCity: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  seatType: 'Econômica' | 'Econômica Premium' | 'Executiva' | 'Primeira Classe';
  pricePerPerson: number;
  totalPrice: number;
  baggageIncluded: boolean;
  notes: string;
}

const categoryIcons: Record<string, React.ElementType> = {
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
  const [activeTab, setActiveTab] = useState<'resumo' | 'itinerario' | 'custos' | 'orcamento' | 'hotel' | 'voo'>('resumo');

  // --- ESTADOS DO MODAL DE CUSTOS ---
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('Alimentação');

  // --- ESTADOS DO MODAL DE ITINERÁRIO ---
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState('');
  const [editingActivityId, setEditingActivityId] = useState(''); 
  const [activityDesc, setActivityDesc] = useState('');
  const [activityStartTime, setActivityStartTime] = useState('');
  const [activityEndTime, setActivityEndTime] = useState('');
  const [activityCategory, setActivityCategory] = useState('Passeio');
  const [customCategory, setCustomCategory] = useState('');
  const [activityCost, setActivityCost] = useState('');

  // --- ESTADOS DO MODAL DE HOTEL ---
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [editingHotelId, setEditingHotelId] = useState('');
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState('');
  
  const initialHotelState: HotelInfo = {
    id: '', name: '', address: '', stars: 3, checkIn: trip?.startDate || '', checkOut: trip?.endDate || '',
    checkInTime: '14:00', checkOutTime: '12:00', phone: '', notes: '', rooms: [],
    images: [], bookingUrl: '', isSelected: false
  };
  const [hotelForm, setHotelForm] = useState<HotelInfo>(initialHotelState);
  
  const [roomForm, setRoomForm] = useState<Omit<HotelRoom, 'id'>>({
    type: 'Standard', quantity: 1, pricePerNight: 0, guests: 2
  });

  // --- ESTADOS DO MODAL DE VOO ---
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [editingFlightId, setEditingFlightId] = useState('');
  const [flightForm, setFlightForm] = useState<Omit<FlightLeg, 'id'>>({
    direction: 'ida',
    airline: '', flightNumber: '', fromAirport: '', fromCity: '',
    toAirport: '', toCity: '', departureDate: trip?.startDate || '', departureTime: '',
    arrivalDate: trip?.startDate || '', arrivalTime: '', seatType: 'Econômica',
    pricePerPerson: 0, totalPrice: 0, baggageIncluded: false, notes: ''
  });

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

  // Derived hotel/flight data from trip (stored as custom fields)
  const hotels: HotelInfo[] = (trip as any).hotels || [];
  const flights: FlightLeg[] = (trip as any).flights || [];
  
  const selectedHotel = hotels.find(h => h.isSelected) || null;

  // ==========================================
  // CÁLCULOS FINANCEIROS E GERAIS
  // ==========================================
  const calcNights = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return 0;
    const a = new Date(checkIn + 'T00:00:00');
    const b = new Date(checkOut + 'T00:00:00');
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const calcHotelTotal = (hotel: HotelInfo) => {
    const nights = calcNights(hotel.checkIn, hotel.checkOut);
    return (hotel.rooms || []).reduce((acc, r) => acc + r.pricePerNight * r.quantity * nights, 0);
  };

  const totalManualExpenses = trip.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalFlights = flights.reduce((acc, f) => acc + f.totalPrice, 0);
  const totalSelectedHotel = selectedHotel ? calcHotelTotal(selectedHotel) : 0;
  
  // O Grande Total soma as despesas manuais + os voos + o HOTEL SELECIONADO
  const grandTotal = totalManualExpenses + totalFlights + totalSelectedHotel;

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // ==========================================
  // FUNÇÕES DE VIAGEM E DIAS
  // ==========================================
  const handleDeleteTrip = () => {
    if (window.confirm(`Tem certeza que deseja excluir o roteiro para ${trip.destination}?`)) {
      deleteTrip(trip.id);
      navigate('/');
    }
  };

  const handleAddDay = () => {
    const safeItinerary = trip.itinerary || [];
    const newDay = {
      id: crypto.randomUUID(),
      day: `Dia ${safeItinerary.length + 1}`,
      activities: []
    };
    updateTrip(trip.id, { itinerary: [...safeItinerary, newDay] });
  };

  // ==========================================
  // FUNÇÕES DE ATIVIDADE
  // ==========================================
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityDesc || !selectedDayId || !activityStartTime) return;

    const finalCategory = activityCategory === 'Outra' ? customCategory : activityCategory;
    const costValue = activityCost ? parseFloat(activityCost.replace(',', '.')) : 0;

    const newActivity: Activity = {
      id: editingActivityId || crypto.randomUUID(),
      description: activityDesc,
      startTime: activityStartTime,
      endTime: activityEndTime,
      category: finalCategory,
      cost: costValue > 0 ? costValue : undefined,
    };

    const safeItinerary = trip.itinerary || [];
    const updatedItinerary = safeItinerary.map(day => {
      if (day.id === selectedDayId) {
        const safeActivities = day.activities || [];
        if (editingActivityId) {
          return { ...day, activities: safeActivities.map(a => a.id === editingActivityId ? newActivity : a) };
        }
        return { ...day, activities: [...safeActivities, newActivity] };
      }
      return day;
    });

    const safeExpenses = trip.expenses || [];
    let updatedExpenses = safeExpenses;
    if (!editingActivityId && costValue > 0) {
      updatedExpenses = [...safeExpenses, {
        id: crypto.randomUUID(),
        category: finalCategory === 'Alimentação' ? 'Alimentação' : 'Passeio',
        description: activityDesc,
        amount: costValue
      }];
    }

    updateTrip(trip.id, { itinerary: updatedItinerary, expenses: updatedExpenses });
    setActivityDesc(''); setActivityStartTime(''); setActivityEndTime('');
    setActivityCategory('Passeio'); setCustomCategory(''); setActivityCost('');
    setEditingActivityId(''); setIsActivityModalOpen(false);
  };

  const handleOpenEditActivity = (dayId: string, activity: Activity) => {
    setSelectedDayId(dayId); setEditingActivityId(activity.id);
    setActivityDesc(activity.description); setActivityStartTime(activity.startTime);
    setActivityEndTime(activity.endTime || '');
    setActivityCost(activity.cost ? activity.cost.toString().replace('.', ',') : '');
    const defaultCategories = ['Passeio', 'Alimentação', 'Transporte', 'Lazer'];
    if (defaultCategories.includes(activity.category)) {
      setActivityCategory(activity.category); setCustomCategory('');
    } else {
      setActivityCategory('Outra'); setCustomCategory(activity.category);
    }
    setIsActivityModalOpen(true);
  };

  const handleDeleteActivity = (dayId: string, activityId: string) => {
    if (window.confirm('Tem certeza que deseja apagar esta atividade?')) {
      const updatedItinerary = (trip.itinerary || []).map(day => {
        if (day.id === dayId) {
          return { ...day, activities: (day.activities || []).filter(a => a.id !== activityId) };
        }
        return day;
      });
      updateTrip(trip.id, { itinerary: updatedItinerary });
    }
  };

  // ==========================================
  // FUNÇÕES DE DESPESAS MANUAIS
  // ==========================================
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount) return;
    const newExpense: Expense = {
      id: crypto.randomUUID(), category: expenseCategory,
      description: expenseDesc, amount: parseFloat(expenseAmount.replace(',', '.'))
    };
    updateTrip(trip.id, { expenses: [...(trip.expenses || []), newExpense] });
    setExpenseDesc(''); setExpenseAmount(''); setIsExpenseModalOpen(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (window.confirm('Tem certeza que deseja apagar este custo?')) {
      updateTrip(trip.id, { expenses: trip.expenses.filter(e => e.id !== expenseId) });
    }
  };

  // ==========================================
  // FUNÇÕES DE HOTEL (MÚLTIPLAS OPÇÕES)
  // ==========================================
  const handleOpenHotelModal = (hotel?: HotelInfo) => {
    if (hotel) {
      setEditingHotelId(hotel.id);
      setHotelForm({ ...hotel });
    } else {
      setEditingHotelId('');
      setHotelForm({ ...initialHotelState, id: crypto.randomUUID() });
    }
    setIsHotelModalOpen(true);
  };

  const handleSaveHotel = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedHotels: HotelInfo[];
    
    // Se for o primeiro hotel sendo adicionado, já marca como selecionado por padrão
    const isFirstHotel = hotels.length === 0 && !editingHotelId;
    const finalHotelForm = { ...hotelForm, isSelected: isFirstHotel ? true : hotelForm.isSelected };

    if (editingHotelId) {
      updatedHotels = hotels.map(h => h.id === editingHotelId ? finalHotelForm : h);
    } else {
      updatedHotels = [...hotels, finalHotelForm];
    }
    updateTrip(trip.id, { hotels: updatedHotels } as any);
    setIsHotelModalOpen(false);
  };

  const handleDeleteHotel = (hotelId: string) => {
    if (window.confirm('Deseja remover esta opção de hotel?')) {
      updateTrip(trip.id, { hotels: hotels.filter(h => h.id !== hotelId) } as any);
    }
  };

  const handleSelectHotel = (hotelId: string) => {
    const updatedHotels = hotels.map(h => ({
      ...h,
      // Se clicar no já selecionado, ele pode deselecionar (ficando sem hotel). Senão, seleciona apenas ele.
      isSelected: h.id === hotelId ? !h.isSelected : false 
    }));
    updateTrip(trip.id, { hotels: updatedHotels } as any);
  };

  const handleHotelImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setHotelForm(prev => ({
          ...prev,
          images: [...(prev.images || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveHotelImage = (idx: number) => {
    setHotelForm(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== idx)
    }));
  };

  const handleOpenRoomModal = (room?: HotelRoom) => {
    if (room) {
      setEditingRoomId(room.id);
      setRoomForm({ type: room.type, quantity: room.quantity, pricePerNight: room.pricePerNight, guests: room.guests });
    } else {
      setEditingRoomId('');
      setRoomForm({ type: 'Standard', quantity: 1, pricePerNight: 0, guests: 2 });
    }
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const currentRooms = hotelForm.rooms || [];
    let updatedRooms: HotelRoom[];
    if (editingRoomId) {
      updatedRooms = currentRooms.map(r => r.id === editingRoomId ? { ...roomForm, id: editingRoomId } : r);
    } else {
      updatedRooms = [...currentRooms, { ...roomForm, id: crypto.randomUUID() }];
    }
    setHotelForm(prev => ({ ...prev, rooms: updatedRooms }));
    setIsRoomModalOpen(false);
  };

  const handleDeleteRoom = (roomId: string) => {
    setHotelForm(prev => ({ ...prev, rooms: (prev.rooms || []).filter(r => r.id !== roomId) }));
  };

  // ==========================================
  // FUNÇÕES DE VOO
  // ==========================================
  const handleOpenFlightModal = (flight?: FlightLeg) => {
    if (flight) {
      setEditingFlightId(flight.id);
      const { id: _id, ...rest } = flight;
      setFlightForm(rest);
    } else {
      setEditingFlightId('');
      setFlightForm({
        direction: 'ida', airline: '', flightNumber: '', fromAirport: '', fromCity: '',
        toAirport: '', toCity: '', departureDate: trip.startDate, departureTime: '',
        arrivalDate: trip.startDate, arrivalTime: '', seatType: 'Econômica',
        pricePerPerson: 0, totalPrice: 0, baggageIncluded: false, notes: ''
      });
    }
    setIsFlightModalOpen(true);
  };

  const handleSaveFlight = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedFlights: FlightLeg[];
    if (editingFlightId) {
      updatedFlights = flights.map(f => f.id === editingFlightId ? { ...flightForm, id: editingFlightId } : f);
    } else {
      updatedFlights = [...flights, { ...flightForm, id: crypto.randomUUID() }];
    }
    updateTrip(trip.id, { flights: updatedFlights } as any);
    setIsFlightModalOpen(false);
  };

  const handleDeleteFlight = (flightId: string) => {
    if (window.confirm('Deseja remover este voo?')) {
      updateTrip(trip.id, { flights: flights.filter(f => f.id !== flightId) } as any);
    }
  };

  // ==========================================
  // HELPERS DE RENDERIZAÇÃO
  // ==========================================
  const tabs = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'itinerario', label: 'Itinerário' },
    { id: 'hotel', label: '🏨 Hotéis' },
    { id: 'voo', label: '✈️ Voos' },
    { id: 'custos', label: 'Custos Manuais' },
    { id: 'orcamento', label: 'Orçamento Final' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header Fixo */}
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

      {/* Navegação por Abas */}
      <nav className="flex px-6 py-4 space-x-2 overflow-x-auto no-scrollbar bg-slate-50 sticky top-[88px] z-20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {tab.label}
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
                <p className="text-xs text-slate-400 mt-1">{trip.travelers.adults}A • {trip.travelers.children}C • {trip.travelers.seniors}I</p>
              </div>
            </div>

            <h3 className="text-lg font-black text-slate-800 mt-8 mb-4">Essenciais da Viagem</h3>
            
            {/* VOO RESUMO */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-2 h-full bg-blue-500"></div>
              <div className="flex items-center mb-3">
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl mr-3"><Plane size={20} /></div>
                <div>
                  <h4 className="font-bold text-slate-800">Passagens Aéreas</h4>
                  {flights.length > 0 ? (
                    <p className="text-xs text-slate-500 mt-0.5">{flights.length} voo(s) cadastrado(s)</p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-0.5">Nenhum voo adicionado ainda.</p>
                  )}
                </div>
              </div>
              <button onClick={() => setActiveTab('voo')} className="text-primary font-medium text-sm">
                {flights.length > 0 ? 'Ver detalhes dos voos →' : 'Adicionar voos →'}
              </button>
            </div>

            {/* HOSPEDAGEM RESUMO */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-2 h-full bg-emerald-500"></div>
              <div className="flex items-center mb-3">
                <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl mr-3"><Hotel size={20} /></div>
                <div>
                  <h4 className="font-bold text-slate-800">Hospedagem</h4>
                  {selectedHotel ? (
                    <p className="text-xs text-emerald-600 font-bold mt-0.5">
                      ✓ Selecionado: <span className="text-slate-500 font-normal">{selectedHotel.name}</span>
                    </p>
                  ) : hotels.length > 0 ? (
                    <p className="text-xs text-amber-500 font-medium mt-0.5">
                      ⚠️ {hotels.length} opção(ões), nenhuma selecionada
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-0.5">Nenhum hotel adicionado ainda.</p>
                  )}
                </div>
              </div>
              <button onClick={() => setActiveTab('hotel')} className="text-primary font-medium text-sm">
                {hotels.length > 0 ? 'Ver opções de hotel →' : 'Adicionar hotel →'}
              </button>
            </div>

            {/* BOTÃO EXCLUIR */}
            <div className="pt-6 mt-2">
              <button onClick={handleDeleteTrip} className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl flex items-center justify-center active:scale-95 transition-transform border border-red-100">
                <Trash2 size={20} className="mr-2" /> Excluir Roteiro
              </button>
            </div>
          </div>
        )}

        {/* ABA: HOTEL (MÚLTIPLAS OPÇÕES) */}
        {activeTab === 'hotel' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hospedagem</h2>
              <button
                onClick={() => handleOpenHotelModal()}
                className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl font-bold text-sm flex items-center active:scale-95 transition-transform"
              >
                <Plus size={18} className="mr-1" /> Nova Opção
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-4">Você pode cadastrar várias opções e marcar qual foi a escolhida final.</p>

            {hotels.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed">
                <Building2 className="mx-auto text-slate-300 mb-4" size={56} />
                <p className="text-slate-500 font-medium mb-2">Nenhum hotel cadastrado.</p>
                <p className="text-slate-400 text-sm mb-6">Adicione opções de hospedagem para comparar.</p>
                <button onClick={() => handleOpenHotelModal()} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-300 active:scale-95 transition-transform">
                  Adicionar Hotel
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {hotels.map(hotel => {
                  const isSelected = hotel.isSelected;
                  const total = calcHotelTotal(hotel);
                  const nights = calcNights(hotel.checkIn, hotel.checkOut);
                  
                  return (
                    <div key={hotel.id} className={`bg-white rounded-3xl shadow-sm border-2 overflow-hidden transition-all ${isSelected ? 'border-emerald-500 shadow-emerald-100' : 'border-slate-100'}`}>
                      
                      {/* Checkbox de Seleção */}
                      <div 
                        onClick={() => handleSelectHotel(hotel.id)}
                        className={`p-4 flex items-center cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50' : 'bg-slate-50 hover:bg-slate-100'}`}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="text-emerald-500 mr-3 shrink-0" size={24} />
                        ) : (
                          <Circle className="text-slate-300 mr-3 shrink-0" size={24} />
                        )}
                        <div>
                          <p className={`font-bold text-sm ${isSelected ? 'text-emerald-800' : 'text-slate-600'}`}>
                            {isSelected ? 'Opção Escolhida' : 'Marcar como opção escolhida'}
                          </p>
                          {isSelected && <p className="text-xs text-emerald-600">Este valor está contabilizado no orçamento final.</p>}
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-2xl font-black text-slate-800 leading-tight pr-4">{hotel.name}</h3>
                          <div className="flex space-x-2 shrink-0">
                            <button onClick={() => handleOpenHotelModal(hotel)} className="p-2 bg-blue-50 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteHotel(hotel.id)} className="p-2 bg-red-50 rounded-xl text-red-500 hover:bg-red-100 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Estrelas */}
                        <div className="flex mb-4">
                          {Array.from({ length: hotel.stars }).map((_, i) => (
                            <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                        
                        {hotel.address && (
                          <p className="text-slate-500 text-sm flex items-start mb-5">
                            <Navigation size={14} className="mr-1.5 mt-0.5 shrink-0" /> {hotel.address}
                          </p>
                        )}

                        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 mb-5">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Check-in</p>
                            <p className="font-bold text-sm text-slate-800">{hotel.checkIn ? new Date(hotel.checkIn + 'T00:00:00').toLocaleDateString('pt-BR') : '--'}</p>
                            <p className="text-xs text-slate-500">{hotel.checkInTime}</p>
                          </div>
                          <div className="flex flex-col items-center justify-center">
                            <div className="bg-slate-100 rounded-full px-3 py-1">
                              <p className="font-black text-lg text-slate-700">{nights}</p>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">noites</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400 mb-1">Check-out</p>
                            <p className="font-bold text-sm text-slate-800">{hotel.checkOut ? new Date(hotel.checkOut + 'T00:00:00').toLocaleDateString('pt-BR') : '--'}</p>
                            <p className="text-xs text-slate-500">{hotel.checkOutTime}</p>
                          </div>
                        </div>

                        {/* Total do Hotel */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center mb-5">
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">Custo Total (Opção)</p>
                            <p className="text-xl font-black text-slate-800">{formatCurrency(total)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Por pessoa</p>
                            <p className="font-bold text-slate-700">{formatCurrency(total / (totalTravelers || 1))}</p>
                          </div>
                        </div>

                        {/* Link de reserva */}
                        {hotel.bookingUrl && (
                          <a
                            href={hotel.bookingUrl.startsWith('http') ? hotel.bookingUrl : `https://${hotel.bookingUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between bg-blue-50 text-blue-700 p-3.5 rounded-2xl hover:bg-blue-100 transition-colors mb-5"
                          >
                            <div className="flex items-center">
                              <Link size={16} className="mr-2" />
                              <p className="font-bold text-sm">Acessar Link de Reserva</p>
                            </div>
                            <ExternalLink size={16} className="text-blue-400" />
                          </a>
                        )}

                        {/* Galeria de Fotos */}
                        {(hotel.images || []).length > 0 && (
                          <div className="mb-5">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Fotos</p>
                            <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
                              {hotel.images.map((img, idx) => (
                                <div key={idx} className="relative shrink-0 w-32 h-24 rounded-2xl overflow-hidden border border-slate-200">
                                  <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quartos Restritos ao Cartão */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quartos Configurados</p>
                          {(hotel.rooms || []).length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Nenhum quarto para esta opção. Edite para adicionar.</p>
                          ) : (
                            <div className="space-y-3">
                              {hotel.rooms.map((room) => (
                                <div key={room.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                  <div className="flex items-center">
                                    <BedDouble size={16} className="text-emerald-500 mr-3" />
                                    <div>
                                      <p className="font-bold text-slate-800 text-sm">{room.quantity}x {room.type}</p>
                                      <p className="text-xs text-slate-500">{room.guests} hóspedes • {formatCurrency(room.pricePerNight)}/noite</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Notas */}
                        {hotel.notes && (
                          <div className="mt-5 bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Observações</p>
                            <p className="text-sm text-amber-900">{hotel.notes}</p>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA: VOOS */}
        {activeTab === 'voo' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Voos</h2>
              <button
                onClick={() => handleOpenFlightModal()}
                className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl font-bold text-sm flex items-center active:scale-95 transition-transform"
              >
                <Plus size={18} className="mr-1" /> Novo Voo
              </button>
            </div>

            {flights.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed">
                <Plane className="mx-auto text-slate-300 mb-4" size={56} />
                <p className="text-slate-500 font-medium mb-2">Nenhum voo cadastrado.</p>
                <p className="text-slate-400 text-sm mb-6">Adicione as passagens aéreas da sua viagem.</p>
                <button onClick={() => handleOpenFlightModal()} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-300 active:scale-95 transition-transform">
                  Adicionar Voo
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {totalFlights > 0 && (
                  <div className="bg-slate-800 text-white p-5 rounded-3xl flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Total em Passagens</p>
                      <p className="text-2xl font-black">{formatCurrency(totalFlights)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Por pessoa</p>
                      <p className="font-bold">{formatCurrency(totalFlights / (totalTravelers || 1))}</p>
                    </div>
                  </div>
                )}

                {/* Lista de voos */}
                {['ida', 'volta'].map(dir => {
                  const group = flights.filter(f => f.direction === dir);
                  if (group.length === 0) return null;
                  return (
                    <div key={dir}>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {dir === 'ida' ? '✈️ Voos de Ida' : '✈️ Voos de Volta'}
                      </p>
                      <div className="space-y-3">
                        {group.map(flight => (
                          <div key={flight.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className={`p-4 ${dir === 'ida' ? 'bg-blue-600' : 'bg-indigo-600'} text-white`}>
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-black text-lg">{flight.airline}</p>
                                  <p className="text-white/70 text-xs">{flight.flightNumber}</p>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-white/20 mr-2`}>
                                    {flight.seatType}
                                  </span>
                                  <button onClick={() => handleOpenFlightModal(flight)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => handleDeleteFlight(flight.id)} className="p-2 bg-white/10 rounded-xl hover:bg-red-400/40 transition-colors">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="p-5">
                              <div className="flex items-center justify-between mb-4">
                                <div className="text-center">
                                  <p className="text-2xl font-black text-slate-800">{flight.fromAirport}</p>
                                  <p className="text-xs text-slate-500 font-medium">{flight.fromCity}</p>
                                  <p className="text-sm font-bold text-primary mt-1">{flight.departureTime}</p>
                                  <p className="text-xs text-slate-400">{flight.departureDate ? new Date(flight.departureDate + 'T00:00:00').toLocaleDateString('pt-BR') : ''}</p>
                                </div>
                                <div className="flex flex-col items-center px-2">
                                  <div className="w-16 h-px bg-slate-200 relative">
                                    <Plane size={14} className="absolute -top-[7px] left-1/2 -translate-x-1/2 text-slate-400 rotate-90" />
                                  </div>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-black text-slate-800">{flight.toAirport}</p>
                                  <p className="text-xs text-slate-500 font-medium">{flight.toCity}</p>
                                  <p className="text-sm font-bold text-primary mt-1">{flight.arrivalTime}</p>
                                  <p className="text-xs text-slate-400">{flight.arrivalDate ? new Date(flight.arrivalDate + 'T00:00:00').toLocaleDateString('pt-BR') : ''}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50">
                                <div className="text-center">
                                  <p className="text-xs text-slate-400">Por pessoa</p>
                                  <p className="font-bold text-slate-700 text-sm">{formatCurrency(flight.pricePerPerson)}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-slate-400">Total</p>
                                  <p className="font-bold text-emerald-600 text-sm">{formatCurrency(flight.totalPrice)}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-slate-400">Bagagem</p>
                                  <p className={`font-bold text-sm ${flight.baggageIncluded ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {flight.baggageIncluded ? 'Inclusa' : 'Não incl.'}
                                  </p>
                                </div>
                              </div>
                              {flight.notes && (
                                <div className="mt-3 bg-amber-50 rounded-xl p-3">
                                  <p className="text-xs text-amber-700">{flight.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA: ITINERÁRIO */}
        {activeTab === 'itinerario' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Seu Roteiro</h2>
              <button onClick={handleAddDay} className="bg-primary/10 text-primary px-4 py-2 rounded-2xl font-bold text-sm flex items-center active:scale-95 transition-transform">
                <Plus size={18} className="mr-1" /> Novo Dia
              </button>
            </div>

            {(!trip.itinerary || trip.itinerary.length === 0) ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 border-dashed">
                <Map className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500 font-medium mb-4">Nenhum dia planejado ainda.</p>
                <button onClick={handleAddDay} className="bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 active:scale-95 transition-transform">
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
                          {[...item.activities].sort((a, b) => a.startTime.localeCompare(b.startTime)).map((activity) => (
                            <li key={activity.id} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center text-primary font-black text-sm">
                                  {activity.startTime}
                                  {activity.endTime && <span className="text-slate-400 font-medium ml-1">até {activity.endTime}</span>}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-1 rounded-md">{activity.category}</span>
                                  <button onClick={() => handleOpenEditActivity(item.id, activity)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                                  <button onClick={() => handleDeleteActivity(item.id, activity.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                </div>
                              </div>
                              <p className="text-slate-800 font-bold leading-relaxed">{activity.description}</p>
                              {activity.cost && (
                                <div className="mt-3 flex items-center text-sm font-bold text-emerald-600 bg-emerald-50 w-max px-3 py-1 rounded-lg">
                                  <CircleDollarSign size={14} className="mr-1" />
                                  {formatCurrency(activity.cost)}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      <button type="button" onClick={() => {
                        setSelectedDayId(item.id); setEditingActivityId(''); setActivityDesc('');
                        setActivityStartTime(''); setActivityEndTime(''); setActivityCost('');
                        setIsActivityModalOpen(true);
                      }} className="w-full py-3 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm font-bold active:bg-slate-50 active:text-slate-600 active:scale-[0.98] transition-all flex items-center justify-center">
                        <Plus size={18} className="mr-2" /> Adicionar Atividade
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: CUSTOS MANUAIS */}
        {activeTab === 'custos' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-slate-800 text-white p-6 rounded-3xl shadow-lg mb-6">
              <p className="text-slate-300 text-sm font-medium mb-1">Total de Gastos Manuais</p>
              <h2 className="text-4xl font-black tracking-tight">{formatCurrency(totalManualExpenses)}</h2>
              <p className="text-xs text-slate-400 mt-2">Voos e Hotéis são geridos em suas próprias abas.</p>
            </div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Detalhes dos Custos</h3>
              <button onClick={() => setIsExpenseModalOpen(true)} className="text-primary font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-xl active:scale-95">+ Adicionar</button>
            </div>
            <div className="space-y-3">
              {trip.expenses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-3xl border-slate-200">
                  Nenhum custo extra registrado.<br/>Adicione transfer, seguro, etc.
                </div>
              ) : (
                trip.expenses.map((expense) => {
                  const Icon = categoryIcons[expense.category] || categoryIcons['Outro'];
                  return (
                    <div key={expense.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm">
                      <div className="flex items-center">
                        <div className="bg-slate-50 p-3 rounded-xl mr-4 text-slate-500"><Icon size={20} /></div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{expense.description}</p>
                          <p className="text-xs text-slate-400">{expense.category}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-3">
                        <p className="font-black text-slate-800">{formatCurrency(expense.amount)}</p>
                        <button onClick={() => handleDeleteExpense(expense.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors active:scale-90"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ABA: ORÇAMENTO FINAL (GRAND TOTAL) */}
        {activeTab === 'orcamento' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-gradient-to-br from-secondary to-emerald-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
              <Wallet size={120} className="absolute -right-6 -bottom-6 opacity-10" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Custo Total da Viagem</p>
                    <h2 className="text-4xl font-black mt-1">{formatCurrency(grandTotal)}</h2>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-emerald-500/30">
                  <div>
                    <p className="text-xs text-emerald-100">Custo por Viajante</p>
                    <p className="text-lg font-bold">{formatCurrency(grandTotal / (totalTravelers || 1))}</p>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    <span className="text-xs font-bold">{totalTravelers} pessoas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Agregação de Categorias incluindo Voos e Hotel Selecionado */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Gastos por Categoria</h3>
              <div className="space-y-5">
                {(() => {
                  const categoryTotals: Record<string, number> = {};
                  Object.keys(categoryIcons).forEach(cat => categoryTotals[cat] = 0);
                  
                  // Despesas Manuais
                  trip.expenses.forEach(e => {
                    if (categoryTotals[e.category] !== undefined) categoryTotals[e.category] += e.amount;
                    else categoryTotals['Outro'] = (categoryTotals['Outro'] || 0) + e.amount;
                  });
                  
                  // Injeção de Voo e Hotel Selecionado
                  categoryTotals['Voo'] += totalFlights;
                  categoryTotals['Hospedagem'] += totalSelectedHotel;

                  return Object.entries(categoryTotals)
                    .filter(([_, amount]) => amount > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount]) => {
                      const percentage = ((amount / grandTotal) * 100).toFixed(0);
                      return (
                        <div key={category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-slate-600">
                              {category} {category === 'Hospedagem' && <span className="text-[10px] text-emerald-500 bg-emerald-50 px-1 py-0.5 rounded">(Seleção)</span>}
                            </span>
                            <span className="font-bold text-slate-800">{formatCurrency(amount)}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-secondary h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    });
                })()}
                
                {grandTotal === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhum gasto contabilizado ainda.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==========================================
          MODAIS ABAIXO (DESPESA E ATIVIDADE)
      ========================================== */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsExpenseModalOpen(false)} />
          <div className="bg-white w-full rounded-t-3xl p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Novo Custo</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descrição</label>
                <input type="text" required autoFocus value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} placeholder="Ex: Jantar no centro" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor</label>
                  <input type="number" step="0.01" required inputMode="decimal" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="0,00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoria</label>
                  <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value as Expense['category'])} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium appearance-none">
                    {Object.keys(categoryIcons).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-white font-bold text-lg py-4 rounded-2xl mt-4 shadow-lg shadow-primary/30 active:scale-95">Adicionar Custo</button>
            </form>
          </div>
        </div>
      )}

      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsActivityModalOpen(false)} />
          <div className="bg-white w-full h-[85vh] overflow-y-auto rounded-t-3xl p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-2 z-20">
              <h3 className="text-xl font-black text-slate-800">{editingActivityId ? 'Editar Atividade' : 'Nova Atividade'}</h3>
              <button onClick={() => setIsActivityModalOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddActivity} className="space-y-5 pb-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">O que vamos fazer?</label>
                <input type="text" required autoFocus value={activityDesc} onChange={(e) => setActivityDesc(e.target.value)} placeholder="Ex: Pôr do sol no Valle de la Luna" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Início</label>
                  <input type="time" required value={activityStartTime} onChange={(e) => setActivityStartTime(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fim (Opcional)</label>
                  <input type="time" value={activityEndTime} onChange={(e) => setActivityEndTime(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoria</label>
                <select value={activityCategory} onChange={(e) => setActivityCategory(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium appearance-none">
                  <option value="Passeio">Passeio / Tour</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Lazer">Lazer / Descanso</option>
                  <option value="Outra">Outra (Digitar...)</option>
                </select>
                {activityCategory === 'Outra' && (
                  <input type="text" required placeholder="Digite a categoria" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="w-full mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium animate-in fade-in" />
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Custo (Opcional)</label>
                <input type="number" step="0.01" inputMode="decimal" value={activityCost} onChange={(e) => setActivityCost(e.target.value)} placeholder="R$ 0,00" className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 text-emerald-900 font-bold placeholder:text-emerald-300" />
                {!editingActivityId && <p className="text-[10px] text-slate-400 mt-2 font-medium">Se preenchido, será adicionado aos Custos Manuais automaticamente.</p>}
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl mt-4 shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                {editingActivityId ? 'Salvar Alterações' : 'Adicionar ao Roteiro'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAIS DE HOTEL E VOO
      ========================================== */}
      {isHotelModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsHotelModalOpen(false)} />
          <div className="bg-white w-full h-[90vh] overflow-y-auto rounded-t-3xl p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-2 z-20">
              <h3 className="text-xl font-black text-slate-800">{editingHotelId ? 'Editar Hotel' : 'Nova Opção de Hotel'}</h3>
              <button onClick={() => setIsHotelModalOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveHotel} className="space-y-5 pb-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome do Hotel *</label>
                <input type="text" required autoFocus value={hotelForm.name} onChange={e => setHotelForm(p => ({...p, name: e.target.value}))} placeholder="Ex: Hotel Bossa Nova" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 text-slate-800 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Endereço / Localização</label>
                <input type="text" value={hotelForm.address} onChange={e => setHotelForm(p => ({...p, address: e.target.value}))} placeholder="Ex: Rua das Flores, 123 - Centro" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 text-slate-800 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Classificação</label>
                <div className="flex space-x-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setHotelForm(p => ({...p, stars: s}))} className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${hotelForm.stars >= s ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {'★'.repeat(s)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Check-in</label>
                  <input type="date" required value={hotelForm.checkIn} onChange={e => setHotelForm(p => ({...p, checkIn: e.target.value}))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 text-slate-800 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Check-out</label>
                  <input type="date" required value={hotelForm.checkOut} onChange={e => setHotelForm(p => ({...p, checkOut: e.target.value}))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 text-slate-800 font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Horário Check-in</label>
                  <input type="time" value={hotelForm.checkInTime} onChange={e => setHotelForm(p => ({...p, checkInTime: e.target.value}))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 text-slate-800 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Horário Check-out</label>
                  <input type="time" value={hotelForm.checkOutTime} onChange={e => setHotelForm(p => ({...p, checkOutTime: e.target.value}))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 text-slate-800 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Telefone / WhatsApp</label>
                <input type="tel" value={hotelForm.phone} onChange={e => setHotelForm(p => ({...p, phone: e.target.value}))} placeholder="+55 11 99999-9999" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 text-slate-800 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Observações</label>
                <textarea value={hotelForm.notes} onChange={e => setHotelForm(p => ({...p, notes: e.target.value}))} placeholder="Ex: Café da manhã incluso, estacionamento gratuito..." rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 text-slate-800 font-medium resize-none" />
              </div>

              {/* Link de Reserva */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Link da Reserva</label>
                <div className="relative">
                  <Link size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={hotelForm.bookingUrl}
                    onChange={e => setHotelForm(p => ({...p, bookingUrl: e.target.value}))}
                    placeholder="https://booking.com/..."
                    className="w-full pl-10 p-4 bg-blue-50 border border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-blue-900 font-medium placeholder:text-blue-300"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Cole aqui o link do Booking, Airbnb, Decolar, etc.</p>
              </div>

              {/* Upload de Fotos */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fotos do Hotel</label>
                <label className="flex flex-col items-center justify-center w-full py-5 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors">
                  <ImagePlus size={24} className="text-slate-400 mb-2" />
                  <span className="text-sm font-bold text-slate-500">Adicionar Fotos</span>
                  <span className="text-xs text-slate-400 mt-0.5">JPG, PNG, WEBP</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleHotelImageUpload} />
                </label>
                {(hotelForm.images || []).length > 0 && (
                  <div className="flex space-x-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                    {hotelForm.images.map((img, idx) => (
                      <div key={idx} className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveHotelImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quartos dentro do modal */}
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Quartos nesta opção</label>
                  <button type="button" onClick={() => handleOpenRoomModal()} className="text-emerald-600 font-bold text-sm bg-emerald-100 px-3 py-1.5 rounded-xl active:scale-95">+ Adicionar Quarto</button>
                </div>
                {(hotelForm.rooms || []).length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm bg-white">
                    Nenhum quarto adicionado. <br/>Adicione quartos para calcular o total.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hotelForm.rooms.map(room => (
                      <div key={room.id} className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{room.quantity}x {room.type}</p>
                          <p className="text-xs text-slate-500">{room.guests} hóspedes • {formatCurrency(room.pricePerNight)}/noite</p>
                        </div>
                        <div className="flex space-x-1">
                          <button type="button" onClick={() => handleOpenRoomModal(room)} className="p-2 text-slate-400 hover:text-primary rounded-xl"><Edit2 size={14} /></button>
                          <button type="button" onClick={() => handleDeleteRoom(room.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-xl"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white font-bold text-lg py-4 rounded-2xl mt-2 shadow-lg shadow-emerald-300 active:scale-95">
                Salvar Opção de Hotel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: QUARTO
      ========================================== */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in" onClick={() => setIsRoomModalOpen(false)} />
          <div className="bg-white w-full rounded-t-3xl p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">{editingRoomId ? 'Editar Quarto' : 'Novo Quarto'}</h3>
              <button onClick={() => setIsRoomModalOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Quarto</label>
                <select value={roomForm.type} onChange={e => setRoomForm(p => ({...p, type: e.target.value}))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 text-slate-800 font-medium appearance-none">
                  <option>Standard</option>
                  <option>Standard Duplo</option>
                  <option>Superior</option>
                  <option>Deluxe</option>
                  <option>Suite</option>
                  <option>Suite Master</option>
                  <option>Family Room</option>
                  <option>Chalé</option>
                  <option>Bangalô</option>
                  <option>Outro</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quantidade</label>
                  <input type="number" min="1" required value={roomForm.quantity} onChange={e => setRoomForm(p => ({...p, quantity: parseInt(e.target.value) || 1}))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 text-slate-800 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hóspedes / Quarto</label>
                  <input type="number" min="1" required value={roomForm.guests} onChange={e => setRoomForm(p => ({...p, guests: parseInt(e.target.value) || 1}))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 text-slate-800 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor por Noite (R$)</label>
                <input type="number" step="0.01" min="0" required value={roomForm.pricePerNight || ''} onChange={e => setRoomForm(p => ({...p, pricePerNight: parseFloat(e.target.value) || 0}))} placeholder="0,00" className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 text-emerald-900 font-bold placeholder:text-emerald-300" />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-emerald-300 active:scale-95">
                {editingRoomId ? 'Salvar Quarto' : 'Adicionar Quarto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: VOO
      ========================================== */}
      {isFlightModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsFlightModalOpen(false)} />
          <div className="bg-white w-full h-[92vh] overflow-y-auto rounded-t-3xl p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-2 z-20">
              <h3 className="text-xl font-black text-slate-800">{editingFlightId ? 'Editar Voo' : 'Novo Voo'}</h3>
              <button onClick={() => setIsFlightModalOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveFlight} className="space-y-5 pb-8">
              {/* Sentido */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sentido</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['ida', 'volta'] as const).map(dir => (
                    <button key={dir} type="button" onClick={() => setFlightForm(p => ({...p, direction: dir}))} className={`py-3 rounded-2xl font-bold text-sm transition-all capitalize ${flightForm.direction === dir ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                      {dir === 'ida' ? '✈️ Ida' : '✈️ Volta'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Companhia e Número do Voo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Companhia Aérea *</label>
                  <input type="text" required value={flightForm.airline} onChange={e => setFlightForm(p => ({...p, airline: e.target.value}))} placeholder="Ex: LATAM" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-slate-800 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nº do Voo</label>
                  <input type="text" value={flightForm.flightNumber} onChange={e => setFlightForm(p => ({...p, flightNumber: e.target.value}))} placeholder="Ex: LA3042" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-slate-800 font-medium" />
                </div>
              </div>

              {/* Origem */}
              <div className="bg-slate-50 rounded-3xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">🛫 Origem</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Cód. Aeroporto</label>
                    <input type="text" value={flightForm.fromAirport} onChange={e => setFlightForm(p => ({...p, fromAirport: e.target.value.toUpperCase()}))} placeholder="GRU" maxLength={4} className="w-full p-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-slate-800 font-black text-center text-lg tracking-widest" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Cidade</label>
                    <input type="text" value={flightForm.fromCity} onChange={e => setFlightForm(p => ({...p, fromCity: e.target.value}))} placeholder="São Paulo" className="w-full p-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-slate-800 font-medium" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Data de Saída</label>
                    <input type="date" value={flightForm.departureDate} onChange={e => setFlightForm(p => ({...p, departureDate: e.target.value}))} className="w-full p-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-slate-800 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Horário</label>
                    <input type="time" value={flightForm.departureTime} onChange={e => setFlightForm(p => ({...p, departureTime: e.target.value}))} className="w-full p-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-slate-800 font-bold" />
                  </div>
                </div>
              </div>

              {/* Destino */}
              <div className="bg-blue-50 rounded-3xl p-4 space-y-3">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">🛬 Destino</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-blue-400 mb-1">Cód. Aeroporto</label>
                    <input type="text" value={flightForm.toAirport} onChange={e => setFlightForm(p => ({...p, toAirport: e.target.value.toUpperCase()}))} placeholder="SCL" maxLength={4} className="w-full p-3 bg-white border border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-slate-800 font-black text-center text-lg tracking-widest" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-400 mb-1">Cidade</label>
                    <input type="text" value={flightForm.toCity} onChange={e => setFlightForm(p => ({...p, toCity: e.target.value}))} placeholder="Santiago" className="w-full p-3 bg-white border border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-slate-800 font-medium" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-blue-400 mb-1">Data Chegada</label>
                    <input type="date" value={flightForm.arrivalDate} onChange={e => setFlightForm(p => ({...p, arrivalDate: e.target.value}))} className="w-full p-3 bg-white border border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-slate-800 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-400 mb-1">Horário</label>
                    <input type="time" value={flightForm.arrivalTime} onChange={e => setFlightForm(p => ({...p, arrivalTime: e.target.value}))} className="w-full p-3 bg-white border border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-slate-800 font-bold" />
                  </div>
                </div>
              </div>

              {/* Classe / Assento */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Assento</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Econômica', 'Econômica Premium', 'Executiva', 'Primeira Classe'] as const).map(seat => (
                    <button key={seat} type="button" onClick={() => setFlightForm(p => ({...p, seatType: seat}))} className={`py-3 px-2 rounded-2xl font-bold text-xs transition-all text-center ${flightForm.seatType === seat ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                      {seat === 'Econômica' && '💺 '}
                      {seat === 'Econômica Premium' && '✨ '}
                      {seat === 'Executiva' && '🛋️ '}
                      {seat === 'Primeira Classe' && '👑 '}
                      {seat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preços */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor por Pessoa</label>
                  <input type="number" step="0.01" min="0" value={flightForm.pricePerPerson || ''} onChange={e => setFlightForm(p => ({...p, pricePerPerson: parseFloat(e.target.value) || 0}))} placeholder="0,00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-slate-800 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor Total</label>
                  <input type="number" step="0.01" min="0" value={flightForm.totalPrice || ''} onChange={e => setFlightForm(p => ({...p, totalPrice: parseFloat(e.target.value) || 0}))} placeholder="0,00" className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 text-emerald-900 font-bold placeholder:text-emerald-300" />
                </div>
              </div>

              {/* Bagagem */}
              <div>
                <button type="button" onClick={() => setFlightForm(p => ({...p, baggageIncluded: !p.baggageIncluded}))} className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center ${flightForm.baggageIncluded ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' : 'bg-slate-100 text-slate-500 border-2 border-transparent'}`}>
                  <span className="mr-2 text-lg">{flightForm.baggageIncluded ? '✅' : '🧳'}</span>
                  {flightForm.baggageIncluded ? 'Bagagem Incluída' : 'Sem Bagagem Despachada'}
                </button>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Observações</label>
                <textarea value={flightForm.notes} onChange={e => setFlightForm(p => ({...p, notes: e.target.value}))} placeholder="Ex: Escala em Buenos Aires, assentos 14A e 14B..." rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-slate-800 font-medium resize-none" />
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-300 active:scale-95 transition-transform">
                {editingFlightId ? 'Salvar Alterações' : 'Adicionar Voo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetails;