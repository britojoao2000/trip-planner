import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTripStore } from './store/useTripStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TripDetails from './pages/TripDetails';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useTripStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const listenToTrips = useTripStore(state => state.listenToTrips);

  useEffect(() => {
    // Inicia a conexão em tempo real com o Firebase ao abrir o app
    const unsubscribe = listenToTrips();
    
    // Limpa a conexão se o componente for desmontado
    return () => unsubscribe();
  }, [listenToTrips]);

  return (
    <BrowserRouter basename="/trip-planner">
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        <Route path="/viagem/:id" element={
          <PrivateRoute>
            <TripDetails />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;