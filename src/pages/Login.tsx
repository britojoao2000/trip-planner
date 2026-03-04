import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/useTripStore';
import { Lock, Plane } from 'lucide-react';

const Login = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const login = useTripStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(code)) {
      navigate('/');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center">
          <div className="bg-primary p-4 rounded-full mb-4 shadow-lg shadow-primary/30">
            <Plane className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">TripPlanner</h1>
          <p className="text-slate-500 mt-2">Acesse seu roteiro de viagem</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Digite a senha"
              className={`w-full px-4 py-4 bg-white border ${
                error ? 'border-red-500 animate-shake' : 'border-slate-200'
              } rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-center text-2xl tracking-widest`}
            />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95"
          >
            Entrar
          </button>
        </form>

        {error && (
          <p className="text-red-500 font-medium animate-pulse">Código incorreto. Tente novamente.</p>
        )}
      </div>
    </div>
  );
};

export default Login;