import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, User } from 'lucide-react';
import './Navbar.css';

// 1. IMPORTAMOS LA IMAGEN DEL LOGO (Ingeniería de Assets)
import logoPaola from '../assets/images/logo.png'; // Asegúrate de que la ruta relativa sea correcta

const Navbar = () => {
  return (
    <nav className="navbar">
      {/* 2. REEMPLAZAMOS EL CONTENIDO DEL LOGO */}
      <div className="logo-container">
        <Link to="/">
          <img 
            src={logoPaola} 
            alt="Logo Paola Hostal Sucre" 
            className="logo-img" 
          />
        </Link>
      </div>

      <div className="nav-links">
        <Link to="/" className="nav-link">INICIO</Link>
        <Link to="/habitaciones" className="nav-link">HABITACIONES</Link>
        <Link to="/chat" className="nav-link">ASISTENTE IA</Link>
        <Link to="/sucre" className="nav-link">TURISMO</Link>
      </div>

      <div className="right-section">
        <Link to="/login" className="login-btn">
          <User size={18} style={{marginRight: '8px'}} />
          INTRANET
        </Link>
        <Menu size={24} className="menu-icon" />
      </div>
    </nav>
  );
};

export default Navbar;