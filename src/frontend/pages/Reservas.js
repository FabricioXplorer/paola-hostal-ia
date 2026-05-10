import React, { useEffect, useState } from 'react';
import './Reservas.css';

const Reservas = () => {
    const [reservas, setReservas] = useState([]);
    const [habitaciones, setHabitaciones] = useState([]); 
    const [reservaEdit, setReservaEdit] = useState(null);
    const [busqueda, setBusqueda] = useState(""); 

    const cargarDatos = async () => {
        try {
            const [resRes, resHab] = await Promise.all([
                fetch('http://localhost:5000/api/lista-reservas'),
                fetch('http://localhost:5000/api/habitaciones')
            ]);
            setReservas(await resRes.json());
            setHabitaciones(await resHab.json());
        } catch (error) { console.error("Error al cargar datos:", error); }
    };

    useEffect(() => { cargarDatos(); }, []);

    // FILTRO SEGURO: Evita errores si los datos vienen nulos o indefinidos
    const reservasFiltradas = reservas.filter(r => {
        const nombre = (r.nombre_completo || "").toLowerCase();
        const ci = (r.documento_identidad || "").toString().toLowerCase();
        const habitacion = (r.numero || "").toString().toLowerCase();
        const term = busqueda.toLowerCase();
        return nombre.includes(term) || ci.includes(term) || habitacion.includes(term);
    });

    const manejarGuardarCambios = async (e) => {
        e.preventDefault();
        const habDestino = habitaciones.find(h => h.id_habitacion === parseInt(reservaEdit.id_habitacion));
        
        if (reservaEdit.id_habitacion !== reservaEdit.id_habitacion_original) {
            if (habDestino.estado === 'Ocupada' || habDestino.estado === 'Mantenimiento') {
                return alert(`Operación rechazada: La habitación #${habDestino.numero} está ${habDestino.estado}.`);
            }
        }

        try {
            const response = await fetch(`http://localhost:5000/api/actualizar-reserva/${reservaEdit.id_reserva}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_habitacion: reservaEdit.id_habitacion,
                    id_habitacion_antigua: reservaEdit.id_habitacion_original,
                    nombre_completo: reservaEdit.nombre_completo,
                    documento_identidad: reservaEdit.documento_identidad,
                    telefono: reservaEdit.telefono,
                    fecha_ingreso: reservaEdit.fecha_ingreso,
                    fecha_salida: reservaEdit.fecha_salida,
                    monto_total: reservaEdit.monto_total,
                    estado_reserva: reservaEdit.estado_reserva
                })
            });

            if (response.ok) {
                alert("Datos actualizados correctamente.");
                setReservaEdit(null);
                cargarDatos();
            } else {
                const err = await response.json();
                alert("Error: " + err.mensaje);
            }
        } catch (error) { alert("Error de conexión al servidor."); }
    };

    return (
        <div className="res-admin-page">
            <div className="res-header-flex">
                <h2 className="res-page-title">Historial de Reservas</h2>
                <div className="res-search-container">
                    <span className="res-search-icon">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, CI o habitación..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="res-search-input"
                    />
                </div>
            </div>
            
            <div className="res-table-container">
                <table className="res-admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre del Huésped</th>
                            <th>Documento (CI)</th>
                            <th>Teléfono</th>
                            <th>Hab.</th>
                            <th>Estancia</th>
                            <th>Monto</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservasFiltradas.map(r => (
                            <tr key={r.id_reserva}>
                                <td className="res-td-id">#{r.id_reserva}</td>
                                <td className="res-td-bold">{r.nombre_completo || "Sin nombre"}</td>
                                <td className="res-td-ci">{r.documento_identidad || "S/N"}</td>
                                <td className="res-td-tel">{r.telefono || 'No reg.'}</td>
                                <td><span className="res-room-tag">{r.numero}</span></td>
                                <td>
                                    {/* Contenedor corregido para que las fechas no se encimen */}
                                    <div className="res-td-date-container">
                                        <div className="res-td-date"><strong>In:</strong> {new Date(r.fecha_ingreso).toLocaleDateString()}</div>
                                        <div className="res-td-date"><strong>Out:</strong> {new Date(r.fecha_salida).toLocaleDateString()}</div>
                                    </div>
                                </td>
                                <td className="res-td-price">{r.monto_total} Bs.</td>
                                <td><span className={`res-status-badge res-${(r.estado_reserva || "").toLowerCase()}`}>{r.estado_reserva}</span></td>
                                <td>
                                    {(r.estado_reserva !== 'Check-out' && r.estado_reserva !== 'Cancelada') && (
                                        <button 
                                            className="res-btn-edit-table" 
                                            onClick={() => setReservaEdit({...r, id_habitacion_original: r.id_habitacion})}
                                        >
                                            ✏️
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {reservaEdit && (
                <div className="res-modal-overlay">
                    <div className="res-modal-card">
                        <div className="res-modal-header">
                            <h3>Modificar Estancia #{reservaEdit.id_reserva}</h3>
                            <button className="res-close-x" onClick={() => setReservaEdit(null)}>&times;</button>
                        </div>
                        <form onSubmit={manejarGuardarCambios} className="res-modal-form">
                            <div className="res-form-group">
                                <label>Nombre del Huésped</label>
                                <input 
                                    type="text" 
                                    value={reservaEdit.nombre_completo || ""} 
                                    onChange={(e) => setReservaEdit({...reservaEdit, nombre_completo: e.target.value})} 
                                    required
                                />
                            </div>
                            <div className="res-form-grid">
                                <div className="res-form-group">
                                    <label>Documento (CI)</label>
                                    <input 
                                        type="text" 
                                        value={reservaEdit.documento_identidad || ""} 
                                        onChange={(e) => setReservaEdit({...reservaEdit, documento_identidad: e.target.value})} 
                                        required 
                                    />
                                </div>
                                <div className="res-form-group">
                                    <label>Celular</label>
                                    <input 
                                        type="tel" 
                                        value={reservaEdit.telefono || ""} 
                                        onChange={(e) => setReservaEdit({...reservaEdit, telefono: e.target.value})} 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="res-form-grid">
                                <div className="res-form-group">
                                    <label>Habitación</label>
                                    <select value={reservaEdit.id_habitacion} onChange={(e) => setReservaEdit({...reservaEdit, id_habitacion: parseInt(e.target.value)})}>
                                        {habitaciones.map(h => (
                                            <option key={h.id_habitacion} value={h.id_habitacion} disabled={h.estado !== 'Disponible' && h.id_habitacion !== reservaEdit.id_habitacion_original}>
                                                Hab. {h.numero} ({h.estado})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="res-form-group">
                                    <label>Monto Total (Bs.)</label>
                                    <input type="number" className="res-input-monto" value={reservaEdit.monto_total} readOnly style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
                                </div>
                            </div>
                            <div className="res-form-grid">
                                <div className="res-form-group">
                                    <label>Fecha Ingreso</label>
                                    <input type="date" value={(reservaEdit.fecha_ingreso || "").split('T')[0]} onChange={(e)=> setReservaEdit({...reservaEdit, fecha_ingreso: e.target.value})} />
                                </div>
                                <div className="res-form-group">
                                    <label>Fecha Salida</label>
                                    <input type="date" value={(reservaEdit.fecha_salida || "").split('T')[0]} onChange={(e)=> setReservaEdit({...reservaEdit, fecha_salida: e.target.value})} />
                                </div>
                            </div>
                            <div className="res-modal-footer">
                                <button type="submit" className="res-btn-confirm">Guardar Cambios</button>
                                <button type="button" className="res-btn-cancel" onClick={() => setReservaEdit(null)}>Cerrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reservas;