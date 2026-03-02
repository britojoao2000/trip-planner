import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/useTripStore';
import { ArrowLeft, Info, Map, CircleDollarSign, PieChart, Users, CalendarDays, MapPin, Plus, Receipt, Plane, Bed, Car, Camera, Utensils, Shield, X, Trash2 } from 'lucide-react';
import type { Expense } from '../types/trip';

type TabType = 'resumo' | 'itinerario' | 'custos' | 'orcamento';

const TripDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Trazemos o updateTrip do Zustand:
  const { trips, updateTrip, deleteTrip } = useTripStore(); 
  const trip = trips.find((t) => t.id === id);
  
  const [activeTab, setActiveTab] = useState<TabType>('resumo');

  // --- ESTADOS DO MODAL DE CUSTOS ---
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('Alimentação');

  // --- ESTADOS DO MODAL DE ITINERÁRIO (NOVO) ---
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityDesc, setActivityDesc] = useState('');
  const [selectedDayId, setSelectedDayId] = useState('');

  // Função para guardar o novo custo
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !expenseDesc || !expenseAmount) return;

    const newExpense: Expense = {
      id: crypto.randomUUID(), // Gera um ID único nativamente
      category: expenseCategory,
      description: expenseDesc,
      amount: parseFloat(expenseAmount.replace(',', '.')), // Garante que o número é válido
    };

    updateTrip(trip.id, {
      expenses: [...trip.expenses, newExpense]
    });

    // Limpa o formulário e fecha o modal
    setExpenseDesc('');
    setExpenseAmount('');
    setIsExpenseModalOpen(false);
  };

  // Função para deletar a viagem inteira
  const handleDeleteTrip = () => {
    if (!trip) return;
    
    if (window.confirm(`Tem certeza que deseja excluir o roteiro para ${trip.destination}? Essa ação apagará todos os custos e atividades, e não pode ser desfeita.`)) {
      deleteTrip(trip.id); // Apaga no Firebase e no estado global
      navigate('/'); // Redireciona o usuário de volta para o Dashboard
    }
  };

  // Função para excluir uma despesa
  const handleDeleteExpense = (expenseId: string) => {
    if (!trip) return;
    
    // Confirmação simples nativa do navegador para evitar cliques acidentais
    if (window.confirm('Tem certeza que deseja apagar este custo?')) {
      updateTrip(trip.id, {
        expenses: trip.expenses.filter(e => e.id !== expenseId)
      });
    }
  };

  // Função para guardar a nova atividade
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !activityDesc || !selectedDayId) return;

    const updatedItinerary = trip.itinerary.map(day => {
      if (day.id === selectedDayId) {
        return { ...day, activities: [...day.activities, activityDesc] };
      }
      return day;
    });

    updateTrip(trip.id, { itinerary: updatedItinerary });

    setActivityDesc('');
    setIsActivityModalOpen(false);
  };

  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Viagem não encontrada</h2>
        <button onClick={() => navigate('/')} className="text-primary font-medium flex items-center">
          <ArrowLeft className="mr-2" /> Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Fixo no Topo */}
      <header className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10 flex items-center">
        <button 
          onClick={() => navigate('/')}
          className="p-2 -ml-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-full active:scale-95 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-800 truncate">{trip.destination}</h1>
      </header>

      {/* Área de Conteúdo (Scrollável) */}
      <main className="flex-1 p-6 pb-28 overflow-y-auto">
        
        {/* CONTEÚDO DA ABA: RESUMO */}
        {activeTab === 'resumo' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-center bg-primary/10 w-16 h-16 rounded-2xl mb-4 text-primary">
                <MapPin size={32} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
                {trip.destination}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <CalendarDays className="text-accent mb-3" size={24} />
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Quando</p>
                <p className="font-bold text-slate-800">{trip.date}</p>
              </div>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <Users className="text-secondary mb-3" size={24} />
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Viajantes</p>
                <p className="font-bold text-slate-800">{trip.travelers.join(', ')}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-5 rounded-3xl">
                <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center">
                    Dica Inteligente
                </h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                    {trip.aiTip ? trip.aiTip : "Organize bem seu roteiro e baixe os mapas offline antes de sair do hotel!"}
                </p>
            </div>

            {/* BOTÃO DE EXCLUIR VIAGEM */}
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

        {/* Placeholders para as outras abas */}
        {/* CONTEÚDO DA ABA: ITINERÁRIO */}
        {activeTab === 'itinerario' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Seu Roteiro</h2>
              <button className="bg-primary/10 text-primary p-2.5 rounded-2xl active:scale-90 transition-transform">
                <Plus size={24} />
              </button>
            </div>

            {trip.itinerary.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 border-dashed">
                <Map className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500 font-medium">Nenhum dia planejado ainda.</p>
              </div>
            ) : (
              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
                {trip.itinerary.map((item, index) => (
                  <div key={item.id} className="relative flex items-start">
                    {/* Indicador da Timeline */}
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white shadow-md shadow-primary/30 z-10 shrink-0 font-bold text-sm">
                      {index + 1}
                    </div>
                    
                    {/* Card do Dia */}
                    <div className="ml-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex-1">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">{item.day}</h3>
                      <ul className="space-y-3">
                        {item.activities.map((activity, idx) => (
                          <li key={idx} className="flex items-start text-slate-600 text-sm font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 mr-3 shrink-0" />
                            <span className="leading-relaxed">{activity}</span>
                          </li>
                        ))}
                      </ul>
                      
                        {/* Botão para adicionar atividade no dia específico */}
                        <button 
                        onClick={() => {
                            setSelectedDayId(item.id);
                            setIsActivityModalOpen(true);
                        }}
                        className="mt-5 w-full py-3 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm font-bold active:bg-slate-50 active:text-slate-600 active:scale-[0.98] transition-all flex items-center justify-center"
                        >
                        <Plus size={18} className="mr-2" /> Nova atividade
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dica de Viagem Embutida */}
            <div className="bg-amber-50 border border-amber-100 p-5 rounded-3xl mt-8">
              <h3 className="text-sm font-bold text-amber-900 mb-2 flex items-center">
                 💡 Dica de Planejamento
              </h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                Mantenha horários flexíveis. Para o momento do pedido de casamento, o pôr do sol no Valle de la Luna rende fotos incríveis e tem a luz perfeita. E ao planejar as paradas entre os passeios, lembre-se de mapear com antecedência os restaurantes locais para garantir opções no cardápio que não levem carne moída, feijão ou abacate para a Ana!
              </p>
            </div>
          </div>
        )}
        {/* CONTEÚDO DA ABA: CUSTOS */}
        {activeTab === 'custos' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Despesas</h2>
              <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="bg-primary/10 text-primary px-4 py-2 rounded-2xl font-bold text-sm flex items-center active:scale-95 transition-transform"
                >
                <Plus size={18} className="mr-1" /> Novo Custo
              </button>
            </div>

            <div className="space-y-3">
              {trip.expenses.map((expense) => {
                // Mapeamento de ícones e cores por categoria
                const getCategoryStyle = (cat: string) => {
                  switch(cat) {
                    case 'Voo': return { icon: <Plane size={20} />, bg: 'bg-blue-100 text-blue-600' };
                    case 'Hospedagem': return { icon: <Bed size={20} />, bg: 'bg-indigo-100 text-indigo-600' };
                    case 'Transfer': return { icon: <Car size={20} />, bg: 'bg-orange-100 text-orange-600' };
                    case 'Passeio': return { icon: <Camera size={20} />, bg: 'bg-emerald-100 text-emerald-600' };
                    case 'Alimentação': return { icon: <Utensils size={20} />, bg: 'bg-red-100 text-red-600' };
                    case 'Seguro': return { icon: <Shield size={20} />, bg: 'bg-purple-100 text-purple-600' };
                    default: return { icon: <Receipt size={20} />, bg: 'bg-slate-100 text-slate-600' };
                  }
                };
                
                const style = getCategoryStyle(expense.category);

                return (
                  <div key={expense.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 ${style.bg}`}>
                        {style.icon}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{expense.description}</p>
                        <p className="text-xs text-slate-500 font-medium">{expense.category}</p>
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
              })}
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA: ORÇAMENTO */}
        {activeTab === 'orcamento' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Resumo Financeiro</h2>
            
            {/* Card Principal de Total */}
            <div className="bg-slate-800 text-white p-6 rounded-3xl shadow-lg shadow-slate-800/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <PieChart size={100} />
              </div>
              <p className="text-slate-300 text-sm font-medium mb-1 relative z-10">Custo Total da Viagem</p>
              <h3 className="text-4xl font-black tracking-tight relative z-10">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  trip.expenses.reduce((acc, curr) => acc + curr.amount, 0)
                )}
              </h3>
              
              <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center relative z-10">
                <div>
                  <p className="text-xs text-slate-400">Custo por Viajante</p>
                  <p className="text-lg font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      trip.expenses.reduce((acc, curr) => acc + curr.amount, 0) / trip.travelers.length
                    )}
                  </p>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  <span className="text-xs font-bold">{trip.travelers.length} pessoas</span>
                </div>
              </div>
            </div>

            {/* Dica de Viagem Embutida */}
            <div className="bg-secondary/10 border border-secondary/20 p-5 rounded-3xl mt-4">
              <h3 className="text-sm font-bold text-secondary-800 mb-2 flex items-center">
                 💰 Dica de Câmbio
              </h3>
              <p className="text-sm text-secondary-800 leading-relaxed">
                Recomendamos sempre levar uma parte em espécie (Dólares ou Pesos Chilenos) e o restante num cartão global. Muitos passeios no deserto e pequenos comércios não aceitam cartão devido à falta de sinal.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Bottom Navigation Bar (Fixo na base) */}
      <nav className="bg-white border-t border-slate-200 fixed bottom-0 w-full pb-safe px-2 py-3 flex justify-between z-20">
        <NavButton 
          icon={<Info size={24} />} 
          label="Resumo" 
          isActive={activeTab === 'resumo'} 
          onClick={() => setActiveTab('resumo')} 
        />
        <NavButton 
          icon={<Map size={24} />} 
          label="Itinerário" 
          isActive={activeTab === 'itinerario'} 
          onClick={() => setActiveTab('itinerario')} 
        />
        <NavButton 
          icon={<CircleDollarSign size={24} />} 
          label="Custos" 
          isActive={activeTab === 'custos'} 
          onClick={() => setActiveTab('custos')} 
        />
        <NavButton 
          icon={<PieChart size={24} />} 
          label="Orçamento" 
          isActive={activeTab === 'orcamento'} 
          onClick={() => setActiveTab('orcamento')} 
        />
        {/* OVERLAY E MODAL DE NOVO CUSTO (BOTTOM SHEET) */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Fundo escuro clicável para fechar */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsExpenseModalOpen(false)}
          />
          
          {/* Corpo do Modal deslizando de baixo */}
          <div className="bg-white w-full rounded-t-3xl p-6 relative animate-in slide-in-from-bottom-full duration-300 z-10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Adicionar Despesa</h3>
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-2 bg-slate-100 text-slate-500 rounded-full active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descrição</label>
                <input 
                  type="text" 
                  required
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Ex: Almoço no Adobe" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor (R$)</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    inputMode="decimal"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0.00" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoria</label>
                  <select 
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as Expense['category'])}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium appearance-none"
                  >
                    <option value="Alimentação">Alimentação</option>
                    <option value="Passeio">Passeio</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Hospedagem">Hospedagem</option>
                    <option value="Voo">Voo</option>
                    <option value="Seguro">Seguro</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-primary text-white font-bold text-lg py-4 rounded-2xl mt-4 active:scale-95 transition-transform shadow-lg shadow-primary/30"
              >
                Salvar Custo
              </button>
            </form>
          </div>
        </div>
      )}
      {/* OVERLAY E MODAL DE NOVA ATIVIDADE (BOTTOM SHEET) */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsActivityModalOpen(false)}
          />
          
          <div className="bg-white w-full rounded-t-3xl p-6 relative animate-in slide-in-from-bottom-full duration-300 z-10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Nova Atividade</h3>
              <button 
                onClick={() => setIsActivityModalOpen(false)}
                className="p-2 bg-slate-100 text-slate-500 rounded-full active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">O que vamos fazer?</label>
                <input 
                  type="text" 
                  required
                  value={activityDesc}
                  onChange={(e) => setActivityDesc(e.target.value)}
                  placeholder="Ex: Jantar no Restaurante Adobe" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 font-medium"
                  autoFocus
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-primary text-white font-bold text-lg py-4 rounded-2xl mt-4 active:scale-95 transition-transform shadow-lg shadow-primary/30"
              >
                Adicionar ao Roteiro
              </button>
            </form>
          </div>
        </div>
      )}
      </nav>
    </div>
  );
};

// Componente auxiliar para os botões da barra inferior
const NavButton = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center space-y-1 py-1 rounded-xl transition-colors ${
      isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <div className={`${isActive ? 'bg-primary/10 p-1.5 rounded-lg' : 'p-1.5'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default TripDetails;