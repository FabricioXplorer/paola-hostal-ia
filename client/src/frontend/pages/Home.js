import React from 'react';
import './Home.css';
import logoPaola from '../assets/images/logo.png';

const Home = () => {
  return (
    <div className="bon-voyage-container">
      {/* 1. HEADER SUPERIOR */}
      <header className="bv-header">
        <div className="bv-logo-section">
          <img src={logoPaola} alt="Paola Hostal" className="bv-main-logo" />
        </div>
        <nav className="bv-nav">
          <a href="/" className="active">Inicio</a>
          <a href="/habitaciones">Reservas</a>
          <a href="/ia">Sitios</a>
          <a href="/sucre">Contactanos</a>
        </nav>
      </header>

      <div className="bv-main-layout">
        {/* 2. COLUMNA IZQUIERDA (Sidebar) */}
        <aside className="bv-sidebar">
          <div className="bv-socials">
            <i className="fa-brands fa-facebook-f"></i>
            <i className="fa-brands fa-twitter"></i>
            <i className="fa-brands fa-instagram"></i>
            <i className="fa-brands fa-pinterest-p"></i>
          </div>

          <div className="bv-search-tag-container">
            <i className="fa-solid fa-binoculars bv-icon-big"></i>
            <div className="bv-search-btn-box">BÚSQUEDA</div>
            <p className="bv-search-subtext">Para tu sitio ideal</p>
          </div>
          
          <button className="bv-welcome-world">DESCUBRE EL PAOLA HOSTAL</button> 

          <div className="bv-data-widget">
            <div className="widget-title">
              Precio de habitaciones <i className="fa-solid fa-bed"></i>
            </div>
            <ul className="widget-list">
              <li>Habitación Simple <span>190 Bs.</span></li>
              <li>Habitación Doble <span>280 Bs.</span></li>
              <li>Habitación Triple <span>380 Bs.</span></li>
              <li>Habitación Cuádruple<span>500 Bs.</span></li>
              <li>Habitación Matrimonial <span>280 Bs.</span></li>
              <li>Habitación Familiar <span>380 Bs.</span></li>
              <li>Habitación Suite<span>380 Bs.</span></li>
            </ul>
          </div>

          <div className="bv-data-widget">
            <div className="widget-title">
              Servicios Incluidos <i className="fa-solid fa-bell-concierge"></i>
            </div>
            <ul className="widget-list">
                <li>Agua Caliente 24/7 <span>Incluido</span></li>
                <li>Baño privado <span>Incluido</span></li>
                <li>Desayuno Bufete <span>Completo</span></li>
                <li>Cámaras de Seguridad <span>Seguro</span></li>
                <li>Tv Cable <span>Incluido</span></li>
                <li>Wi Fi Gratis <span>Gratis</span></li>
            </ul>
          </div>

          <div className="bv-data-widget">
            <div className="widget-title">
              Estado del Tiempo <i className="fa-solid fa-cloud-sun"></i>
            </div>
            <div className="weather-info" style={{textAlign: 'center', padding: '10px'}}>
              <span style={{fontSize: '24px', fontWeight: '800', color: '#C5A059'}}>21°C</span>
              <p style={{fontSize: '10px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px'}}>
                Sucre, Bolivia - Despejado
              </p>
            </div>
          </div>
        </aside>
        

        {/* 3. BLOQUE DERECHO (ÁREA DE CONTENIDO) */}
        <section className="bv-content-area">
          
          <div className="bv-main-content-flex">
            {/* CHAT DE PAO: Prototipo Principal */}
            <div className="bv-chat-glass-container">
                <div className="bv-chat-header-integrated">
                  <div className="bv-pao-brand">
                      <div className="status-indicator"></div>
                      <h3>PAO <span>SISTEMA INTELIGENTE</span></h3>
                  </div>
                  <div className="bv-chat-controls">
                      <i className="fa-solid fa-expand-arrows-alt"></i>
                  </div>
                </div>
                
                <div className="bv-chat-body-integrated">
                  <div className="bv-bubble-integrated">
                      <p>TE DOY LA BIENVENIDA, SOY <span>PAO</span>.</p>
                      <p>Puedo verificar <strong>disponibilidad</strong> y gestionar tu <strong>reserva</strong> al instante.</p>
                      <p>¿Qué habitación buscas hoy?</p>
                  </div>

                  <div className="bv-chat-actions-integrated">
                      <button className="bv-action-pill">CONSULTAR DISPONIBILIDAD</button>
                      <button className="bv-action-pill-outline">VER HABITACIONES</button>
                  </div>
                </div>
            </div>

            {/* DECORACIÓN: Bloque Ciudad */}
            <div className="bv-destination-card">
                <h2 className="city-title">SUCRE</h2>
                <p className="city-tagline">LA CIUDAD BLANCA</p>
                <div className="city-description">
                    Patrimonio de la Humanidad. Disfruta de la arquitectura colonial 
                    y el mejor clima de Bolivia.
                </div>
                <button className="bv-explore-btn">EXPLORAR CIUDAD</button>
            </div>
          </div>

          {/* GALERÍA DE AMBIENTES */}
          <div className="bv-quick-gallery">
            <div className="gallery-item">
              <div className="gallery-img-wrapper">
                <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300" alt="Habitación" />
                <div className="gallery-label">HABITACIONES</div>
              </div>
            </div>

            <div className="gallery-item">
              <div className="gallery-img-wrapper">
                <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=300" alt="Patio colonial" />
                <div className="gallery-label">PATIO COLONIAL</div>
              </div>
            </div>

            <div className="gallery-item">
              <div className="gallery-img-wrapper">
                <img src="https://images.unsplash.com/photo-1551882547-ff43c63faf76?auto=format&fit=crop&w=300" alt="Desayuno" />
                <div className="gallery-label">DESAYUNO BUFETE</div>
              </div>
            </div>

            <div className="gallery-item">
              <div className="gallery-img-wrapper">
                <img src="https://images.unsplash.com/photo-1518182170546-07661fd94144?auto=format&fit=crop&w=300" alt="Sucre" />
                <div className="gallery-label">CENTRO HISTÓRICO</div>
              </div>
            </div>
          </div>

          {/* CONSOLA DE DATOS INFERIOR */}
          <div className="bv-bottom-data-row">
            <div className="bv-status-widget-horizontal">
                <div className="widget-header-gold">
                    ESTADO DEL SISTEMA EN TIEMPO REAL <i className="fa-solid fa-microchip"></i>
                </div>
                
                <div className="status-grid-horizontal">
                    <div className="status-item-mini">
                        <p>Habitaciones Libres</p>
                        <div className="status-flex">
                          <span>12 / 18</span>
                          <div className="progress-bar-mini">
                            <div className="progress-fill" style={{width: '65%'}}></div>
                          </div>
                        </div>
                    </div>

                    <div className="status-item-mini">
                        <p>Demanda hoy</p>
                        <span className="demand-tag">ALTA <i className="fa-solid fa-chart-line"></i></span>
                    </div>

                    <div className="status-item-mini">
                        <p>Siguiente Limpieza</p>
                        <span className="time-tag">14:30 PM <i className="fa-solid fa-clock"></i></span>
                    </div>

                    <div className="system-sync">
                        <div className="sync-dot"></div> SISTEMA SINCRONIZADO
                    </div>
                </div>
            </div>
          </div>

        </section>
      </div>
    </div>
  );
};

export default Home;