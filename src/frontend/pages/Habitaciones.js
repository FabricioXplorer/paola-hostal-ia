import React, { useEffect, useState } from 'react';
import './AdminPages.css';

const Habitaciones = () => {
    const [habs, setHabs] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/api/habitaciones')
            .then(res => res.json())
            .then(data => setHabs(data));
    }, []);

    return (
        <div className="admin-page">
            <h2 className="page-title">Gestión de Habitaciones - Inventario Real</h2>
            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nro</th>
                            <th>Categoría</th>
                            <th>Precio/Noche</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {habs.map(h => (
                            <tr key={h.id_habitacion}>
                                <td><strong>{h.numero}</strong></td>
                                <td>{h.tipo}</td>
                                <td>{h.precio_noche} Bs.</td>
                                <td>
                                    <span className={`status-badge ${h.estado.toLowerCase().trim()}`}>
                                        {h.estado}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Habitaciones;