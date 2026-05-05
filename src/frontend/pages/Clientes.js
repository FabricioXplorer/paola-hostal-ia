import React, { useState, useEffect } from 'react';
import './Clientes.css';

const Clientes = () => {
    const [huespedes, setHuespedes] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);

    // Estados para el Modal de Edición
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [mostrarModalEditar, setMostrarModalEditar] = useState(false);

    // Estado para el formulario de edición (Incluye todos los campos)
    const [editDatos, setEditDatos] = useState({ 
        nombre: "", 
        documento: "", 
        contacto: "", 
        email: "" 
    });

    const obtenerClientes = async () => {
        try {
            const respuesta = await fetch('http://localhost:5000/api/clientes');
            const datos = await respuesta.json();
            setHuespedes(datos);
            setCargando(false);
        } catch (error) {
            console.error("Error al conectar con la base de datos:", error);
            setCargando(false);
        }
    };

    useEffect(() => {
        obtenerClientes();
    }, []);

    const manejarClickEditar = (cliente) => {
        setClienteSeleccionado(cliente);
        setEditDatos({
            nombre: cliente.nombre,
            documento: cliente.documento,
            contacto: cliente.contacto,
            email: cliente.email
        });
        setMostrarModalEditar(true);
    };

    // FUNCIÓN GUARDAR: Envía los cambios al servidor
    const guardarCambios = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/clientes/${clienteSeleccionado.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editDatos)
            });

            if (response.ok) {
                alert("Datos del huésped actualizados correctamente.");
                setMostrarModalEditar(false);
                obtenerClientes(); // Refresca la tabla con los datos reales de la BD
            } else {
                alert("Error al actualizar el huésped.");
            }
        } catch (error) {
            console.error("Error al actualizar:", error);
        }
    };

    const clientesFiltrados = huespedes.filter(cliente =>
        cliente.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        cliente.documento?.includes(busqueda)
    );

    if (cargando) return <div className="p-10">Cargando datos de la cartera...</div>;

    return (
        <div className="clientes-container">
            <div className="clientes-header">
                <h1 className="clientes-title">Cartera de Huéspedes</h1>
                <input
                    type="text"
                    placeholder="Buscar por nombre o CI..."
                    className="search-input"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            <div className="table-wrapper">
                <table className="clientes-table">
                    <thead>
                        <tr>
                            <th>NOMBRE DEL CLIENTE</th>
                            <th>DOC. IDENTIDAD</th>
                            <th>CONTACTO</th>
                            <th>CORREO ELECTRÓNICO</th>
                            <th>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientesFiltrados.map((cliente) => (
                            <tr key={cliente.id}>
                                <td className="font-bold">{cliente.nombre}</td>
                                <td>{cliente.documento}</td>
                                <td>{cliente.contacto}</td>
                                <td>{cliente.email}</td>
                                <td className="actions-cell">
                                    <button 
                                        className="btn-action view" 
                                        title="Editar datos del huésped"
                                        onClick={() => manejarClickEditar(cliente)}
                                    >
                                        <i className="fa-solid fa-pen-to-square"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL EDITAR COMPLETO */}
            {mostrarModalEditar && clienteSeleccionado && (
                <div className="modal-overlay">
                    <div className="modal-content glass">
                        <div className="modal-header">
                            <h2>Editar Información del Huésped</h2>
                            <button onClick={() => setMostrarModalEditar(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nombre Completo:</label>
                                <input 
                                    type="text" 
                                    value={editDatos.nombre} 
                                    onChange={(e) => setEditDatos({...editDatos, nombre: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Doc. Identidad (CI/Pasaporte):</label>
                                <input 
                                    type="text" 
                                    value={editDatos.documento} 
                                    onChange={(e) => setEditDatos({...editDatos, documento: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Teléfono / Contacto:</label>
                                <input 
                                    type="text" 
                                    value={editDatos.contacto} 
                                    onChange={(e) => setEditDatos({...editDatos, contacto: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Email:</label>
                                <input 
                                    type="email" 
                                    value={editDatos.email} 
                                    onChange={(e) => setEditDatos({...editDatos, email: e.target.value})} 
                                />
                            </div>
                            <button className="btn-save" onClick={guardarCambios}>Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clientes;