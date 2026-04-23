import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, BadgeCheck } from 'lucide-react';
import './Login.css'; // Usamos el mismo estilo del login para consistencia

const Register = () => {
  const [formData, setFormData] = useState({ nombre: '', usuario: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert("¡Cuenta creada! Ahora puedes iniciar sesión.");
        navigate('/login');
      } else {
        setError(data.mensaje);
      }
    } catch (err) {
      setError("Error al conectar con el servidor.");
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleRegister}>
        <h2 className="login-title">Nuevo Administrador</h2>
        <p style={{color: '#64748b', marginBottom: '20px'}}>Crea tu cuenta de acceso</p>

        {error && <div style={{color: '#ef4444', marginBottom: '15px', fontSize: '0.9rem'}}>{error}</div>}

        <div className="input-group">
          <BadgeCheck size={20} color="#e2b04a" />
          <input type="text" placeholder="Nombre Completo" required
            onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
        </div>

        <div className="input-group">
          <User size={20} color="#e2b04a" />
          <input type="text" placeholder="Usuario" required
            onChange={(e) => setFormData({...formData, usuario: e.target.value})} />
        </div>

        <div className="input-group">
          <Lock size={20} color="#e2b04a" />
          <input type="password" placeholder="Contraseña" required
            onChange={(e) => setFormData({...formData, password: e.target.value})} />
        </div>

        <button type="submit" className="login-btn">Registrar Cuenta</button>
        
        <p style={{marginTop: '20px', fontSize: '0.9rem'}}>
          ¿Ya tienes cuenta? <Link to="/login" style={{color: '#e2b04a', fontWeight: 'bold'}}>Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;