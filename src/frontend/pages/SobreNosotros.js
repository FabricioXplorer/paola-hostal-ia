import React from 'react';
import './SobreNosotros.css';

// IMPORTACIÓN DE IMÁGENES REALES
import fotoFachada from '../assets/images/habitaciones/patio.jpeg'; 
import fotoComida from '../assets/images/habitaciones/patio2.jpeg';
import fotoHabitacion from '../assets/images/habitaciones/patio3.jpeg'; 

const SobreNosotros = () => {
  return (
    <div className="about-page-container">
      {/* HERO DE LA PÁGINA */}
      <header className="about-hero">
        <span className="section-tag">CONOCE PAOLA HOSTAL</span>
        <h1>Tradición y Confort en Sucre</h1>
      </header>

      {/* SECCIÓN DESCRIPTIVA CON GALERÍA MOSAICO */}
      <section className="about-content">
        <div className="about-grid">
          <div className="about-text">
            <h2>Hospitalidad con Historia</h2>
            <p>
              Ubicados en el centro histórico de Sucre, en Paola Hostal nos dedicamos a ofrecer 
              una experiencia de alojamiento que combina la arquitectura tradicional chuquisaqueña 
              con la modernidad que el viajero de hoy necesita.
            </p>
            
            <p>
              Nuestra atención se define por la calidez y el compromiso de hacerte sentir parte de nuestra familia. 
              Bajo la guía de <strong>Rosario Ríos Mamani</strong>, transformamos una simple estancia en un recuerdo 
              inolvidable, ofreciendo un servicio personalizado que se anticipa a cada una de tus necesidades.
            </p>

            <p className="highlight-text">
              <i className="fa-solid fa-map-location-dot"></i> 
              Estás a solo 3 cuadras de la <strong>Plaza 25 de Mayo</strong>. A pasos de nosotros encontrarás 
              la emblemática Casa de la Libertad, la histórica Catedral Metropolitana y los mejores cafés 
              tradicionales donde podrás probar los famosos chocolates de la Ciudad Blanca.
            </p>
            
            <div className="about-stats">
                <div className="stat-item"><strong>+10</strong><span>Habitaciones</span></div>
                <div className="stat-item"><strong>100%</strong><span>Céntrico</span></div>
                <div className="stat-item"><strong>IA</strong><span>Soporte 24/7</span></div>
            </div>
          </div>

          {/* GALERÍA DE IMÁGENES (MOSAICO) */}
          <div className="about-gallery">
            <img 
                src={fotoFachada} 
                alt="Fachada Paola Hostal" 
                className="gallery-img main" 
            />
            <img 
                src={fotoComida} 
                alt="Patio Interior Colonial" 
                className="gallery-img" 
            />
            <img 
                src={fotoHabitacion} 
                alt="Instalaciones del Hostal" 
                className="gallery-img" 
            />
          </div>
        </div>
      </section>

      {/* SECCIÓN DE UBICACIÓN Y CONTACTO */}
      <section className="location-section">
        <div className="location-grid">
            <div className="map-container">
    <iframe 
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.530372138873!2d-65.25997232386903!3d-19.04041791104618!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x93fbcf49d0833b45%3A0x112aa4e1c42d32f3!2sPaola%20Hostal!5e0!3m2!1ses-419!2sbo!4v1715288540000!5m2!1ses-419!2sbo" 
  width="100%" 
  height="100%" 
  style={{ border: 0, borderRadius: '30px' }} 
  allowFullScreen="" 
  loading="lazy" 
  referrerPolicy="no-referrer-when-downgrade"
  title="Ubicación Paola Hostal"
></iframe>
</div>
            
            <div className="contact-details-box">
                <h3>¿Planeas tu visita?</h3>
                <p style={{ marginBottom: '20px', opacity: 0.8 }}>
                    Estamos listos para recibirte en la Ciudad Blanca.
                </p>

                <div className="c-item">
                    <i className="fa-solid fa-location-dot"></i>
                    <p>Calle Colón #138, Sucre - Bolivia</p>
                </div>
                <div className="c-item">
                    <i className="fa-solid fa-phone"></i>
                    <p>+591 71154330 | 6441419</p>
                </div>
                <div className="c-item">
                    <i className="fa-solid fa-envelope"></i>
                    <p>hostalpaol@gmail.com</p>
                </div>

                <div className="pao-invite" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                    <p style={{ fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '10px' }}>
                        ¿Necesitas recomendaciones locales o ayuda con tu reserva?
                    </p>
                    <button className="bv-btn-reserve-now" style={{ width: '100%' }}>
                        CHAT CON PAO IA
                    </button>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default SobreNosotros;