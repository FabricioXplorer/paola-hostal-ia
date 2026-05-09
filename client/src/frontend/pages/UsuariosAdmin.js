import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Edit3, Save, X } from 'lucide-react'; 
import './UsuariosAdmin.css';

const UsuariosAdmin = () => {
    const [personal, setPersonal] = useState([]);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [nuevoAdmin, setNuevoAdmin] = useState({ nombre: '', usuario: '', password: '', rol: 'Recepcionista' });
    const [adminLogueado, setAdminLogueado] = useState(null);

    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [mostrarPasswordId, setMostrarPasswordId] = useState(null);

    useEffect(() => { 
        cargarPersonal(); 
        const dataStorage = localStorage.getItem('user');
        if (dataStorage) {
            try {
                const parsedUser = JSON.parse(dataStorage);
                setAdminLogueado(parsedUser);
            } catch (e) {
                console.error("Error al leer sesión:", e);
            }
        }
    }, []);

    const cargarPersonal = () => {
        fetch('http://localhost:5000/api/administradores-lista')
            .then(res => res.json())
            .then(data => setPersonal(data));
    };

    const handleCrearAdmin = async (e) => {
        e.preventDefault();
        if (adminLogueado?.rol !== 'SuperAdmin') {
            alert("Acción bloqueada: Solo SuperAdmin puede crear personal.");
            return;
        }

        // VALIDACIONES DE SEGURIDAD
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/.test(nuevoAdmin.usuario)) {
            alert("El usuario solo debe contener letras.");
            return;
        }
        if (nuevoAdmin.password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        const res = await fetch('http://localhost:5000/api/registrar-trabajador', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoAdmin)
        });
        const data = await res.json();
        if (data.success) {
            alert("Trabajador registrado con éxito en Paola Hostal");
            setMostrarModal(false);
            setNuevoAdmin({ nombre: '', usuario: '', password: '', rol: 'Recepcionista' });
            cargarPersonal();
        } else { alert(data.mensaje); }
    };

    const handleGuardarEdicion = async (id) => {
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/.test(usuarioEditando.usuario)) {
            alert("El usuario solo debe contener letras.");
            return;
        }
        if (usuarioEditando.password && usuarioEditando.password.length < 6) {
            alert("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/actualizar-trabajador/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(usuarioEditando)
            });
            const data = await res.json();
            if (data.success) {
                alert("Datos actualizados correctamente");
                setUsuarioEditando(null);
                cargarPersonal();
            } else {
                alert("Error: " + data.mensaje);
            }
        } catch (e) { alert("Error al conectar con el servidor"); }
    };

    const eliminarAdmin = async (id, nombreTarget) => {
        if (window.confirm(`¿Estás seguro de quitarle el acceso a ${nombreTarget}?`)) {
            const res = await fetch(`http://localhost:5000/api/eliminar-trabajador/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                alert("Acceso revocado correctamente.");
                cargarPersonal();
            }
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-header-flex">
                <div className="title-section">
                    <h2 className="page-title">Gestión de Personal Administrativo</h2>
                    <p className="page-subtitle">Paola Hostal - Sucre</p>
                </div>
                {adminLogueado?.rol === 'SuperAdmin' && (
                    <button className="btn-add-reserva" onClick={() => setMostrarModal(true)}>+ Nuevo Trabajador</button>
                )}
            </div>

            {/* MODAL DE REGISTRO CON CLASES RESTAURADAS */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Alta de Trabajador</h3>
                            <button className="btn-close" onClick={() => setMostrarModal(false)}>&times;</button>
                        </div>
                        <form className="modal-form" onSubmit={handleCrearAdmin}>
                            <div className="form-group">
                                <label>Nombre Completo</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={nuevoAdmin.nombre} 
                                    onChange={e => setNuevoAdmin({...nuevoAdmin, nombre: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Usuario (Solo letras, max 10)</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={nuevoAdmin.usuario}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
                                        if (val.length <= 10) setNuevoAdmin({...nuevoAdmin, usuario: val});
                                    }} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Password Provisional (Min 6 carac.)</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={nuevoAdmin.password} 
                                    minLength={6}   /* Mínimo 6 */
                                    maxLength={6}  /* Límite máximo para que no se vea infinito */
                                    onChange={e => setNuevoAdmin({...nuevoAdmin, password: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Rol</label>
                                <select 
                                    value={nuevoAdmin.rol} 
                                    onChange={e => setNuevoAdmin({...nuevoAdmin, rol: e.target.value})}
                                >
                                    <option value="Recepcionista">Recepcionista</option>
                                    <option value="SuperAdmin">SuperAdmin</option>
                                </select>
                            </div>
                            {/* CLASE btn-submit-modal PARA EL DISEÑO DORADO */}
                            <button type="submit" className="btn-submit-modal">Registrar Trabajador</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="table-container shadow-sm">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Usuario</th>
                            <th>Contraseña</th>
                            <th>Rol</th>
                            <th>Último Acceso</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {personal.map(u => (
                            <tr key={u.id_admin}>
                                <td className="font-bold">
                                    {usuarioEditando?.id_admin === u.id_admin ? 
                                        <input type="text" value={usuarioEditando.nombre} onChange={e => setUsuarioEditando({...usuarioEditando, nombre: e.target.value})} />
                                        : u.nombre}
                                </td>
                                <td>
                                    {usuarioEditando?.id_admin === u.id_admin ? 
                                        <input 
                                            type="text" 
                                            value={usuarioEditando.usuario} 
                                            onChange={e => {
                                                const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
                                                if (val.length <= 10) setUsuarioEditando({...usuarioEditando, usuario: val});
                                            }} 
                                        />
                                        : u.usuario}
                                </td>
                                <td>
                                    {usuarioEditando?.id_admin === u.id_admin ? 
                                        <input type="text" placeholder="Min 6 carac..." maxLength={6} onChange={e => setUsuarioEditando({...usuarioEditando, password: e.target.value})} />
                                        : (
                                            <div className="password-display-wrapper">
                                                <span>{mostrarPasswordId === u.id_admin ? u.password_hash : '••••••••'}</span>
                                                <button 
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                    onClick={() => setMostrarPasswordId(mostrarPasswordId === u.id_admin ? null : u.id_admin)}
                                                >
                                                    {mostrarPasswordId === u.id_admin ? <EyeOff size={16} color="#64748b" /> : <Eye size={16} color="#64748b" />}
                                                </button>
                                            </div>
                                        )
                                    }
                                </td>
                                <td>
                                    {usuarioEditando?.id_admin === u.id_admin ? 
                                        <select value={usuarioEditando.rol} onChange={e => setUsuarioEditando({...usuarioEditando, rol: e.target.value})}>
                                            <option value="Recepcionista">Recepcionista</option>
                                            <option value="SuperAdmin">SuperAdmin</option>
                                        </select>
                                        : <span className={`status-badge ${u.rol.toLowerCase()}`}>{u.rol}</span>}
                                </td>
                                <td>{u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-BO') : "Sin actividad"}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {usuarioEditando?.id_admin === u.id_admin ? (
                                            <>
                                                <button onClick={() => handleGuardarEdicion(u.id_admin)} className="btn-save-inline"><Save size={18} color="green" /></button>
                                                <button onClick={() => setUsuarioEditando(null)} className="btn-cancel-inline"><X size={18} color="red" /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="btn-edit-inline" onClick={() => setUsuarioEditando({...u, password: ''})}><Edit3 size={18} color="#C5A059" /></button>
                                                <button className={`btn-delete-inline ${adminLogueado?.rol !== 'SuperAdmin' ? 'disabled' : ''}`} onClick={() => eliminarAdmin(u.id_admin, u.nombre)} disabled={adminLogueado?.rol !== 'SuperAdmin'}>Eliminar</button>
                                            </>
                                        )}
                                    </div>
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