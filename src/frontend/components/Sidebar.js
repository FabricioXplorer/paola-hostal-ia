import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BedDouble, 
  CalendarCheck, 
  Users, 
  LogOut,
  Hotel,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ setIsAuthenticated }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Salpicadero' },
    { path: '/admin/habitaciones', icon: <BedDouble size={20} />, label: 'Habitaciones' },
    { path: '/admin/reservas', icon: <CalendarCheck size={20} />, label: 'Reservas' },
    { path: '/admin/clientes', icon: <Users size={20} />, label: 'Clientes' },
    { path: '/admin/reportes', icon: <TrendingUp size={20} />, label: 'Reportes' },
    { path: '/admin/usuarios', icon: <ShieldCheck size={20} />, label: 'Personal Admin' },
  ];

  // --- FUNCIÓN PARA CERRAR SESIÓN ---
  const handleLogout = () => {
    localStorage.removeItem('auth_pao'); // Eliminamos la bandera de autenticación
    localStorage.removeItem('admin_nombre'); // Limpiamos el nombre guardado
    setIsAuthenticated(false); // Actualizamos el estado global (esto disparará el Navigate de App.js)
  };

  return (
    <aside className="sidebar-container">
      <div className="sidebar-logo-section">
        <Hotel size={28} color="#e2b04a" /> 
        <h2 className="sidebar-logo-text">PAO ADMIN</h2>
      </div>

      <nav className="sidebar-nav">
        <ul className="sidebar-list">
          {menuItems.map((item) => (
            <li key={item.path} className="sidebar-item">
              <Link 
                to={item.path} 
                className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div style={{ 
          padding: '0 15px 15px 15px', 
          fontSize: '0.8rem', 
          color: '#94a3b8',
          borderBottom: '1px solid rgba(226, 176, 74, 0.1)',
          marginBottom: '10px'
        }}>
          Usuario: <span style={{ color: '#e2b04a' }}>{localStorage.getItem('admin_nombre') || 'Admin'}</span>
        </div>

        {/* --- ENLACE ACTUALIZADO: CERRAR SESIÓN --- */}
        <Link 
          to="/login" // Redireccionamos directamente al login
          onClick={handleLogout} 
          className="sidebar-link sidebar-link-logout"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;