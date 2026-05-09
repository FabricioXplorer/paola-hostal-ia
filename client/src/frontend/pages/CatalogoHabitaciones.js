import React, { useEffect, useState } from 'react';
import HabitacionCard from '../components/HabitacionCard'; 
import './CatalogoHabitaciones.css';

const CatalogoHabitaciones = () => {
    const [habitaciones, setHabitaciones] = useState([]);

    const obtenerHabitaciones = () => {
        fetch('http://localhost:5000/api/habitaciones')
            .then(res => res.json())
            .then(data => setHabitaciones(data))
            .catch(err => console.error("Error al cargar el catálogo:", err));
    };

    useEffect(() => {
        obtenerHabitaciones();

        const intervalo = setInterval(() => {
            console.log("Sincronizando catálogo con la base de datos...");
            obtenerHabitaciones();
        }, 15000); 

        return () => clearInterval(intervalo);
    }, []);

    return (
        <div className="catalogo-container">
            {/* ENCABEZADO MEJORADO: Ahora con más aire y mejor contraste */}
            <header className="catalogo-header">
                <span className="subtitle-superior">EXPERIENCIA PAOLA HOSTAL</span>
                <h2 className="titulo-principal">Nuestras Instalaciones</h2>
                <div className="decoracion-linea"></div>
                <p className="descripcion-header">
                    Descubre el equilibrio perfecto entre descanso y tradición en el corazón de Sucre. 
                    Espacios diseñados para ofrecerte calidez y confort absoluto.
                </p>
            </header>
            
            <div className="habitaciones-grid">
                {habitaciones.length > 0 ? (
                    habitaciones.map(hab => (
                        <HabitacionCard key={hab.id_habitacion} hab={hab} />
                    ))
                ) : (
                    <p className="mensaje-carga">Cargando habitaciones disponibles...</p>
                )}
            </div>
        </div>
    );
};

export default CatalogoHabitaciones;