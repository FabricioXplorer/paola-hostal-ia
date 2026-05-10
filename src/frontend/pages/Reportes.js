import React, { useEffect, useState } from 'react';
import { TrendingUp, Bed, DollarSign, Printer, Users, Calendar, CheckCircle, BarChart3 } from 'lucide-react';
import './Reportes.css';

const Reportes = () => {
    // Estados para filtros
    const [mesFiltro, setMesFiltro] = useState(new Date().getMonth() + 1); // Mes actual (1-12)
    const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());
    const [vistaAnual, setVistaAnual] = useState(false); // Switch para ver todo el año

    const [data, setData] = useState({ 
        ingresos: [], 
        resumen: { activas: 0, ingresos_totales: 0, habit_libres: 0, total_clientes: 0 } 
    });

    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // Carga de datos basada en los filtros
    useEffect(() => {
        const periodo = vistaAnual ? 'año' : 'mes';
        fetch(`http://localhost:5000/api/reportes-estadisticas?periodo=${periodo}&mes=${mesFiltro}&anio=${anioFiltro}`)
            .then(res => res.json())
            .then(json => setData(json))
            .catch(err => console.error("Error al cargar reportes:", err));
    }, [mesFiltro, anioFiltro, vistaAnual]);

    const obtenerTituloDinamico = () => {
        if (vistaAnual) return `Reporte de Gestión Anual ${anioFiltro}`;
        return `Reporte Mensual: ${meses[mesFiltro - 1].toUpperCase()} ${anioFiltro}`;
    };

    // Función para renderizar el gráfico de líneas (Trend Chart)
    const renderGraficoLineas = () => {
        if (!data.ingresos || data.ingresos.length === 0) {
            return <p style={{width: '100%', textAlign: 'center', color: '#94a3b8', padding: '40px'}}>Sin datos de ingresos para este periodo</p>;
        }

        const altoGrafico = 200;
        const anchoGrafico = 800; 
        const padding = 40;
        
        const maxIngreso = Math.max(...data.ingresos.map(item => item.total), 1);
        
        // Calcular puntos (x, y) para la línea
        const puntos = data.ingresos.map((m, i) => {
            const x = (i * (anchoGrafico / (data.ingresos.length - 1 || 1))) + padding;
            const y = altoGrafico - (m.total / maxIngreso * (altoGrafico - padding));
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="chart-visual-container">
                <svg viewBox={`0 0 ${anchoGrafico + padding * 2} ${altoGrafico + 40}`} className="svg-line-chart">
                    {/* Definición de degradado para el área bajo la línea */}
                    <defs>
                        <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#C5A059" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#C5A059" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Líneas de guía horizontales */}
                    <line x1={padding} y1="0" x2={anchoGrafico + padding} y2="0" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1={padding} y1={altoGrafico} x2={anchoGrafico + padding} y2={altoGrafico} stroke="#e2e8f0" strokeWidth="1" />
                    
                    {/* Área sombreada */}
                    <polyline
                        fill="url(#gradientArea)"
                        points={`${padding},${altoGrafico} ${puntos} ${anchoGrafico + padding},${altoGrafico}`}
                    />

                    {/* Línea de tendencia */}
                    <polyline
                        fill="none"
                        stroke="#C5A059"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={puntos}
                        className="path-line"
                    />

                    {/* Nodos y etiquetas */}
                    {data.ingresos.map((m, i) => {
                        const x = (i * (anchoGrafico / (data.ingresos.length - 1 || 1))) + padding;
                        const y = altoGrafico - (m.total / maxIngreso * (altoGrafico - padding));
                        return (
                            <g key={i} className="chart-node">
                                <circle cx={x} cy={y} r="5" fill="#C5A059" stroke="white" strokeWidth="2" />
                                <text x={x} y={y - 12} textAnchor="middle" className="node-text">{m.total} Bs.</text>
                                <text x={x} y={altoGrafico + 20} textAnchor="middle" className="axis-text">{m.mes.substring(0, 3)}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    };

    return (
        <div className="admin-page">
            <div className="admin-header-flex no-print">
                <div className="title-section">
                    <h2 className="page-title">{obtenerTituloDinamico()}</h2>
                    <p className="page-subtitle">Paola Hostal - Sucre, Bolivia</p>
                </div>
                
                <div className="action-buttons-group">
                    {!vistaAnual && (
                        <div className="filter-container">
                            <Calendar size={18} color="#C5A059" style={{ marginRight: '8px' }} />
                            <select 
                                value={mesFiltro} 
                                onChange={(e) => setMesFiltro(Number(e.target.value))} 
                                className="select-mes-desplegable"
                            >
                                {meses.map((mes, idx) => (
                                    <option key={idx} value={idx + 1}>{mes}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="filter-container">
                        <select 
                            value={anioFiltro} 
                            onChange={(e) => setAnioFiltro(Number(e.target.value))} 
                            className="select-filtro"
                        >
                            <option value={2024}>2024</option>
                            <option value={2025}>2025</option>
                            <option value={2026}>2026</option>
                        </select>
                    </div>

                    <button 
                        className={`btn-toggle-report ${vistaAnual ? 'active' : ''}`}
                        onClick={() => setVistaAnual(!vistaAnual)}
                    >
                        <BarChart3 size={18} /> 
                        <span>{vistaAnual ? "Ver Mes" : "Ver Año"}</span>
                    </button>

                    <button className="btn-print-action" onClick={() => window.print()}>
                        <Printer size={18} /> Imprimir
                    </button>
                </div>
            </div>

            <div className="printable-content">
                <div className="stats-grid">
                    <div className="stat-card gold-border">
                        <div className="card-header-flex">
                            <span className="card-label">Recaudación {vistaAnual ? 'Anual' : 'Mensual'}</span>
                            <DollarSign color="#C5A059" size={20} />
                        </div>
                        <h3 className="card-value">
                            {Number(data.resumen?.ingresos_totales || 0).toLocaleString()} <small>Bs.</small>
                        </h3>
                    </div>

                    <div className="stat-card purple-border">
                        <div className="card-header-flex">
                            <span className="card-label">Huéspedes Registrados</span>
                            <Users color="#8b5cf6" size={20} />
                        </div>
                        <h3 className="card-value">{data.resumen?.total_clientes || 0}</h3>
                    </div>

                    <div className="stat-card green-border">
                        <div className="card-header-flex">
                            <span className="card-label">Ocupación Actual</span>
                            <TrendingUp color="#22c55e" size={20} />
                        </div>
                        <h3 className="card-value">{data.resumen?.activas || 0}</h3>
                    </div>

                    <div className="stat-card blue-border">
                        <div className="card-header-flex">
                            <span className="card-label">Disponibilidad Actual</span>
                            <Bed color="#3b82f6" size={20} />
                        </div>
                        <h3 className="card-value">{data.resumen?.habit_libres || 0}</h3>
                    </div>
                </div>

                {/* GRÁFICA DE TENDENCIA (LÍNEAS) */}
                <div className="chart-section no-print">
                    <div className="chart-header">
                        <TrendingUp size={20} color="#C5A059" />
                        <h3>Crecimiento y Tendencia de Ingresos</h3>
                    </div>
                    {renderGraficoLineas()}
                </div>

                <div className="table-container shadow-sm">
                    <div className="table-header-title">
                        <h3>Desglose de Periodos: {vistaAnual ? `Meses de ${anioFiltro}` : `${meses[mesFiltro-1]} ${anioFiltro}`}</h3>
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>PERIODO / FECHA</th>
                                <th>RECAUDACIÓN TOTAL</th>
                                <th>CLIENTES ATENDIDOS</th>
                                <th>ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.ingresos?.length > 0 ? data.ingresos.map((m, index) => (
                                <tr key={index}>
                                    <td className="font-bold">{m.mes}</td>
                                    <td>{Number(m.total).toLocaleString()} Bs.</td>
                                    <td>{m.clientes_mes || 0} registros</td>
                                    <td>
                                        <span className="audit-status">
                                            <CheckCircle size={14} /> Auditado
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>No hay datos para este periodo.</td>
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