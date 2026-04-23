import React, { useEffect, useState } from 'react';
import './AdminPages.css';

const Clientes = () => {
    const [clientes, setClientes] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/api/clientes-lista')
            .then(res => res.json())
            .then(data => setClientes(data));
    }, []);

    return (
        <div className="admin-page">
            <h2 className="page-title">Cartera de Huéspedes</h2>
            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nombre del Cliente</th>
                            <th>Doc. Identidad</th>
                            <th>Contacto</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.map(c => (
                            <tr key={c.id_cliente}>
                                <td>{c.nombre_completo}</td>
                                <td>{c.documento_identidad}</td>
                                <td>{c.telefono}</td>
                                <td>{c.email}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Clientes;