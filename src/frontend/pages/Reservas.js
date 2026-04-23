import React, { useEffect, useState } from 'react';
import './AdminPages.css';

const Reservas = () => {
    // --- ESTADOS ---
    const [reservas, setReservas] = useState([]); 
    const [habitaciones, setHabitaciones] = useState([]); 
    const [mostrarModal, setMostrarModal] = useState(false); 
    const [nuevoReg, setNuevoReg] = useState({ 
        nombre: '', documento: '', telefono: '', email: '',
        id_habitacion: '', fecha_ingreso: '', fecha_salida: '', monto_total: 0
    });

    // --- CARGA DE DATOS ---
    useEffect(() => {
        cargarReservas();
        cargarHabitacionesDisponibles();
    }, []);

    // --- CÁLCULO AUTOMÁTICO DEL MONTO ---
    useEffect(() => {
        if (nuevoReg.fecha_ingreso && nuevoReg.fecha_salida && nuevoReg.id_habitacion) {
            const ingreso = new Date(nuevoReg.fecha_ingreso);
            const salida = new Date(nuevoReg.fecha_salida);
            const diffTime = salida - ingreso;
            const noches = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (noches > 0) {
                const habSeleccionada = habitaciones.find(h => h.id_habitacion === parseInt(nuevoReg.id_habitacion));
                if (habSeleccionada) {
                    const totalCalculado = habSeleccionada.precio_noche * noches;
                    setNuevoReg(prev => ({ ...prev, monto_total: totalCalculado }));
                }
            } else {
                setNuevoReg(prev => ({ ...prev, monto_total: 0 }));
            }
        }
    }, [nuevoReg.fecha_ingreso, nuevoReg.fecha_salida, nuevoReg.id_habitacion, habitaciones]);

    // --- FUNCIONES API ---
    const cargarReservas = () => {
        fetch('http://localhost:5000/api/lista-reservas').then(res => res.json()).then(data => setReservas(data));
    };

    const cargarHabitacionesDisponibles = () => {
        fetch('http://localhost:5000/api/habitaciones')
            .then(res => res.json())
            .then(data => setHabitaciones(data.filter(h => h.estado === 'Disponible')));
    };

    const handleCrearReserva = async (e) => {
        e.preventDefault();
        if (nuevoReg.monto_total <= 0) return alert("Error: Revisa las fechas.");

        const res = await fetch('http://localhost:5000/api/reserva-manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoReg)
        });
        const data = await res.json();
        if (data.success) {
            alert(data.mensaje);
            setMostrarModal(false);
            cargarReservas();
            cargarHabitacionesDisponibles();
            setNuevoReg({ nombre: '', documento: '', telefono: '', email: '', id_habitacion: '', fecha_ingreso: '', fecha_salida: '', monto_total: 0 });
        }
    };

    const cancelarReservaManual = async (id) => {
        if (window.confirm("¿Deseas cancelar esta reserva?")) {
            const res = await fetch(`http://localhost:5000/api/cancelar-reserva/${id}`, { method: 'PUT' });
            const data = await res.json();
            if (data.success) {
                cargarReservas();
                cargarHabitacionesDisponibles();
            }
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-header-flex">
                <h2 className="page-title">Historial de Reservas PAO</h2>
                <button className="btn-add-reserva" onClick={() => setMostrarModal(true)}>
                    + Nueva Reserva Manual
                </button>
            </div>

            {/* --- MODAL FLOTANTE --- */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Registrar Reserva Manual</h3>
                            <button className="btn-close" onClick={() => setMostrarModal(false)}>&times;</button>
                        </div>
                        <form className="modal-form" onSubmit={handleCrearReserva}>
                            <div className="form-group">
                                <label>Nombre del Huésped</label>
                                <input type="text" required value={nuevoReg.nombre} onChange={e => setNuevoReg({...nuevoReg, nombre: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>CI / Pasaporte</label>
                                <input type="text" required value={nuevoReg.documento} onChange={e => setNuevoReg({...nuevoReg, documento: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Teléfono</label>
                                <input type="text" required value={nuevoReg.telefono} onChange={e => setNuevoReg({...nuevoReg, telefono: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" required value={nuevoReg.email} onChange={e => setNuevoReg({...nuevoReg, email: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Fecha Ingreso</label>
                                <input type="date" required value={nuevoReg.fecha_ingreso} onChange={e => setNuevoReg({...nuevoReg, fecha_ingreso: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Fecha Salida</label>
                                <input type="date" required value={nuevoReg.fecha_salida} onChange={e => setNuevoReg({...nuevoReg, fecha_salida: e.target.value})} />
                            </div>
                            
                            {/* --- SELECTOR DE HABITACIÓN ACTUALIZADO --- */}
                            <div className="form-group">
                                <label>Habitación Disponible</label>
                                <select required value={nuevoReg.id_habitacion} onChange={e => setNuevoReg({...nuevoReg, id_habitacion: e.target.value})}>
                                    <option value="">Seleccionar...</option>
                                    {habitaciones.map(h => (
                                        <option key={h.id_habitacion} value={h.id_habitacion}>
                                            Hab. {h.numero} - {h.tipo} ({h.precio_noche} Bs/noche)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Monto Total Automático (Bs)</label>
                                <input 
                                    type="number" 
                                    value={nuevoReg.monto_total} 
                                    readOnly 
                                    style={{ background: '#f1f5f9', fontWeight: 'bold', color: '#e2b04a' }} 
                                />
                            </div>
                            <button type="submit" className="btn-submit-modal">Confirmar Registro</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- TABLA --- */}
            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Hab.</th>
                            <th>Ingreso</th>
                            <th>Salida</th>
                            <th>Monto</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservas.map(r => (
                            <tr key={r.id_reserva}>
                                <td>#{r.id_reserva}</td>
                                <td>{r.nombre_completo}</td>
                                <td>{r.numero}</td>
                                <td>{new Date(r.fecha_ingreso).toLocaleDateString()}</td>
                                <td>{new Date(r.fecha_salida).toLocaleDateString()}</td>
                                <td>{r.monto_total} Bs.</td>
                                <td><span className={`status-badge ${r.estado_reserva.toLowerCase()}`}>{r.estado_reserva}</span></td>
                                <td>
                                    {r.estado_reserva === 'Confirmada' && (
                                        <button className="btn-cancel" onClick={() => cancelarReservaManual(r.id_reserva)}>Cancelar</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reservas;