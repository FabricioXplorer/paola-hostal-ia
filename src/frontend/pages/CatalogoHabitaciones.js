import React, { useEffect, useState } from 'react';
import HabitacionCard from '../components/HabitacionCard'; 
import './CatalogoHabitaciones.css';

const CatalogoHabitaciones = () => {
    const [habitaciones, setHabitaciones] = useState([]);

    // 1. Definimos la función de carga fuera del useEffect para poder reutilizarla
    const obtenerHabitaciones = () => {
        fetch('http://localhost:5000/api/habitaciones')
            .then(res => res.json())
            .then(data => setHabitaciones(data))
            .catch(err => console.error("Error al cargar el catálogo:", err));
    };

    useEffect(() => {
        // Ejecución inicial inmediata al cargar el componente
        obtenerHabitaciones();

        // 2. Configuramos el intervalo de actualización automática (cada 15 segundos)
        const intervalo = setInterval(() => {
            console.log("Sincronizando catálogo con la base de datos...");
            obtenerHabitaciones();
        }, 15000); 

        // 3. Limpieza del intervalo cuando el usuario sale de la página
        // Esto evita fugas de memoria y peticiones innecesarias
        return () => clearInterval(intervalo);
    }, []);

    return (
        <div className="catalogo-container">
            <div className="catalogo-header">
                <h2>Conoce nuestras instalaciones</h2>
                <p>Habitaciones diseñadas para tu confort en la ciudad de Sucre</p>
            </div>
            
            <div className="habitaciones-grid">
                {habitaciones.length > 0 ? (
                    habitaciones.map(hab => (
                        <HabitacionCard key={hab.id_habitacion} hab={hab} />
                    ))
                ) : (
                    <p style={{ textAlign: 'center', color: 'white' }}>Cargando habitaciones disponibles...</p>
                )}
            </div>
        </div>
    );
};

export default CatalogoHabitaciones;