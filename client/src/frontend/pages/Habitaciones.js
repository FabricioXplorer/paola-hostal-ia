import React, { useEffect, useState } from 'react';
import './Habitaciones.css';

const Habitaciones = () => {
    const [habs, setHabs] = useState([]);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [editando, setEditando] = useState(null); // null = nueva, objeto = editando

    const [formData, setFormData] = useState({
        numero: '', tipo: 'Simple', precio_noche: '', estado: 'Disponible', descripcion: ''
    });

    const obtenerHabitaciones = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/habitaciones');
            const data = await response.json();
            setHabs(data);
        } catch (error) { console.error("Error:", error); }
    };

    useEffect(() => {
        obtenerHabitaciones();
    }, []);

    const abrirModal = (hab = null) => {
        if (hab) {
            setEditando(hab);
            setFormData({ ...hab });
        } else {
            setEditando(null);
            setFormData({ numero: '', tipo: 'Simple', precio_noche: '', estado: 'Disponible', descripcion: '' });
        }
        setMostrarModal(true);
    };

    const guardarHabitacion = async (e) => {
        e.preventDefault();
        const url = editando 
            ? `http://localhost:5000/api/habitaciones-editar/${editando.id_habitacion}` 
            : `http://localhost:5000/api/habitaciones-nueva`;
        
        const metodo = editando ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                alert(editando ? "Habitación actualizada" : "Habitación creada con éxito");
                setMostrarModal(false);
                obtenerHabitaciones();
            }
        } catch (error) { alert("Error al guardar"); }
    };

    const eliminarHabitacion = async (id) => {
        if (window.confirm("¿Estás seguro? Esto podría afectar el historial de reservas.")) {
            try {
                const response = await fetch(`http://localhost:5000/api/habitaciones-eliminar/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    obtenerHabitaciones();
                } else {
                    alert("No se puede eliminar: tiene reservas asociadas.");
                }
            } catch (error) { console.error(error); }
        }
    };

    return (
        <div className="inv-admin-page">
            <div className="inv-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="inv-page-title">Gestión de Inventario de Habitaciones</h2>
                <button className="btn-final-confirm" onClick={() => abrirModal()}>+ Añadir Habitación</button>
            </div>

            <div className="inv-table-container">
                <table className="inv-admin-table">
                    <thead>
                        <tr>
                            <th>Nro</th>
                            <th>Categoría</th>
                            <th>Precio/Noche</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {habs.map(h => (
                            <tr key={h.id_habitacion}>
                                <td><strong>{h.numero}</strong></td>
                                <td>{h.tipo}</td>
                                <td>{h.precio_noche} Bs.</td>
                                <td>
                                    {/* Se asegura que muestre 'Mantenimiento' u otros estados dinámicamente */}
                                    <span className={`inv-status-badge inv-status-${h.estado.toLowerCase().trim()}`}>
                                        {h.estado}
                                    </span>
                                </td>
                                <td>
                                    <button className="inv-btn-edit" onClick={() => abrirModal(h)}>✏️</button>
                                    <button className="inv-btn-delete" onClick={() => eliminarHabitacion(h.id_habitacion)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL PARA CREAR/EDITAR CON CLASES PREFIJADAS */}
            {mostrarModal && (
                <div className="inv-modal-overlay">
                    <div className="inv-modal-content">
                        <div className="modal-header">
                            <h2>{editando ? `Editar Habitación #${editando.numero}` : 'Añadir Nueva Habitación'}</h2>
                            <button className="close-x" onClick={() => setMostrarModal(false)}>&times;</button>
                        </div>
                        <form className="modal-form" onSubmit={guardarHabitacion}>
                            <div className="form-group">
                                <label>Número de Hab.</label>
                                <input type="text" value={formData.numero} required onChange={(e) => setFormData({ ...formData, numero: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Tipo / Categoría</label>
                                <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}>
                                    <option value="Simple">Simple</option>
                                    <option value="Doble">Doble</option>
                                    <option value="Matrimonial">Matrimonial</option>
                                    <option value="Triple">Triple</option>
                                    <option value="Suite">Suite</option>
                                    <option value="Familiar">Familiar</option>
                                    <option value="Cuadruple">Cuadruple</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Precio por Noche (Bs.)</label>
                                <input type="number" value={formData.precio_noche} required onChange={(e) => setFormData({ ...formData, precio_noche: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Estado Físico</label>
                                <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })}>
                                    <option value="Disponible">Disponible</option>
                                    <option value="Ocupada">Ocupada</option>
                                    <option value="Mantenimiento">Mantenimiento</option>
                                </select>
                            </div>
                            <div className="form-group-full">
                                <label>Descripción (Detalles para la IA)</label>
                                <textarea 
                                    value={formData.descripcion} 
                                    placeholder="Ej: Cerca de la plaza, muy iluminada..." 
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} 
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn-final-confirm">Guardar Habitación</button>
                                <button type="button" className="btn-final-cancel" onClick={() => setMostrarModal(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Habitaciones;