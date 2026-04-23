import React, { useEffect, useState } from 'react';
import { TrendingUp, Bed, DollarSign, Printer } from 'lucide-react'; // Añadimos Printer
import './AdminPages.css';

const Reportes = () => {
    // Inicializamos con valores por defecto para evitar que se vea vacío mientras carga
    const [data, setData] = useState({ 
        ingresos: [], 
        resumen: { activas: 0, ingresos_totales: 0, habit_libres: 0 } 
    });

    useEffect(() => {
        fetch('http://localhost:5000/api/reportes-estadisticas')
            .then(res => res.json())
            .then(json => {
                console.log("Datos recibidos en Reportes:", json);
                setData(json);
            })
            .catch(err => console.error("Error al cargar reportes:", err));
    }, []);

    // --- FUNCIÓN PARA DISPARAR LA IMPRESIÓN ---
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="admin-page">
            {/* ENCABEZADO CON BOTÓN DE IMPRESIÓN */}
            <div className="admin-header-flex">
                <h2 className="page-title">Reportes de Gestión – Paola Hostal</h2>
                <button 
                    className="btn-add-reserva" 
                    onClick={handlePrint}
                    style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                    <Printer size={18} />
                    Imprimir Reporte
                </button>
            </div>

            {/* ÁREA IMPRIMIBLE */}
            <div className="printable-content">
                {/* Cabecera extra que solo se activará en el CSS de impresión */}
                <div className="print-only-header" style={{ display: 'none', textAlign: 'center', marginBottom: '20px' }}>
                    <h1>PAOLA HOSTAL</h1>
                    <p>Reporte Estadístico de Gestión - Fecha: {new Date().toLocaleDateString()}</p>
                    <hr />
                </div>
                
                {/* Tarjetas de Resumen Rápido */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                    
                    {/* Tarjeta de Ingresos */}
                    <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #e2b04a', border: '1px solid #eee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontWeight: '600' }}>Ingresos Totales</span>
                            <DollarSign color="#e2b04a" size={24} />
                        </div>
                        <h3 style={{ fontSize: '1.8rem', margin: '10px 0', color: '#1e293b' }}>
                            {Number(data.resumen?.ingresos_totales || 0).toLocaleString()} Bs.
                        </h3>
                    </div>

                    {/* Tarjeta de Reservas */}
                    <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #22c55e', border: '1px solid #eee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontWeight: '600' }}>Reservas Activas</span>
                            <TrendingUp color="#22c55e" size={24} />
                        </div>
                        <h3 style={{ fontSize: '1.8rem', margin: '10px 0', color: '#1e293b' }}>
                            {data.resumen?.activas || 0}
                        </h3>
                    </div>

                    {/* Tarjeta de Disponibilidad */}
                    <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #3b82f6', border: '1px solid #eee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontWeight: '600' }}>Habitaciones Libres</span>
                            <Bed color="#3b82f6" size={24} />
                        </div>
                        <h3 style={{ fontSize: '1.8rem', margin: '10px 0', color: '#1e293b' }}>
                            {data.resumen?.habit_libres || 0}
                        </h3>
                    </div>
                </div>

                {/* Tabla de Ingresos Mensuales */}
                <div className="table-container">
                    <h3 style={{ padding: '20px', margin: 0, color: '#1e293b' }}>Ingresos por Gestión Mensual</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>MES</th>
                                <th>TOTAL RECAUDADO</th>
                                <th>ESTADO DE GESTIÓN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.ingresos && data.ingresos.length > 0 ? (
                                data.ingresos.map((m, index) => (
                                    <tr key={index}>
                                        <td>{m.mes}</td>
                                        <td>{Number(m.total).toLocaleString()} Bs.</td>
                                        <td><span className="status-badge disponible">Completado</span></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                        No hay datos registrados para la gestión actual.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reportes;