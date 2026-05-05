import React, { useEffect, useState } from 'react';
import { TrendingUp, Bed, DollarSign, Printer, Users, Calendar, CheckCircle, BarChart3 } from 'lucide-react';
import './Reportes.css';

const Reportes = () => {
    const [filtro, setFiltro] = useState('mes');
    const [data, setData] = useState({ 
        ingresos: [], 
        resumen: { activas: 0, ingresos_totales: 0, habit_libres: 0, total_clientes: 0 } 
    });

    useEffect(() => {
        fetch(`http://localhost:5000/api/reportes-estadisticas?periodo=${filtro}`)
            .then(res => res.json())
            .then(json => setData(json))
            .catch(err => console.error("Error al cargar reportes:", err));
    }, [filtro]);

    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear();
    const nombreMesActual = fechaActual.toLocaleString('es-ES', { month: 'long' });

    const obtenerTituloDinamico = () => {
        if (filtro === 'semana') return "Reporte: Esta Semana";
        if (filtro === 'mes') return `Reporte Mensual: ${nombreMesActual.toUpperCase()}`;
        return `Reporte de Gestión Anual ${anioActual}`;
    };

    return (
        <div className="admin-page">
            {/* CABECERA DE INTERFAZ */}
            <div className="admin-header-flex no-print">
                <div className="title-section">
                    <h2 className="page-title">{obtenerTituloDinamico()}</h2>
                    <p className="page-subtitle">Paola Hostal - Sucre, Bolivia</p>
                </div>
                
                <div className="action-buttons-group" style={{ display: 'flex', gap: '15px' }}>
                    <div className="filter-container">
                        <Calendar size={18} color="#64748b" style={{ marginRight: '10px' }} />
                        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="select-filtro">
                            <option value="semana">Esta Semana</option>
                            <option value="mes">Este Mes ({nombreMesActual})</option>
                            <option value="año">Gestión Anual {anioActual}</option>
                        </select>
                    </div>

                    <button className="btn-print-action" onClick={() => window.print()}>
                        <Printer size={18} /> Imprimir Reporte
                    </button>
                </div>
            </div>

            <div className="printable-content">
                {/* Encabezado para impresión */}
                <div className="print-only-header">
                    <h1 className="hostal-name">PAOLA HOSTAL</h1>
                    <p className="report-type">{obtenerTituloDinamico().toUpperCase()}</p>
                    <p className="report-date">Fecha de emisión: {new Date().toLocaleString()}</p>
                    <hr className="divider" />
                </div>
                
                {/* TARJETAS */}
                <div className="stats-grid">
                    <div className="stat-card gold-border">
                        <div className="card-header-flex">
                            <span className="card-label">Ingresos Recaudados</span>
                            <DollarSign color="#C5A059" size={20} />
                        </div>
                        <h3 className="card-value">
                            {Number(data.resumen?.ingresos_totales || 0).toLocaleString()} <small>Bs.</small>
                        </h3>
                    </div>

                    <div className="stat-card purple-border">
                        <div className="card-header-flex">
                            <span className="card-label">Huéspedes Hoy</span>
                            <Users color="#8b5cf6" size={20} />
                        </div>
                        <h3 className="card-value">{data.resumen?.total_clientes || 0}</h3>
                    </div>

                    <div className="stat-card green-border">
                        <div className="card-header-flex">
                            <span className="card-label">Reservas Confirmadas</span>
                            <TrendingUp color="#22c55e" size={20} />
                        </div>
                        <h3 className="card-value">{data.resumen?.activas || 0}</h3>
                    </div>

                    <div className="stat-card blue-border">
                        <div className="card-header-flex">
                            <span className="card-label">Habitaciones Libres</span>
                            <Bed color="#3b82f6" size={20} />
                        </div>
                        <h3 className="card-value">{data.resumen?.habit_libres || 0}</h3>
                    </div>
                </div>

                {/* GRÁFICA */}
                <div className="chart-section no-print">
                    <div className="chart-header">
                        <BarChart3 size={20} color="#C5A059" />
                        <h3>Crecimiento de Ingresos</h3>
                    </div>
                    <div className="chart-visual">
                        <div className="bar-container">
                            {data.ingresos?.map((m, i) => {
                                const maxIngreso = Math.max(...data.ingresos.map(item => item.total), 1000);
                                const porcentajeAltura = (m.total / maxIngreso) * 100;
                                return (
                                    <div key={i} className="bar-column">
                                        <div className="bar-fill" style={{ height: `${porcentajeAltura}%` }}>
                                            <span className="bar-value">{m.total} Bs.</span>
                                        </div>
                                        <span className="bar-month">{m.mes.substring(0,3)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* TABLA */}
                <div className="table-container shadow-sm">
                    <div className="table-header-title">
                        <h3>Detalle de Gestión: {filtro === 'año' ? anioActual : nombreMesActual}</h3>
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>PERIODO / MES</th>
                                <th>RECAUDACIÓN TOTAL</th>
                                <th>CLIENTES ATENDIDOS (HISTÓRICO)</th>
                                <th>ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.ingresos?.map((m, index) => (
                                <tr key={index}>
                                    <td className="font-bold">{m.mes}</td>
                                    <td>{Number(m.total).toLocaleString()} Bs.</td>
                                    <td>{m.clientes_mes || 0} Registrados</td>
                                    <td>
                                        <span className="audit-status">
                                            <CheckCircle size={14} /> Auditado
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PIE DE PÁGINA */}
                <div className="print-only-footer">
                    <div className="signature-box">
                        <div className="line"></div>
                        <p>Firma Administrador(a)</p>
                        <p>Paola Hostal - Sucre, Bolivia</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reportes;