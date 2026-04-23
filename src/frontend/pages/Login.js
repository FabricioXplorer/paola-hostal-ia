// src/frontend/pages/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importamos Link para la navegación
import { Lock, User } from 'lucide-react';
import './Login.css';

const Login = ({ setIsAuthenticated }) => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: user, password: password })
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('auth_pao', 'true');
        localStorage.setItem('admin_nombre', data.nombre); // Guardamos el nombre para saludar a Rosario
        navigate('/admin');
      } else {
        setError(data.mensaje);
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleLogin}>
        <h2 className="login-title">Paola Hostal</h2>
        <p style={{color: '#64748b', marginBottom: '20px'}}>Panel de Control</p>
        
        {error && <div style={{color: '#ef4444', marginBottom: '15px', fontSize: '0.9rem'}}>{error}</div>}

        <div className="input-group">
          <User size={20} color="#e2b04a" />
          <input 
            type="text" 
            placeholder="Usuario" 
            value={user} 
            onChange={(e) => setUser(e.target.value)} 
            required
          />
        </div>
        <div className="input-group">
          <Lock size={20} color="#e2b04a" />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
        </div>
        <button type="submit" className="login-btn">Ingresar</button>

        {/* --- OPCIÓN PARA REGISTRO DE NUEVO PERSONAL --- */}
        <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#64748b' }}>
          ¿Eres personal nuevo?{' '}
          <Link to="/admin/register" style={{ color: '#e2b04a', fontWeight: 'bold', textDecoration: 'none' }}>
            Regístrate aquí
          </Link>
        </p>
        {/* ---------------------------------------------- */}
        
      </form>
    </div>
  );
};

export default Login;