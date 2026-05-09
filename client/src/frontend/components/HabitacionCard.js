import React, { useState } from 'react';
import './HabitacionCard.css';

const HabitacionCard = ({ hab }) => {
    const [verMas, setVerMas] = useState(false);
    const [mostrarModal, setMostrarModal] = useState(false);

    // Diccionarios de textos y descripciones optimizados para Sucre
    const textosInformativos = {
        'Simple': 'Explorar habitación simple',
        'Doble': 'Ver comodidad doble',
        'Matrimonial': 'Detalles de la matrimonial',
        'Triple': 'Ver espacio para tres',
        'Suite': 'Descubrir nuestra mejor Suite',
        'Familiar': 'Ver detalles para la familia',
        'Cuadruple': 'Explorar cuarto grupal'
    };

    const descripcionesPorTipo = {
        'Simple': 'Habitación acogedora con cama de plaza y media, diseñada para el descanso total con piso alfombrado que brinda calidez. Incluye un set completo de toallas (cuerpo, mano y pies) y amenidades de aseo personal. Disfrute de una estancia con privacidad al 100% en el corazón de la ciudad.',
        'Doble': 'Amplia y confortable habitación equipada con dos camas de plaza y media, ideal para compartir sin sacrificar el descanso individual. Cuenta con piso alfombrado para mayor calidez, un set completo de toallas para cada huésped y amenidades de aseo personal. Una opción segura y privada en pleno centro de la ciudad.',
        'Triple': 'Espaciosa habitación equipada con tres camas de plaza y media, ideal para grupos o delegaciones que buscan comodidad sin compartir cama. Cuenta con piso alfombrado para un ambiente cálido, sets individuales para cada huésped y amenidades de aseo personal. Ofrece total privacidad y confort en una ubicación privilegiada de Sucre.',
        'Cuadruple': 'Nuestra habitación de máxima capacidad, equipada con cuatro camas de plaza y media, diseñada para ofrecer comodidad y amplitud a familias o grupos numerosos. Cuenta con piso alfombrado para una atmósfera cálida, sets de toallas individuales para cada huésped y amenidades de aseo personal. La mejor opción para compartir una estancia segura y con total privacidad en el centro de Sucre.',
        'Matrimonial': 'El refugio ideal para parejas en Sucre. Cuenta con una amplia cama de 2 plazas diseñada para un descanso reparador, complementada con piso alfombrado que aporta calidez y confort. Incluye set de toallas de alta calidad y privacidad al 100%.',
        'Familiar': 'La opción ideal para el bienestar de su familia. Esta amplia habitación cuenta con una cama de 2 plazas y una cama adicional de plaza y media, ofreciendo el espacio perfecto para un descanso compartido. Incluye piso alfombrado, sets de toallas para cada integrante y una estancia segura.',
        'Suite': 'Nuestra opción más exclusiva y lujosa. Cuenta con una impresionante cama de 3 plazas para un descanso de nivel superior en un ambiente de gran amplitud. Equipada con piso alfombrado, set de toallas premium y amenidades de aseo personal. Ideal para quienes buscan una experiencia sofisticada, privada y con el máximo confort en Sucre.'
    };

    const textoBotonCerrado = textosInformativos[hab.tipo] || 'VER DETALLES';
    const descripcionFinal = hab.descripcion || descripcionesPorTipo[hab.tipo] || "Disfruta de una estancia confortable en el corazón de Sucre.";

    let fotoHabitacion;
    try {
        fotoHabitacion = require(`../assets/images/habitaciones/${hab.numero}.jpeg`);
    } catch (err) {
        try {
            fotoHabitacion = require(`../assets/images/habitaciones/${hab.numero}.jpg`);
        } catch (err2) {
            fotoHabitacion = "https://via.placeholder.com/400x250?text=Imagen+No+Encontrada";
        }
    }

    const obtenerClaseEstado = (estado) => {
        switch (estado) {
            case 'Disponible': return 'estado-disponible';
            case 'Ocupada': return 'estado-ocupado';
            case 'Mantenimiento': return 'estado-mantenimiento';
            default: return '';
        }
    };

    return (
        <>
            <div className="card-personalizada">
                <div className="contenedor-foto">
                    <img src={fotoHabitacion} alt={hab.tipo} className="foto-real" />
                    
                    <div className={`badge-disponibilidad ${obtenerClaseEstado(hab.estado)}`}>
                        {hab.estado}
                    </div>

                    {/* INTERFAZ DIVIDIDA: Área de interacción dual */}
                    <div className="zona-interactiva">
                        <div className="btn-interaccion ampliar" onClick={() => setMostrarModal(true)}>
                            <span className="icono-btn">🔍</span>
                            <small>AMPLIAR</small>
                        </div>
                        <div className="btn-interaccion detalles" onClick={() => setVerMas(!verMas)}>
                            <span className="icono-btn">{verMas ? '−' : '+'}</span>
                            <small>{verMas ? "CERRAR" : "INFO"}</small>
                        </div>
                    </div>
                    
                    <div className="precio-flotante">{hab.precio_noche} Bs</div>
                </div>

                <div className="card-contenido">
                    <div className="header-card">
                        <span className="categoria-label">{hab.tipo}</span>
                        <h3 className="numero-hab">Habitación {hab.numero}</h3>
                    </div>
                    
                    <div className={`detalle-extra ${verMas ? 'visible' : ''}`}>
                        <p className="descripcion-texto">{descripcionFinal}</p>
                    </div>

                    {hab.estado === 'Disponible' ? (
                        <button className="btn-pao-info" onClick={() => window.location.href='/reservas'}>
                            Consultar Disponibilidad con PAO
                        </button>
                    ) : (
                        <button className="btn-bloqueado" disabled>No disponible actualmente</button>
                    )}
                </div>
            </div>

            {mostrarModal && (
                <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
                    <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
                        <span className="cerrar-modal" onClick={() => setMostrarModal(false)}>&times;</span>
                        <img src={fotoHabitacion} alt="Vista ampliada" className="foto-ampliada" />
                        <div className="modal-info">
                            <h4>Habitación {hab.numero} - {hab.tipo}</h4>
                            <p>{hab.precio_noche} Bs por noche</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HabitacionCard;