import React, { useEffect, useState } from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [habitaciones, setHabitaciones] = useState([]);

  // Función para obtener las habitaciones desde el Backend
  const obtenerHabitaciones = async () => {
    try {
      // Ajusta la URL si tu backend corre en otro puerto
      const response = await fetch('http://localhost:5000/api/habitaciones');
      const data = await response.json();
      setHabitaciones(data);
    } catch (error) {
      console.error("Error al obtener habitaciones:", error);
    }
  };

  useEffect(() => {
    obtenerHabitaciones();
    // Podrías poner un intervalo para que se actualice solo cada 10 segundos
    const interval = setInterval(obtenerHabitaciones, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">Estado del Hostal en Tiempo Real</h1>
      
      <div className="habitaciones-grid">
        {habitaciones.map((hab) => (
          <div key={hab.id_habitacion} className="card-habitacion">
            <span className="habitacion-numero">#{hab.numero}</span>
            <span className="habitacion-tipo">{hab.tipo}</span>
            <div className={`badge-estado estado-${hab.estado.toLowerCase().trim()}`}>
              {hab.estado}
            </div>
            <p style={{marginTop: '10px', fontSize: '0.8rem', color: '#94a3b8'}}>
              {hab.precio_noche} Bs.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;