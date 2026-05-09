import React from 'react';
import './ServiciosBufete.css';

// Paso 1: Importar tu imagen real
import fotoDesayuno from '../assets/images/habitaciones/comida1.jpeg'; 

const ServiciosBufete = () => {
    return (
        <div className="servicios-page-container">
            <header className="servicios-hero">
                <span className="section-tag">SABORES Y BIENESTAR</span>
                <h1>Servicios & Desayuno Bufete</h1>
                <div className="decoracion-linea"></div>
            </header>

            <section className="desayuno-detalle">
                <div className="detalle-grid">
                    <div className="detalle-info">
                        <h2>Desayuno Bufete Regional</h2>
                        <p>
                            Inicia tu mañana en la Ciudad Blanca con lo mejor de nuestra gastronomía.
                            Nuestro bufete está incluido en todas las tarifas de habitación.
                        </p>
                       
                        <ul className="lista-menu">
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <strong>Frutas y Saludable:</strong>
                                <span>Ensalada de frutas frescas, yogur natural, granola y gelatinas.</span>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <strong>Estación Caliente:</strong>
                                <span>Huevos preparados al momento (estrellados o a la copa).</span>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <strong>Panadería:</strong>
                                <span>Variedad de panes locales acompañados de mermelada y mantequilla.</span>
                            </li>
                            <li>
                                <i className="fa-solid fa-check"></i>
                                <strong>Bebidas:</strong>
                                <span>Café premium, jugos de temporada y selección de mates.</span>
                            </li>
                        </ul>
                       
                        <div className="horario-badge">
                            <i className="fa-solid fa-clock"></i> Horario: 07:30 AM - 09:30 AM
                        </div>
                    </div>
                   
                    <div className="detalle-imagen">
                        {/* Paso 2: Usar la variable de la imagen importada */}
                        <img
                            src={fotoDesayuno}
                            alt="Desayuno Real en Paola Hostal"
                        />
                    </div>
                </div>
            </section>

            <section className="otros-servicios">
                <h2>Comodidades Adicionales</h2>
                <div className="servicios-grid-cards">
                    <div className="s-card">
                        <i className="fa-solid fa-wifi"></i>
                        <h3>Wi-Fi de Alta Velocidad</h3>
                        <p>Conexión estable en todas las áreas y habitaciones.</p>
                    </div>
                    <div className="s-card">
                        <i className="fa-solid fa-shield-halved"></i>
                        <h3>Seguridad 24/7</h3>
                        <p>Cámaras de vigilancia y personal presente todo el tiempo.</p>
                    </div>
                    <div className="s-card">
                        <i className="fa-solid fa-mug-hot"></i>
                        <h3>Área de Descanso</h3>
                        <p>Patio tradicional ideal para leer o disfrutar un mate.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ServiciosBufete;