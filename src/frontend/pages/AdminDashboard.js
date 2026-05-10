import React, { useEffect, useState } from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [habitaciones, setHabitaciones] = useState([]);
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);
  const [detallesHuesped, setDetallesHuesped] = useState(null);
  
  // Nuevo estado para el descuento
  const [aplicarDescuento, setAplicarDescuento] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '', documento: '', telefono: '', email: '',
    fechaEntrada: new Date().toISOString().split('T')[0],
    fechaSalida: ''
  });

  // FUNCIÓN PARA FORMATEAR FECHAS DE MANERA LEGIBLE
  const formatearFecha = (fechaRaw) => {
    if (!fechaRaw) return "No definida";
    try {
      const fechaLimpia = fechaRaw.split('T')[0].replace(/-/g, '\/');
      return new Date(fechaLimpia).toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  const obtenerHabitaciones = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/habitaciones');
      const data = await response.json();
      setHabitaciones(data);
    } catch (error) { console.error("Error al obtener habitaciones:", error); }
  };

  useEffect(() => {
    obtenerHabitaciones();
    const interval = setInterval(obtenerHabitaciones, 10000);
    return () => clearInterval(interval);
  }, []);

  // CONSULTAR DETALLES (EL "OJO")
  const verDetalles = async (hab) => {
    try {
      const response = await fetch(`http://localhost:5000/api/detalles-huesped/${hab.id_habitacion}`);
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Error al obtener detalles");
      }
      
      const data = await response.json();
      setDetallesHuesped({ ...data, id_habitacion: hab.id_habitacion, numeroHab: hab.numero });
    } catch (error) { 
      alert("Error: " + error.message); 
    }
  };

  // CÁLCULO DINÁMICO INCLUYENDO DESCUENTO
  const calcularTotal = () => {
    if (!formData.fechaEntrada || !formData.fechaSalida || !habitacionSeleccionada) return 0;
    const inicio = new Date(formData.fechaEntrada);
    const fin = new Date(formData.fechaSalida);
    const diffTime = fin - inicio;
    const noches = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let total = noches > 0 ? noches * habitacionSeleccionada.precio_noche : 0;

    // Si el descuento está marcado, restamos 20 Bs
    if (aplicarDescuento && total >= 20) {
      total -= 20;
    }

    return total;
  };

  const guardarReserva = async (e) => {
    e.preventDefault();
    const total = calcularTotal(); // Obtenemos el total ya procesado
    if (total <= 0) return alert("Fecha de salida inválida.");

    const confirmacion = window.confirm(`Total final: ${total} Bs. ¿Confirmar registro?`);
    if (!confirmacion) return;

    try {
      const response = await fetch('http://localhost:5000/api/registrar-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_completo: formData.nombre,
          documento_identidad: formData.documento,
          telefono: formData.telefono,
          email: formData.email,
          id_habitacion: habitacionSeleccionada.id_habitacion,
          monto_total: total,
          fecha_entrada: formData.fechaEntrada,
          fecha_salida: formData.fechaSalida
        })
      });

      if (response.ok) {
        alert("¡Registro exitoso!");
        setHabitacionSeleccionada(null);
        setAplicarDescuento(false); // Reset del descuento
        setFormData({ ...formData, nombre: '', documento: '', telefono: '', email: '', fechaSalida: '' }); 
        obtenerHabitaciones();
      }
    } catch (error) { alert("Error al conectar con el servidor."); }
  };

  const manejarCheckOut = async (idHabitacion) => {
    if (window.confirm("¿Confirmar salida del huésped? La habitación quedará disponible y la reserva se marcará como finalizada.")) {
      try {
        const response = await fetch(`http://localhost:5000/api/registrar-checkout/${idHabitacion}`, { 
          method: 'PUT' 
        });
        if (response.ok) { 
          alert("Check-out realizado con éxito."); 
          setDetallesHuesped(null); 
          obtenerHabitaciones(); 
        } else {
          alert("No se pudo procesar el Check-out.");
        }
      } catch (error) { console.error("Error en Check-out:", error); }
    }
  };

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">Estado del Hostal en Tiempo Real</h1>
      
      <div className="habitaciones-grid">
        {habitaciones.map((hab) => {
          const claseEstado = hab.estado.toLowerCase().trim();
          return (
            <div key={hab.id_habitacion} className={`card-habitacion card-${claseEstado}`}>
              <span className="estado-superior">{hab.estado}</span>
              
              {claseEstado === 'ocupada' && (
                <button 
                  className="btn-detalles-icono" 
                  onClick={(e) => { e.stopPropagation(); verDetalles(hab); }} 
                  title="Ver detalles"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              )}

              <span className="habitacion-numero">#{hab.numero}</span>
              <span className="habitacion-tipo">{hab.tipo}</span>
              <div className="habitacion-precio-tag">{hab.precio_noche} Bs.</div>

              <div className="acciones-container">
                {claseEstado === 'disponible' && (
                  <button className="btn-check-in" onClick={() => { setHabitacionSeleccionada(hab); setAplicarDescuento(false); }}>Check-in</button>
                )}

                {claseEstado === 'ocupada' && (
                  <button className="btn-check-out" onClick={() => manejarCheckOut(hab.id_habitacion)}>Check-out</button>
                )}

                {claseEstado === 'mantenimiento' && (
                  <div className="aviso-mantenimiento">
                    FUERA DE SERVICIO
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {habitacionSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Nuevo Check-in: Hab #{habitacionSeleccionada.numero}</h2>
              <button className="close-x" onClick={() => setHabitacionSeleccionada(null)}>&times;</button>
            </div>
            <form className="modal-form" onSubmit={guardarReserva}>
              <div className="form-group-full"><label>Nombre Completo</label><input type="text" required onChange={(e)=>setFormData({...formData, nombre: e.target.value})} /></div>
              <div className="form-group"><label>Documento (CI)</label><input type="text" required onChange={(e)=>setFormData({...formData, documento: e.target.value})} /></div>
              <div className="form-group"><label>Teléfono</label><input type="tel" required onChange={(e)=>setFormData({...formData, telefono: e.target.value})} /></div>
              <div className="form-group-full"><label>Email</label><input type="email" placeholder="opcional@correo.com" onChange={(e)=>setFormData({...formData, email: e.target.value})} /></div>
              <div className="form-group"><label>Fecha Entrada</label><input type="date" value={formData.fechaEntrada} onChange={(e)=>setFormData({...formData, fechaEntrada: e.target.value})} required /></div>
              <div className="form-group"><label>Fecha Salida</label><input type="date" required onChange={(e)=>setFormData({...formData, fechaSalida: e.target.value})} /></div>
              
              {/* SECCIÓN DE DESCUENTO */}
              <div className="form-group-full">
                <div className="descuento-control" style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f0fdf4', borderRadius: '8px', border: '1px dashed #22c55e', marginTop: '10px', cursor: 'pointer'}} onClick={() => setAplicarDescuento(!aplicarDescuento)}>
                  <input type="checkbox" checked={aplicarDescuento} onChange={() => {}} style={{width: '18px', height: '18px', cursor: 'pointer'}} />
                  <label style={{margin: 0, color: '#166534', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer'}}>Aplicar descuento de fidelidad (-20 Bs.)</label>
                </div>
              </div>

              <div className="total-container">
                <span>Monto Total:</span>
                <span className={`total-monto ${aplicarDescuento ? 'monto-rebajado' : ''}`} style={{color: aplicarDescuento ? '#166534' : '#1e293b'}}>
                  {calcularTotal()} Bs.
                </span>
              </div>
              
              <div className="modal-footer">
                <button type="submit" className="btn-final-confirm">Confirmar Registro</button>
                <button type="button" className="btn-final-cancel" onClick={() => setHabitacionSeleccionada(null)}>Cerrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detallesHuesped && (
        <div className="modal-overlay" style={{zIndex: 1001}}>
          <div className="modal-content modal-detalles">
            <div className="modal-header">
              <h2>Ocupación Actual - Hab #{detallesHuesped.numeroHab}</h2>
              <button className="close-x" onClick={() => setDetallesHuesped(null)}>&times;</button>
            </div>
            <div className="detalles-body">
              <div className="detalle-item"><label>Nombre del Huésped</label><p>{detallesHuesped.nombre_completo}</p></div>
              <div className="detalle-item"><label>Documento de Identidad</label><p>{detallesHuesped.documento_identidad}</p></div>
              <div className="detalle-item"><label>Teléfono de Contacto</label><p>{detallesHuesped.telefono || "No proporcionado"}</p></div>
              <div className="detalle-grid-fechas">
                <div><label>Fecha de Ingreso</label><p>{formatearFecha(detallesHuesped.fecha_entrada)}</p></div>
                <div><label>Fecha de Salida</label><p>{formatearFecha(detallesHuesped.fecha_salida)}</p></div>
              </div>
              <div className="monto-final-badge"><span>Total de Estancia:</span><strong>{detallesHuesped.monto_total} Bs.</strong></div>
              
              <div className="modal-footer-detalles" style={{marginTop: '20px'}}>
                <button className="btn-final-cancel" style={{width: '100%'}} onClick={() => setDetallesHuesped(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;