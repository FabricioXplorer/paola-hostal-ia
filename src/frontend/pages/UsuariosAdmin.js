import React, { useEffect, useState } from 'react';
import './AdminPages.css';

const UsuariosAdmin = () => {
    const [personal, setPersonal] = useState([]);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [nuevoAdmin, setNuevoAdmin] = useState({ nombre: '', usuario: '', password: '', rol: 'Recepcionista' });

    useEffect(() => { cargarPersonal(); }, []);

    const cargarPersonal = () => {
        fetch('http://localhost:5000/api/administradores-lista')
            .then(res => res.json())
            .then(data => setPersonal(data));
    };

    const handleCrearAdmin = async (e) => {
        e.preventDefault();
        const res = await fetch('http://localhost:5000/api/registrar-trabajador', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoAdmin)
        });
        const data = await res.json();
        if (data.success) {
            alert(data.mensaje);
            setMostrarModal(false);
            cargarPersonal();
        } else { alert(data.mensaje); }
    };

    const eliminarAdmin = async (id) => {
        if (window.confirm("¿Estás seguro de quitarle el acceso a este trabajador?")) {
            const res = await fetch(`http://localhost:5000/api/eliminar-trabajador/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) cargarPersonal();
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-header-flex">
                <h2 className="page-title">Gestión de Personal Administrativo</h2>
                <button className="btn-add-reserva" onClick={() => setMostrarModal(true)}>+ Nuevo Trabajador</button>
            </div>

            {/* MODAL DE REGISTRO */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Alta de Trabajador</h3>
                            <button className="btn-close" onClick={() => setMostrarModal(false)}>&times;</button>
                        </div>
                        <form className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }} onSubmit={handleCrearAdmin}>
                            <div className="form-group">
                                <label>Nombre Completo</label>
                                <input type="text" required onChange={e => setNuevoAdmin({...nuevoAdmin, nombre: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Usuario (Login)</label>
                                <input type="text" required onChange={e => setNuevoAdmin({...nuevoAdmin, usuario: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Password Provisional</label>
                                <input type="password" required onChange={e => setNuevoAdmin({...nuevoAdmin, password: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Rol</label>
                                <select onChange={e => setNuevoAdmin({...nuevoAdmin, rol: e.target.value})}>
                                    <option value="Recepcionista">Recepcionista</option>
                                    <option value="SuperAdmin">SuperAdmin</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-submit-modal">Registrar Trabajador</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Último Acceso</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {personal.map(u => (
                            <tr key={u.id_admin}>
                                <td>{u.nombre}</td>
                                <td>{u.usuario}</td>
                                <td>
                                    <span className={`status-badge ${u.rol.toLowerCase()}`}>{u.rol}</span>
                                </td>
                                <td>{u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString() : 'Sin actividad'}</td>
                                <td>
                                    <button className="btn-cancel" onClick={() => eliminarAdmin(u.id_admin)}>Quitar Acceso</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsuariosAdmin;