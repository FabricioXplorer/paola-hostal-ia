// src/frontend/pages/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

    // Validación de seguridad mínima antes de enviar al servidor
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

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
        localStorage.setItem('user', JSON.stringify(data.user)); 
        localStorage.setItem('admin_nombre', data.user.nombre); 
        localStorage.setItem('admin_rol', data.user.rol.toLowerCase());
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
            placeholder="Usuario (Solo letras)" 
            value={user} 
            maxLength={10} // Límite máximo de 10 caracteres
            onChange={(e) => {
              // Bloquea números y caracteres especiales en tiempo real
              const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
              setUser(val);
            }} 
            required
          />
        </div>
        <div className="input-group">
          <Lock size={20} color="#e2b04a" />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password} 
            maxLength={6} // Límite máximo de 6 caracteres
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
        </div>
        <button type="submit" className="login-btn">Ingresar</button>

        <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#64748b' }}>
          ¿Eres personal nuevo?{' '}
          <Link to="/admin/register" style={{ color: '#e2b04a', fontWeight: 'bold', textDecoration: 'none' }}>
            Regístrate aquí
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;