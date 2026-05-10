import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

// --- PÁGINAS PÚBLICAS ---
import Home from './frontend/pages/Home';
import IA from './frontend/pages/IA';
import Login from './frontend/pages/Login';
import Register from './frontend/pages/Register';
import ServiciosBufete from './frontend/pages/ServiciosBufete'; 
import SobreNosotros from './frontend/pages/SobreNosotros'; 
import CatalogoHabitaciones from './frontend/pages/CatalogoHabitaciones'; 

// --- COMPONENTES Y PÁGINAS ADMINISTRATIVAS ---
import Sidebar from './frontend/components/Sidebar';
import AdminDashboard from './frontend/pages/AdminDashboard';
import HabitacionesAdmin from './frontend/pages/Habitaciones'; 
import Reservas from './frontend/pages/Reservas';
import UsuariosAdmin from './frontend/pages/UsuariosAdmin';
import Reportes from './frontend/pages/Reportes'; 

import logoPaola from './frontend/assets/images/logo.png';
import './App.css';

const Navigation = () => {
  const location = useLocation();

  // Ocultar navegación en el panel de administración o login
  if (location.pathname.startsWith('/admin') || location.pathname === '/login' || location.pathname === '/admin/register') {
    return null;
  }

  return (
    <header className="bv-header-centered global-nav">
      <img src={logoPaola} alt="Paola Hostal" className="bv-main-logo" />
      <nav className="bv-nav">
        <Link to="/" className={location.pathname === "/" ? "active" : ""}>Inicio</Link>
        <Link to="/reservas" className={location.pathname === "/reservas" ? "active" : ""}>Reservas Con IA</Link>
        <Link to="/habitaciones" className={location.pathname === "/habitaciones" ? "active" : ""}>Habitaciones</Link>
        
        <Link 
          to="/servicios" 
          className={location.pathname === "/servicios" ? "active" : ""}
        >
          Servicios y Bufete
        </Link>
        
        <Link 
          to="/sobre-nosotros" 
          className={location.pathname === "/sobre-nosotros" ? "active" : ""}
        >
          Sobre nosotros
        </Link>
      </nav>
    </header>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('auth_pao') === 'true'
  );

  return (
    <Router>
      <div className="bon-voyage-container">
        <Navigation />
        
        <Routes>
          {/* --- RUTAS PÚBLICAS --- */}
          <Route path="/" element={<Home />} />
          <Route path="/reservas" element={<IA />} />
          <Route path="/habitaciones" element={<CatalogoHabitaciones />} />
          <Route path="/servicios" element={<ServiciosBufete />} />
          <Route path="/sobre-nosotros" element={<SobreNosotros />} />
          
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/admin/register" element={<Register />} />

          {/* --- RUTAS ADMINISTRATIVAS PROTEGIDAS --- */}
          <Route 
            path="/admin/*" 
            element={
              isAuthenticated ? (
                <div className="admin-layout" style={{ display: 'flex' }}>
                  <Sidebar setIsAuthenticated={setIsAuthenticated} />
                  <main className="admin-main-content" style={{ flex: 1, marginLeft: '260px', padding: '20px', minHeight: '100vh', background: '#f8fafc' }}>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="habitaciones" element={<HabitacionesAdmin />} />
                      <Route path="reservas" element={<Reservas />} />
                      <Route path="usuarios" element={<UsuariosAdmin />} />
                      <Route path="reportes" element={<Reportes />} />
                    </Routes>
                  </main>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;