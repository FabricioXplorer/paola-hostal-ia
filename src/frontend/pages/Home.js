import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import logoPaola from '../assets/images/logo.png';

const Home = () => {
  const navigate = useNavigate();

  // Función para redirigir a la vista de IA
  const irAReservasIA = (e) => {
    if (e) e.preventDefault();
    navigate('/reservas');
  };

  return (
    <div className="bon-voyage-container">
      {/* 2. CONTENIDO CENTRAL (PAO) */}
      <main className="bv-hero-content">
        <div className="pao-badge">
          <span className="pao-dot"></span> ASISTENTE INTELIGENTE ACTIVO
        </div>
        <h1 className="pao-title">
            TU ESTANCIA EN SUCRE, <br />
            <span>AHORA A UN CLIC.</span>
        </h1>
        <p className="pao-subtitle">
          Verifico disponibilidad y gestiono tu reserva al instante <br />
          para tu mejor estancia en la Ciudad Blanca.
        </p>
        <div className="pao-hero-actions">
          <button className="bv-btn-reserve-now" onClick={irAReservasIA}>RESERVAR AHORA</button>
          <button className="bv-btn-secondary">VER HABITACIONES</button>
        </div>
      </main>

      {/* 3. SECCIÓN HABITACIONES INMERSIVAS (Impacto Visual Completo) */}
      <section className="bv-rooms-preview">
        <div className="section-header">
          <span className="section-tag">NUESTROS AMBIENTES</span>
          <h2 className="section-title">Habitaciones Diseñadas para tu Descanso</h2>
        </div>

        <div className="rooms-grid">
          {/* 1. Simple */}
          <div className="room-card">
            <div className="room-img-container">
              <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500" alt="Simple" />
              <div className="room-price-tag">190 Bs.</div>
            </div>
            <div className="room-info">
              <h3>Habitación Simple</h3>
              <p>Confort individual con escritorio y baño privado.</p>
              <button className="bv-btn-info">MÁS INFO <i className="fa-solid fa-arrow-right"></i></button>
            </div>
          </div>

          {/* 2. Doble */}
          <div className="room-card">
            <div className="room-img-container">
              <img src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=500" alt="Doble" />
              <div className="room-price-tag">280 Bs.</div>
            </div>
            <div className="room-info">
              <h3>Habitación Doble</h3>
              <p>Espacio compartido con camas premium y vista al patio.</p>
              <button className="bv-btn-info">MÁS INFO <i className="fa-solid fa-arrow-right"></i></button>
            </div>
          </div>

          {/* 3. Matrimonial */}
          <div className="room-card">
            <div className="room-img-container">
              <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500" alt="Matrimonial" />
              <div className="room-price-tag">280 Bs.</div>
            </div>
            <div className="room-info">
              <h3>Habitación Matrimonial</h3>
              <p>Elegancia y privacidad para una estancia inolvidable.</p>
              <button className="bv-btn-info">MÁS INFO <i className="fa-solid fa-arrow-right"></i></button>
            </div>
          </div>

          {/* 4. Triple */}
          <div className="room-card">
            <div className="room-img-container">
              <img src="https://images.unsplash.com/photo-1544124499-58912cbddaad?w=500" alt="Triple" />
              <div className="room-price-tag">380 Bs.</div>
            </div>
            <div className="room-info">
              <h3>Habitación Triple</h3>
              <p>Amplio espacio para grupos o amigos con total comodidad.</p>
              <button className="bv-btn-info">MÁS INFO <i className="fa-solid fa-arrow-right"></i></button>
            </div>
          </div>

          {/* 5. Cuádruple */}
          <div className="room-card">
            <div className="room-img-container">
              <img src="https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=500" alt="Cuádruple" />
              <div className="room-price-tag">500 Bs.</div>
            </div>
            <div className="room-info">
              <h3>Habitación Cuádruple</h3>
              <p>Ideal para delegaciones o grupos grandes de viajeros.</p>
              <button className="bv-btn-info">MÁS INFO <i className="fa-solid fa-arrow-right"></i></button>
            </div>
          </div>

          {/* 6. Familiar */}
          <div className="room-card">
            <div className="room-img-container">
              <img src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500" alt="Familiar" />
              <div className="room-price-tag">380 Bs.</div>
            </div>
            <div className="room-info">
              <h3>Habitación Familiar</h3>
              <p>Ambiente acogedor diseñado para el bienestar de tu familia.</p>
              <button className="bv-btn-info">MÁS INFO <i className="fa-solid fa-arrow-right"></i></button>
            </div>
          </div>

          {/* 7. Suite */}
          <div className="room-card room-card-suite">
            <div className="room-img-container">
              <img src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500" alt="Suite" />
              <div className="room-price-tag">380 Bs.</div>
            </div>
            <div className="room-info">
              <h3>Habitación Suite</h3>
              <p>Nuestra opción de lujo con áreas integradas y confort superior.</p>
              <button className="bv-btn-info">MÁS INFO <i className="fa-solid fa-arrow-right"></i></button>
            </div>
          </div>

          {/* BLOQUE PAO - RECOMENDACIÓN AMPLIA */}
          <div className="pao-recommendation-wide">
            <div className="pao-rec-wrapper">
              <div className="pao-badge-mini">
                <span className="pao-dot"></span> ASISTENTE INTELIGENTE
              </div>
              <h3 className="pao-rec-title">
                ¿DUDAS SOBRE TU <br /><span>ELECCIÓN IDEAL?</span>
              </h3>
              <p className="pao-rec-subtitle">
                No te preocupes por los detalles. Cuéntame con quién viajas o el motivo de tu visita 
                y seleccionaré la habitación que mejor se adapte a tus necesidades al instante.
              </p>
              <div className="pao-hero-actions">
                <button className="bv-btn-chat-pao" onClick={irAReservasIA}>
                  SOLICITAR RECOMENDACIÓN <i className="fa-solid fa-wand-magic-sparkles"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN DESAYUNO BUFETE (Mantenida completa) */}
      <section className="bv-buffet-section">
        <div className="buffet-overlay-centered">
          <div className="buffet-content-centered">
            <span className="buffet-tag">SABORES DE LA MAÑANA</span>
            <h2 className="buffet-title">Desayuno Bufete Regional</h2>
            <p className="buffet-description">
              Disfruta de una variedad completa para empezar tu día con energía. <br />
              Desde opciones saludables hasta clásicos calientes, servidos cada mañana.
            </p>
            
            <div className="buffet-menu-grid-centered">
              <div className="menu-category">
                <h4><i className="fa-solid fa-leaf"></i> Saludable</h4>
                <p>Yogurt, granola, gelatina y frutas.</p>
              </div>
              <div className="menu-category">
                <h4><i className="fa-solid fa-egg"></i> Calientes</h4>
                <p>Huevos estrellados y a la copa.</p>
              </div>
              <div className="menu-category">
                <h4><i className="fa-solid fa-mug-hot"></i> Bebidas</h4>
                <p>Café premium, mates y jugos.</p>
              </div>
              <div className="menu-category">
                <h4><i className="fa-solid fa-clock"></i> Horario</h4>
                <p>07:30 a 09:30 AM.</p>
              </div>
            </div>

            <div className="buffet-actions-centered">
              <div className="buffet-badge">
                <i className="fa-solid fa-circle-check"></i> INCLUIDO EN TODAS TUS RESERVAS
              </div>
              <button className="bv-btn-buffet-more">
                MÁS DETALLES <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER FINAL (Mantenido completo) */}
      <footer className="bv-footer">
        <div className="footer-content">
          <div className="footer-column brand-col">
            <img src={logoPaola} alt="Paola Hostal" className="footer-logo" />
            <p>Tu lugar ideal en el corazón histórico de la Ciudad Blanca.</p>
            <div className="footer-socials">
              <a href="#"><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#"><i className="fa-brands fa-whatsapp"></i></a>
              <a href="#"><i className="fa-brands fa-tiktok"></i></a>
            </div>
          </div>

          <div className="footer-column">
            <h4>EXPLORAR</h4>
            <ul>
              <li><a href="/reservas" onClick={irAReservasIA}>Reservas Con IA</a></li>
              <li><a href="/habitaciones">Habitaciones</a></li>
              <li><a href="/servicios">Servicios y Bufete</a></li>
              <li><a href="/nosotros">Contactos</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>CONTACTO</h4>
            <ul>
              <li><i className="fa-solid fa-location-dot"></i> Calle Colón #138, Sucre - Bolivia</li>
              <li><i className="fa-solid fa-phone"></i> +591-71154330-6441419</li>
              <li><i className="fa-solid fa-envelope"></i> hostalpaol@gmail.com</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Paola Hostal - Sistema Inteligente PAO. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;