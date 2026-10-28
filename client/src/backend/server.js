const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const chrono = require('chrono-node'); 
const classifier = require('./classifier'); 
const app = express();
const bcrypt = require('bcrypt');
const multer = require('multer'); // 👈 INTEGRADO: Librería para manejar archivos binarios (comprobantes QR)
const path = require('path');     // 👈 INTEGRADO: Manejo seguro de rutas de archivos
const saltRounds = 10; // Nivel de seguridad (10 es lo ideal)

app.use(cors());
app.use(express.json());

// ==========================================
// 1. CONFIGURACIÓN Y CONEXIÓN A BD
// ==========================================
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'paola_hostal_db'
});

db.connect(err => {
    if (err) {
        console.error('Error de conexión a la BD:', err);
        return;
    }
    console.log('CONECTADO: PAO ha accedido a la base de datos de Paola Hostal.');
});


// ruta absoluta a la carpeta uploads en la raíz
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads'); 

// (Opcional pero recomendado) Crea la carpeta si no existe al arrancar
if (!require('fs').existsSync(UPLOADS_DIR)){
    require('fs').mkdirSync(UPLOADS_DIR);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR); // Usamos la ruta absoluta
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Servir archivos estáticos apuntando a la ruta absoluta
app.use('/uploads', express.static(UPLOADS_DIR));

const sesiones = {};

// =========================================================================
// FUNCIÓN NATIVA DE WHATSAPP - PARCHE DEFINITIVO DE ALTA ESTABILIDAD
// =========================================================================
const enviarNotificacionWhatsApp = async (telefonoFormateado, mensajeTexto, intentos = 3) => {
    try {
        let numeroPuro = telefonoFormateado.toString().replace(/\D/g, '');
        if (numeroPuro.length === 8) numeroPuro = '591' + numeroPuro;
        else if (numeroPuro.startsWith('5913') && numeroPuro.length === 12) numeroPuro = '591' + numeroPuro.substring(4);
        
        const chatIdReal = `${numeroPuro}@c.us`;
        
        console.log(`[WhatsApp Bot] Intentando envío directo mediante cliente a: ${chatIdReal}`);

        // 🚀 SOLUCIÓN: Usamos client.sendMessage directamente, que es el método estable.
        // No necesitamos invocar sendMessage sobre el contacto, sino sobre el cliente.
        await client.sendMessage(chatIdReal, mensajeTexto);
        
        console.log(`[WhatsApp Bot] ¡Mensaje enviado con éxito!`);

    } catch (error) {
        console.error(`❌ Error en intento ${intentos}:`, error.message);

        // Si falla por problemas de conexión o frame, reintentamos
        const esErrorDeRecarga = /detached|context|destroyed|target closed/i.test(error.message);
        
        if (intentos > 1 && esErrorDeRecarga) {
            console.log(`[WhatsApp Bot] Error detectado. Reintentando en 3 segundos...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return enviarNotificacionWhatsApp(telefonoFormateado, mensajeTexto, intentos - 1);
        } else {
            console.error("❌ Fallo crítico tras agotar reintentos.");
        }
    }
};

// ==========================================
// 2. MÓDULO: CHAT IA (PAO)
// ==========================================
app.post('/api/chat', (req, res) => {
    const { mensaje, usuarioId } = req.body;
    const msgLower = mensaje.toLowerCase();
    
    if (!sesiones[usuarioId]) {
        sesiones[usuarioId] = { paso: 'inicio', datos: {} };
    }

    const tiposHab = ['simple', 'sencilla', 'sencillo', 'doble', 'matrimonial', 'triple', 'suite', 'familiar', 'cuadruple'];
    let tipoDetectadoAhora = null;

    tiposHab.forEach(tipo => {
        if (msgLower.includes(tipo)) {
            if (['simple', 'sencilla', 'sencillo'].includes(tipo)) {
                tipoDetectadoAhora = 'Simple'; 
            } else {
                tipoDetectadoAhora = tipo.charAt(0).toUpperCase() + tipo.slice(1);
            }
        }
    });

    if (tipoDetectadoAhora) {
        sesiones[usuarioId].datos.tipo = tipoDetectadoAhora;
    }

    const entidades = {
        fecha: chrono.es.parseDate(mensaje, new Date(), { forwardDate: true }),
        personas: msgLower.match(/\d+/) ? msgLower.match(/\d+/)[0] : null,
        tipo_habitacion: sesiones[usuarioId].datos.tipo 
    };

    const intencion = classifier.classify(msgLower);
    let respuestaPao = "";

    // --- LÓGICA DE CANCELACIÓN VÍA CHAT ---
    if (intencion === 'cancelar_reserva') {
        respuestaPao = "Entiendo. Por seguridad, por favor indícame tu CI o Pasaporte para localizar la reserva:";
        sesiones[usuarioId].paso = 'esperando_ci_cancelar';
        return finalizarInteraccion(mensaje, intencion, respuestaPao, entidades, res);
    }

    if (sesiones[usuarioId].paso === 'esperando_ci_cancelar') {
        const ci = mensaje;
        const sqlBuscar = `
            SELECT r.id_reserva, r.id_habitacion, h.numero 
            FROM reservas r 
            JOIN clientes c ON r.id_cliente = c.id_cliente 
            JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
            WHERE c.documento_identidad = ? AND r.estado_reserva = 'Confirmada'
            ORDER BY r.id_reserva DESC LIMIT 1`;

        db.query(sqlBuscar, [ci], (err, results) => {
            if (err || results.length === 0) {
                respuestaPao = `No logré encontrar ninguna reserva activa vinculada al documento ${ci}.`;
                sesiones[usuarioId].paso = 'inicio';
                return finalizarInteraccion(mensaje, 'cancelacion_fallida', respuestaPao, entidades, res);
            }
            const { id_reserva, id_habitacion, numero } = results[0];
            db.query('UPDATE reservas SET estado_reserva = "Cancelada" WHERE id_reserva = ?', [id_reserva], () => {
                db.query('UPDATE habitaciones SET estado = "Disponible" WHERE id_habitacion = ?', [id_habitacion], () => {
                    respuestaPao = `Perfecto. La reserva ha sido anulada con éxito. La habitación ${numero} ahora figura nuevamente como Disponible.`;
                    sesiones[usuarioId].paso = 'inicio';
                    finalizarInteraccion(mensaje, 'cancelacion_exitosa', respuestaPao, entidades, res);
                });
            });
        });
        return; 
    }

    // --- VALIDACIONES DE DATOS (NUEVO) ---
    if (sesiones[usuarioId].paso === 'esperando_nombre') {
        const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        if (!soloLetras.test(mensaje)) {
            respuestaPao = "Por favor, ingresa solo letras para tu nombre.";
        } else {
            sesiones[usuarioId].datos.nombre_completo = mensaje;
            sesiones[usuarioId].paso = 'esperando_documento';
            respuestaPao = `Mucho gusto, ${mensaje}. Ahora, indícame tu número de CI o Pasaporte (máximo 10 caracteres):`;
        }
        return finalizarInteraccion(mensaje, 'proporciona_nombre', respuestaPao, entidades, res);
    }

    if (sesiones[usuarioId].paso === 'esperando_documento') {
        if (mensaje.length > 10 || mensaje.length < 5) {
            respuestaPao = "El documento debe tener entre 5 y 10 caracteres. Intenta de nuevo:";
        } else {
            sesiones[usuarioId].datos.documento = mensaje;
            sesiones[usuarioId].paso = 'esperando_telefono';
            respuestaPao = "Gracias. ¿A qué número de teléfono podemos contactarte? (8 dígitos):";
        }
        return finalizarInteraccion(mensaje, 'proporciona_documento', respuestaPao, entidades, res);
    }

    if (sesiones[usuarioId].paso === 'esperando_telefono') {
        const soloNumeros = /^\d{8}$/;
        if (!soloNumeros.test(mensaje)) {
            respuestaPao = "El teléfono debe tener exactamente 8 dígitos numéricos. Intenta de nuevo:";
        } else {
            sesiones[usuarioId].datos.telefono = mensaje;
            sesiones[usuarioId].paso = 'esperando_email';
            respuestaPao = "Ya casi terminamos. Por último, ¿cuál es tu correo electrónico?";
        }
        return finalizarInteraccion(mensaje, 'proporciona_telefono', respuestaPao, entidades, res);
    }

    // --- FLUJO DE RESERVA ---
    if (sesiones[usuarioId].paso === 'esperando_fecha_salida' && entidades.fecha) {
        sesiones[usuarioId].datos.fecha_salida_obj = entidades.fecha;
        sesiones[usuarioId].paso = 'esperando_tipo';

        const sqlDisponibles = 'SELECT DISTINCT tipo, precio_noche FROM habitaciones WHERE estado = "Disponible"';
        
        db.query(sqlDisponibles, (err, results) => {
            if (err || results.length === 0) {
                respuestaPao = "¡Excelente elección! Sin embargo, actualmente no tengo habitaciones disponibles para esas fechas. 😔";
                sesiones[usuarioId].paso = 'inicio'; 
            } else {
                let lista = results.map(h => `• ${h.tipo}: ${h.precio_noche} Bs`).join('\n');
                respuestaPao = `¡Perfecto! He revisado mi sistema y estas son las opciones disponibles para tus fechas:\n\n${lista}\n\n¿Cuál prefieres?`;
            }
            return finalizarInteraccion(mensaje, 'proporciona_fecha_salida', respuestaPao, entidades, res);
        });
        return; 
    }

    if (sesiones[usuarioId].paso === 'esperando_tipo') {
        const listarDisponiblesYResponder = (mensajeExtra) => {
            const sqlListar = 'SELECT DISTINCT tipo, precio_noche FROM habitaciones WHERE estado = "Disponible"';
            db.query(sqlListar, (err, results) => {
                let lista = "Lo siento, parece que no hay habitaciones disponibles en este momento.";
                if (results && results.length > 0) {
                    lista = results.map(h => `• ${h.tipo}: ${h.precio_noche} Bs`).join('\n');
                }
                const respuestaFinal = `${mensajeExtra}\n\n${lista}\n\n¿Cuál prefieres?`;
                return finalizarInteraccion(mensaje, 'reiterar_disponibilidad', respuestaFinal, entidades, res);
            });
        };

        if (tipoDetectadoAhora) {
            const sqlCheck = 'SELECT id_habitacion FROM habitaciones WHERE TRIM(LOWER(tipo)) = LOWER(?) AND estado = "Disponible" LIMIT 1';
            db.query(sqlCheck, [tipoDetectadoAhora], (err, results) => {
                if (err) return res.json({ texto: "Error técnico al consultar disponibilidad." });

                if (results && results.length > 0) {
                    sesiones[usuarioId].paso = 'esperando_nombre';
                    respuestaPao = `¡Excelente! He confirmado la disponibilidad de la habitación ${tipoDetectadoAhora}. Para registrarte, ¿cuál es tu nombre completo?`;
                    return finalizarInteraccion(mensaje, 'proporciona_tipo', respuestaPao, entidades, res);
                } else {
                    listarDisponiblesYResponder(`Lo siento, la habitación tipo "${tipoDetectadoAhora}" ya no está disponible. 😔`);
                }
            });
            return;
        } 
        else if (msgLower === "si" || msgLower === "sí") {
            listarDisponiblesYResponder("¡Genial! Estas son las opciones que tengo listas para ti en Paola Hostal:");
            return;
        }
    }
    if (sesiones[usuarioId].paso === 'esperando_nombre') {
        sesiones[usuarioId].datos.nombre_completo = mensaje; 
        sesiones[usuarioId].paso = 'esperando_documento';
        respuestaPao = `Mucho gusto, ${mensaje}. Ahora, indícame tu número de CI o Pasaporte:`;
        return finalizarInteraccion(mensaje, 'proporciona_nombre', respuestaPao, entidades, res);
    }

    if (sesiones[usuarioId].paso === 'esperando_documento') {
        sesiones[usuarioId].datos.documento = mensaje;
        sesiones[usuarioId].paso = 'esperando_telefono';
        respuestaPao = "Gracias. ¿A qué número de teléfono podemos contactarte?";
        return finalizarInteraccion(mensaje, 'proporciona_documento', respuestaPao, entidades, res);
    }

   // 3. VALIDACIÓN TELÉFONO (8 dígitos exactos)
    if (sesiones[usuarioId].paso === 'esperando_telefono') {
        if (!/^\d{8}$/.test(mensaje)) {
            respuestaPao = "El teléfono debe tener exactamente 8 dígitos numéricos. Intenta de nuevo:";
        } else {
            sesiones[usuarioId].datos.telefono = mensaje;
            sesiones[usuarioId].paso = 'esperando_email';
            respuestaPao = "Ya casi terminamos. Por último, ¿cuál es tu correo electrónico? (Recuerda usar @gmail.com):";
        }
        return finalizarInteraccion(mensaje, 'proporciona_telefono', respuestaPao, entidades, res);
    }

    // 4. VALIDACIÓN EMAIL (Obligatorio terminar en @gmail.com)
   // 4. VALIDACIÓN EMAIL Y GUARDADO FINAL
    if (sesiones[usuarioId].paso === 'esperando_email') {
        const esGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        
        if (!esGmail.test(mensaje.toLowerCase())) {
            respuestaPao = "Por favor, ingresa una dirección de correo válida terminada en @gmail.com. Intenta de nuevo:";
            return finalizarInteraccion(mensaje, 'proporciona_email', respuestaPao, entidades, res);
        }

        // Si llegó aquí, el correo es correcto, guardamos y ejecutamos el INSERT
        sesiones[usuarioId].datos.email = mensaje;
        const d = sesiones[usuarioId].datos;

        db.query('INSERT INTO clientes (nombre_completo, documento_identidad, telefono, email) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre_completo=VALUES(nombre_completo), telefono=VALUES(telefono), email=VALUES(email), id_cliente=LAST_INSERT_ID(id_cliente)', [d.nombre_completo, d.documento, d.telefono, d.email], (err, resCli) => {
            const idCliente = resCli.insertId;
            
            db.query('SELECT id_habitacion, numero, precio_noche FROM habitaciones WHERE TRIM(LOWER(tipo)) = LOWER(?) AND estado = "Disponible" LIMIT 1', [d.tipo], (err, resHab) => {
                if (resHab && resHab.length > 0) {
                    const { id_habitacion, numero, precio_noche } = resHab[0];
                    const fIngreso = new Date(d.fecha_ingreso_obj);
                    const fSalida = new Date(d.fecha_salida_obj);
                    const noches = Math.max(1, Math.floor((fSalida - fIngreso) / (1000 * 60 * 60 * 24)));
                    const totalReserva = noches * precio_noche;

                    db.query('INSERT INTO reservas (id_cliente, id_habitacion, fecha_ingreso, fecha_salida, monto_total, estado_reserva) VALUES (?, ?, ?, ?, ?, "Pendiente")', [idCliente, id_habitacion, d.fecha_ingreso_obj, d.fecha_salida_obj, totalReserva], (errRes, resReserva) => {
                        respuestaPao = `¡Excelente elección ${d.nombre_completo}! He generado tu orden para la Habitación ${numero}.\nTotal: ${totalReserva} Bs.\n\nPara consolidar tu reserva, escanea el QR y adjunta el comprobante aquí abajo:`;
                        
                        // Limpiamos la sesión del usuario para que no se quede bloqueado
                        delete sesiones[usuarioId]; 

                        if (!res.headersSent) {
                            res.json({ 
                                texto: respuestaPao,
                                showQR: true, 
                                montoTotal: totalReserva,
                                idReserva: resReserva.insertId,
                                nombreCliente: d.nombre_completo,
                                habitacion: numero
                            });
                        }
                    });
                } else {
                    res.json({ texto: "Lo siento, hubo un error al procesar la habitación. Por favor, intenta de nuevo." });
                }
            });
        });
        return; // Salimos para no ejecutar el finalizarInteraccion de abajo
    }

    if (sesiones[usuarioId].paso === 'esperando_email') {
        sesiones[usuarioId].datos.email = mensaje;
        const d = sesiones[usuarioId].datos;

        const sqlCli = 'INSERT INTO clientes (nombre_completo, documento_identidad, telefono, email) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre_completo=VALUES(nombre_completo), telefono=VALUES(telefono), email=VALUES(email), id_cliente=LAST_INSERT_ID(id_cliente)';
        
        db.query(sqlCli, [d.nombre_completo, d.documento, d.telefono, d.email], (err, resCli) => {
            if (err) return res.json({ texto: "Error al registrar tus datos." });
            const idCliente = resCli.insertId;
            
            db.query('SELECT id_habitacion, numero, precio_noche FROM habitaciones WHERE TRIM(LOWER(tipo)) = LOWER(?) AND estado = "Disponible" LIMIT 1', [d.tipo], (err, resHab) => {
                if (resHab && resHab.length > 0) {
                    const { id_habitacion, numero, precio_noche } = resHab[0];

                    const fIngreso = new Date(d.fecha_ingreso_obj);
                    const fSalida = new Date(d.fecha_salida_obj);
                    fIngreso.setHours(0,0,0,0); fSalida.setHours(0,0,0,0);
                    const diffTime = fSalida.getTime() - fIngreso.getTime();
                    let noches = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    if (noches <= 0) noches = 1; 
                    const totalReserva = noches * precio_noche;

                    // La reserva se inicializa como 'Pendiente' esperando que el cliente suba el archivo del QR
                    const sqlRes = 'INSERT INTO reservas (id_cliente, id_habitacion, fecha_ingreso, fecha_salida, monto_total, estado_reserva) VALUES (?, ?, ?, ?, ?, "Pendiente")';
                    db.query(sqlRes, [idCliente, id_habitacion, d.fecha_ingreso_obj, d.fecha_salida_obj, totalReserva], (errRes, resReserva) => {
                        if (errRes) return res.json({ texto: "Error al generar pre-reserva." });
                        
                        const idNuevaReserva = resReserva.insertId;

                        respuestaPao = `¡Excelente elección ${d.nombre_completo}! He generado tu orden para la Habitación ${numero}.\nEstadía: ${noches} noche(s).\nTotal: ${totalReserva} Bs.\n\nPara consolidar tu reserva de forma segura, por favor realiza la transferencia escaneando nuestro QR oficial y adjunta el comprobante aquí abajo para procesar la orden:`;
                        
                        delete sesiones[usuarioId]; 

                        db.query('INSERT INTO memoria_ia (frase_usuario, intencion_detectada, entidades_json, respuesta_pao) VALUES (?, ?, ?, ?)', 
                        [mensaje, 'reserva_pendiente_pago', JSON.stringify(entidades), respuestaPao], () => { 
                            if (!res.headersSent) {
                                res.json({ 
                                    texto: respuestaPao,
                                    showQR: true, 
                                    montoTotal: totalReserva,
                                    idReserva: idNuevaReserva,
                                    nombreCliente: d.nombre_completo,
                                    habitacion: numero
                                }); 
                            }
                        });
                    });
                } else {
                    sesiones[usuarioId].paso = 'esperando_tipo'; 
                    return res.json({ texto: `Lo siento, no hay disponibilidad para "${d.tipo}". todo lleno` });
                }
            });
        });
        return;
    }

    if (entidades.fecha && sesiones[usuarioId].paso === 'inicio') {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); 
        if (entidades.fecha < hoy) {
            respuestaPao = "Lo siento, esa fecha ya pasó.";
            return finalizarInteraccion(mensaje, 'error_fecha_pasada', respuestaPao, entidades, res);
        }
        sesiones[usuarioId].datos.fecha_ingreso_obj = entidades.fecha; 
        sesiones[usuarioId].paso = 'esperando_fecha_salida';
        respuestaPao = `¡He anotado tu ingreso para el ${entidades.fecha.toLocaleDateString()}! ¿Hasta qué día te quedarás?`;
        return finalizarInteraccion(mensaje, 'proporciona_fecha_ingreso', respuestaPao, entidades, res); 
    }

    if (respuestaPao === "") {
        if (intencion === 'saludo') respuestaPao = "¡Hola! Soy PAO. ¿En qué fecha quieres hospedarte?";
        else if (intencion === 'agradecimiento') {
            respuestaPao = "¡De nada! Es un placer ayudarte. ¡Te esperamos en Paola Hostal!";
        } 
        else {
            respuestaPao = "Lo siento, no logré entenderte del todo. ¿Podrías indicarme una fecha para tu reserva?";
        }
    }
    finalizarInteraccion(mensaje, intencion, respuestaPao, entidades, res);
});

// ==========================================
// 🚀 ENDPOINT ACTUALIZADO: CONGELADO EN ESTADO "EN ESPERA" (TU PROPUESTA)
// ==========================================
app.post('/api/pagos-qr', upload.single('comprobante'), (req, res) => {
    const { id_reserva, monto_pagado } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ success: false, error: "No se recibió el archivo del comprobante." });
    }

    const comprobanteUrl = `http://localhost:5000/uploads/${file.filename}`;

    // 1. Localizamos la habitación asociada a la transacción para congelarla
    db.query('SELECT id_habitacion FROM reservas WHERE id_reserva = ?', [id_reserva], (err, rows) => {
        if (err || rows.length === 0) {
            return res.status(404).json({ success: false, error: "No se encontró la reserva asociada." });
        }

        const idHabitacionReal = rows[0].id_habitacion;

        // 2. Transición visual: La habitación pasa a 'En Espera' (Amarillo/Naranja en el Dashboard)
        db.query('UPDATE habitaciones SET estado = "En Espera" WHERE id_habitacion = ?', [idHabitacionReal], () => {
            
            // 3. Insertamos el comprobante físico para que el administrador lo audite visualmente
            const sqlInsertPago = `
                INSERT INTO pagos_qr (id_reserva, monto_pagado, comprobante_url, estado_validacion, codigo_transaccion) 
                VALUES (?, ?, ?, 'pendiente', ?)`;
            
            const codigoSimulado = 'TRX-PEND-' + Date.now().toString().slice(-4);

            db.query(sqlInsertPago, [id_reserva, monto_pagado, comprobanteUrl, codigoSimulado], (errInsert) => {
                if (errInsert) console.error("Error en pagos_qr:", errInsert);
                
                // Retornamos éxito inmediato. React pintará la respuesta asíncrona propuesta
                res.json({
                    success: true,
                    message: "Comprobante guardado. Habitación congelada en estado En Espera."
                });
            });
        });
    });
});


app.get('/api/pagos-qr', (req, res) => {
    const sql = `SELECT p.*, r.nombre_cliente, h.numero_habitacion 
                 FROM pagos_qr p
                 JOIN reservas r ON p.id_reserva = r.id_reserva
                 JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
                 WHERE p.estado_validacion = 'pendiente'`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// =========================================================================
// 🛡️ MICROSERVICIOS PARA EL CARD DEL DASHBOARD (APROBAR / CANCELAR + WHATSAPP)
// =========================================================================

// Opción A: Confirmar Habitación (De Naranja a Rojo - Envía WhatsApp de Éxito REAL)
app.put('/api/dashboard/aprobar-reserva/:idReserva', (req, res) => {
    const { idReserva } = req.params;

    // 🚀 MEJORA DE SEGURIDAD: LEFT JOIN y COALESCE para evitar registros vacíos o nulos si falló la relación del cliente
    const sqlQuery = `
        SELECT 
            r.id_habitacion, 
            h.numero, 
            COALESCE(c.nombre_completo, 'Huésped') as nombre_completo, 
            COALESCE(c.telefono, '') as telefono, 
            r.monto_total 
        FROM reservas r
        LEFT JOIN clientes c ON r.id_cliente = c.id_cliente
        LEFT JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
        WHERE r.id_reserva = ?`;

    db.query(sqlQuery, [idReserva], (err, rows) => {
        if (err) {
            console.error("Error SQL al buscar reserva:", err);
            return res.status(500).json({ success: false, error: "Error interno del servidor." });
        }

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, error: "Reserva no encontrada." });
        }

        const { id_habitacion, numero, nombre_completo, telefono, monto_total } = rows[0];

        // 🛡️ CONTROL ANTI-CRÍTICO: Si el teléfono está vacío o es nulo en la BD, procesamos el estado pero no tumbamos Node
        if (!telefono || telefono.toString().trim() === '') {
            console.log(`[Dashboard] Alerta: La reserva #${idReserva} no tiene un teléfono asociado. Saltando WhatsApp.`);
            db.query('UPDATE reservas SET estado_reserva = "Confirmada" WHERE id_reserva = ?', [idReserva], () => {
                db.query('UPDATE habitaciones SET estado = "Ocupada" WHERE id_habitacion = ?', [id_habitacion], () => {
                    return res.json({ success: true, message: "Habitación ocupada, pero no se envió WhatsApp por falta de número." });
                });
            });
            return;
        }

        // --- FLUJO NORMAL CON TELÉFONO VALIDADOS ---
        db.query('UPDATE reservas SET estado_reserva = "Check-in" WHERE id_reserva = ?', [idReserva], () => {
    db.query('UPDATE habitaciones SET estado = "Ocupada" WHERE id_habitacion = ?', [id_habitacion], () => {
        db.query('UPDATE pagos_qr SET estado_validacion = "verificado" WHERE id_reserva = ?', [idReserva], () => {

                    // Limpieza absoluta y formateo estándar para Bolivia (591 + número de 8 dígitos)
                    let telefonoFormateado = telefono.toString().replace(/\D/g, '');
                    
                    // Si se coló el '3' antiguo de portabilidad, se limpia para no romper el LID de WhatsApp
                    if (telefonoFormateado.startsWith('5913') && telefonoFormateado.length === 12) {
                        telefonoFormateado = '591' + telefonoFormateado.substring(4);
                    } else if (!telefonoFormateado.startsWith('591')) {
                        telefonoFormateado = `591${telefonoFormateado}`;
                    }

                    const txtWhatsapp = `¡Hola *${nombre_completo}*! 🎉 Tu pago de *${monto_total} Bs.* ha sido verificado con éxito por la administración de Paola Hostal. Tu *Habitación ${numero}* se encuentra completamente confirmada. ¡Te esperamos!`;
                    
                    // Despachamos a la función asíncrona reparada
                    enviarNotificacionWhatsApp(telefonoFormateado, txtWhatsapp);

                    res.json({ success: true, message: "Reserva aprobada y cliente notificado por WhatsApp." });
                });
            });
        });
    });
});

// Opción B: Cancelar / Rechazar Pago Falso (De Naranja a Verde - Envía WhatsApp de Alerta)
app.put('/api/dashboard/rechazar-reserva/:idReserva', (req, res) => {
    const { idReserva } = req.params;

    // 🚀 Mismo blindaje estructural para el rechazo de comprobantes
    const sqlQuery = `
        SELECT 
            r.id_habitacion, 
            h.numero, 
            COALESCE(c.nombre_completo, 'Huésped') as nombre_completo, 
            COALESCE(c.telefono, '') as telefono 
        FROM reservas r
        LEFT JOIN clientes c ON r.id_cliente = c.id_cliente
        LEFT JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
        WHERE r.id_reserva = ?`;

    db.query(sqlQuery, [idReserva], (err, rows) => {
        if (err) {
            console.error("Error SQL al rechazar reserva:", err);
            return res.status(500).json({ success: false, error: "Error interno del servidor." });
        }

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, error: "Reserva no encontrada." });
        }

        const { id_habitacion, numero, nombre_completo, telefono } = rows[0];

        if (!telefono || telefono.toString().trim() === '') {
            console.log(`[Dashboard] Alerta: La reserva #${idReserva} no tiene teléfono para enviar alerta de rechazo.`);
            db.query('UPDATE reservas SET estado_reserva = "Cancelada" WHERE id_reserva = ?', [idReserva], () => {
                db.query('UPDATE habitaciones SET estado = "Disponible" WHERE id_habitacion = ?', [id_habitacion], () => {
                    return res.json({ success: true, message: "Habitación liberada, pero no se pudo alertar al cliente por falta de número." });
                });
            });
            return;
        }

        db.query('UPDATE reservas SET estado_reserva = "Cancelada" WHERE id_reserva = ?', [idReserva], () => {
            db.query('UPDATE habitaciones SET estado = "Disponible" WHERE id_habitacion = ?', [id_habitacion], () => {
                db.query('UPDATE pagos_qr SET estado_validacion = "rechazado" WHERE id_reserva = ?', [idReserva], () => {

                    // Formateo estricto 591 limpio
                    let telefonoFormateado = telefono.toString().replace(/\D/g, '');
                    if (telefonoFormateado.startsWith('5913') && telefonoFormateado.length === 12) {
                        telefonoFormateado = '591' + telefonoFormateado.substring(4);
                    } else if (!telefonoFormateado.startsWith('591')) {
                        telefonoFormateado = `591${telefonoFormateado}`;
                    }

                    const txtWhatsapp = `Estimado(a) *${nombre_completo}*. Lamentamos informarte que tu comprobante de pago para la *Habitación ${numero}* no pudo ser conciliado en nuestros registros bancarios. Por motivos de seguridad, tu pre-reserva ha sido cancelada y la habitación ha sido liberada.`;
                    
                    enviarNotificacionWhatsApp(telefonoFormateado, txtWhatsapp);

                    res.json({ success: true, message: "Fraude controlado. Reserva anulada y habitación liberada en el sistema." });
                });
            });
        });
    });
});

// ==========================================
// 3. MÓDULO: AUTENTICACIÓN Y ADMINS (RESTAURADO)
// ==========================================
app.post('/api/login', (req, res) => {
    const { usuario, password } = req.body;

    const sqlSelect = 'SELECT id_admin, nombre, rol, password_hash FROM administradores WHERE usuario = ?';
    
    db.query(sqlSelect, [usuario], async (err, results) => {
        if (err) return res.status(500).json({ success: false, mensaje: "Error en el servidor" });

        if (results && results.length > 0) {
            const userFound = results[0];

            try {
                const match = await bcrypt.compare(password, userFound.password_hash);

                if (match) {
                    db.query('UPDATE administradores SET ultimo_acceso = NOW() WHERE id_admin = ?', [userFound.id_admin], () => {
                        res.json({ 
                            success: true, 
                            user: { 
                                id_admin: userFound.id_admin, 
                                nombre: userFound.nombre, 
                                rol: userFound.rol 
                            } 
                        });
                    });
                } else {
                    res.status(401).json({ success: false, mensaje: "Contraseña incorrecta" });
                }
            } catch (error) {
                res.status(500).json({ success: false, mensaje: "Error al verificar credenciales" });
            }
        } else {
            res.status(401).json({ success: false, mensaje: "El usuario no existe" });
        }
    });
});

app.post('/api/register', (req, res) => {
    const { nombre, usuario, password } = req.body;
    db.query('INSERT INTO administradores (nombre, usuario, password_hash) VALUES (?, ?, ?)', [nombre, usuario, password], () => res.json({ success: true }));
});

app.get('/api/administradores-lista', (req, res) => {
    db.query('SELECT id_admin, nombre, usuario, rol, ultimo_acceso FROM administradores ORDER BY rol ASC', (err, results) => res.json(results));
});

app.post('/api/registrar-trabajador', async (req, res) => {
    const { nombre, usuario, password, rol } = req.body;
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/;

    if (!soloLetras.test(usuario) || usuario.length > 10) {
        return res.status(400).json({ success: false, mensaje: "El usuario solo debe contener letras y máximo 10 caracteres." });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, mensaje: "La contraseña debe tener al menos 6 caracteres." });
    }

    try {
        const hash = await bcrypt.hash(password, saltRounds);
        db.query(
            'INSERT INTO administradores (nombre, usuario, password_hash, rol) VALUES (?, ?, ?, ?)', 
            [nombre, usuario, hash, rol], 
            (err) => {
                if (err) return res.status(500).json({ success: false, mensaje: "Error al registrar (posible usuario duplicado)" });
                res.json({ success: true });
            }
        );
    } catch (error) { res.status(500).json({ success: false }); }
});

// ==========================================
// 4. MÓDULO: GESTIÓN DE HABITACIONES Y CLIENTES (RESTAURADO)
// ==========================================
app.post('/api/registrar-checkin', (req, res) => {
    const { 
        nombre_completo, documento_identidad, telefono, email, 
        id_habitacion, monto_total, fecha_entrada, fecha_salida 
    } = req.body;

    if (!id_habitacion || !documento_identidad) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const sqlCliente = `
        INSERT INTO clientes (nombre_completo, documento_identidad, telefono, email) 
        VALUES (?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE id_cliente=LAST_INSERT_ID(id_cliente), nombre_completo=?, telefono=?, email=?`;

    db.query(sqlCliente, [nombre_completo, documento_identidad, telefono, email, nombre_completo, telefono, email], (err, result) => {
        if (err) {
            console.error("Error en Clientes:", err);
            return res.status(500).json({ error: "Error al registrar cliente" });
        }
        
        const id_cliente = result.insertId;

        const sqlReserva = `
            INSERT INTO reservas (id_cliente, id_habitacion, fecha_ingreso, fecha_salida, monto_total, estado_reserva) 
            VALUES (?, ?, ?, ?, ?, 'Check-in')`;

        db.query(sqlReserva, [id_cliente, id_habitacion, fecha_entrada, fecha_salida, monto_total], (err) => {
            if (err) {
                console.error("Error en Reservas:", err);
                return res.status(500).json({ error: "Error al crear registro de reserva" });
            }

            db.query("UPDATE habitaciones SET estado = 'Ocupada' WHERE id_habitacion = ?", [id_habitacion], (err) => {
                if (err) return res.status(500).json({ error: "Error al ocupar habitación" });
                res.json({ success: true, message: "Check-in completo y guardado" });
            });
        });
    });
});

app.put('/api/registrar-checkout/:idHabitacion', (req, res) => {
    const { idHabitacion } = req.params;

    // 1. Cerramos la reserva
    const sqlReserva = `
        UPDATE reservas 
        SET estado_reserva = 'Check-out' 
        WHERE id_habitacion = ? AND estado_reserva IN ('Check-in', 'Confirmada')`;

    db.query(sqlReserva, [idHabitacion], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al cerrar la reserva" });

        // 2. ⚠️ ESTO ES LO CRUCIAL: Guardar el estado 'Mantenimiento' en la tabla habitaciones
        const sqlHabitacion = "UPDATE habitaciones SET estado = 'Mantenimiento' WHERE id_habitacion = ?";
        
        db.query(sqlHabitacion, [idHabitacion], (err, resultHab) => {
            if (err) return res.status(500).json({ error: "Error al actualizar la habitación" });
            res.json({ success: true, message: "Check-out realizado y habitación en mantenimiento" });
        });
    });
});

app.put('/api/liberar-mantenimiento/:idHabitacion', (req, res) => {
    const { idHabitacion } = req.params;

    const sql = "UPDATE habitaciones SET estado = 'Disponible' WHERE id_habitacion = ?";
    
    db.query(sql, [idHabitacion], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al liberar la habitación" });
        res.json({ success: true, message: "Habitación liberada y lista para nuevas reservas" });
    });
});

// =========================================================================
// CORRECCIÓN CLAVE: ENDPOINT DE DETALLES DEL HUÉSPED (SOPORTE PARA 'PENDIENTE')
// =========================================================================
app.get('/api/detalles-huesped/:idHabitacion', (req, res) => {
    const { idHabitacion } = req.params;
    
    const sql = `
        SELECT 
            r.id_reserva, -- 👈 Agregado: Requerido por React para saber qué reserva aprobar/rechazar
            r.estado_reserva,
            c.nombre_completo, 
            c.documento_identidad, 
            c.telefono,
            c.email,
            r.fecha_ingreso AS fecha_entrada, 
            r.fecha_salida, 
            r.monto_total,
            p.comprobante_url
        FROM reservas r
        JOIN clientes c ON r.id_cliente = c.id_cliente
        LEFT JOIN pagos_qr p ON r.id_reserva = p.id_reserva
        WHERE r.id_habitacion = ? 
        AND r.estado_reserva IN ('Confirmada', 'Check-in', 'Pendiente') -- 👈 Agregado: Permitir buscar órdenes en espera
        ORDER BY r.id_reserva DESC 
        LIMIT 1`;

    db.query(sql, [idHabitacion], (err, result) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: "Error al consultar los datos del huésped" });
        }
        
       if (result.length > 0) {
            res.json(result[0]);
        } else {
            // 🚀 CAMBIO CLAVE: Responder con 200 y null en lugar de 404
            res.json(null); 
        }
    });
});

app.get('/api/habitaciones', (req, res) => {
    db.query('SELECT * FROM habitaciones ORDER BY numero ASC', (err, results) => res.json(results));
});

app.get('/api/clientes', (req, res) => {
    const sql = `SELECT id_cliente as id, nombre_completo as nombre, documento_identidad as documento, telefono as contacto, email FROM clientes ORDER BY nombre_completo ASC`;
    db.query(sql, (err, results) => res.json(results));
});

app.put('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, documento, contacto, email } = req.body;
    const sql = `UPDATE clientes SET nombre_completo = ?, documento_identidad = ?, telefono = ?, email = ? WHERE id_cliente = ?`;
    db.query(sql, [nombre, documento, contacto, email, id], (err, result) => res.json({ success: true }));
});

// ==========================================
// 5. MÓDULO: GESTIÓN DE RESERVAS (ADMIN)
// ==========================================
app.get('/api/lista-reservas', (req, res) => {
    const sql = `
        SELECT 
            r.id_reserva, 
            r.id_habitacion,
            c.nombre_completo, 
            c.documento_identidad, 
            c.telefono, 
            h.numero, 
            r.fecha_ingreso, 
            r.fecha_salida, 
            r.monto_total, 
            r.estado_reserva 
        FROM reservas r 
        JOIN clientes c ON r.id_cliente = c.id_cliente 
        JOIN habitaciones h ON r.id_habitacion = h.id_habitacion 
        ORDER BY r.id_reserva DESC`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// ==========================================
// 6. MÓDULO: REPORTES Y ESTADÍSTICAS (RESTAURADO)
// ==========================================
app.get('/api/reportes-estadisticas', (req, res) => {
    const { periodo, mes, anio } = req.query;
    
    let filterSQL = `WHERE estado_reserva != 'Cancelada' AND YEAR(fecha_ingreso) = ${anio}`;
    
    if (periodo === 'mes') {
        filterSQL += ` AND MONTH(fecha_ingreso) = ${mes}`;
    }

    const sqlIngresos = `
        SELECT 
            ${periodo === 'mes' 
                ? 'DATE_FORMAT(fecha_ingreso, "%d/%m")' 
                : "CASE MONTH(fecha_ingreso) WHEN 1 THEN 'Enero' WHEN 2 THEN 'Febrero' WHEN 3 THEN 'Marzo' WHEN 4 THEN 'Abril' WHEN 5 THEN 'Mayo' WHEN 6 THEN 'Junio' WHEN 7 THEN 'Julio' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Septiembre' WHEN 10 THEN 'Octubre' WHEN 11 THEN 'Noviembre' WHEN 12 THEN 'Diciembre' END"} as mes, 
            SUM(monto_total) as total, 
            COUNT(id_reserva) as clientes_mes 
        FROM reservas 
        ${filterSQL}
        GROUP BY mes 
        ORDER BY MIN(fecha_ingreso) ASC`;

    const sqlResumen = `
        SELECT 
            (SELECT COUNT(*) FROM reservas ${filterSQL} AND estado_reserva = 'Confirmada') as activas, 
            (SELECT COALESCE(SUM(monto_total), 0) FROM reservas ${filterSQL}) as ingresos_totales, 
            (SELECT COUNT(*) FROM habitaciones WHERE estado = 'Disponible') as habit_libres, 
            (SELECT COUNT(DISTINCT id_cliente) FROM reservas ${filterSQL}) as total_clientes`; 

    db.query(sqlIngresos, (err, ingresos) => {
        if (err) return res.status(500).json(err);
        db.query(sqlResumen, (err, resumen) => {
            if (err) return res.status(500).json(err);
            res.json({ 
                access: true,
                ingresos: ingresos || [], 
                resumen: resumen[0] || { activas: 0, ingresos_totales: 0, habit_libres: 0, total_clientes: 0 } 
            });
        });
    });
});

function finalizarInteraccion(frase, intencion, respuesta, entidades, res) {
    db.query('INSERT INTO memoria_ia (frase_usuario, intencion_detectada, entidades_json, respuesta_pao) VALUES (?, ?, ?, ?)', 
    [frase, intencion, JSON.stringify(entidades), respuesta], () => { if (!res.headersSent) res.json({ texto: respuesta }); });
}

app.post('/api/habitaciones-nueva', (req, res) => {
    const { numero, tipo, precio_noche, estado, descripcion } = req.body;
    const sql = "INSERT INTO habitaciones (numero, tipo, precio_noche, estado, descripcion) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [numero, tipo, precio_noche, estado, descripcion], (err, result) => {
        if (err) {
            console.error("Error al crear habitación:", err);
            return res.status(500).json({ error: "El número de habitación ya existe o los datos son inválidos" });
        }
        res.json({ success: true, message: "Habitación creada exitosamente" });
    });
});

app.put('/api/habitaciones-editar/:id', (req, res) => {
    const { id } = req.params;
    const { numero, tipo, precio_noche, estado, descripcion } = req.body;
    const sql = `
        UPDATE habitaciones 
        SET numero = ?, tipo = ?, precio_noche = ?, estado = ?, descripcion = ? 
        WHERE id_habitacion = ?`;

    db.query(sql, [numero, tipo, precio_noche, estado, descripcion, id], (err, result) => {
        if (err) {
            console.error("Error al editar habitación:", err);
            return res.status(500).json({ error: "Error al actualizar la habitación" });
        }
        res.json({ success: true, message: "Habitación actualizada" });
    });
});

app.delete('/api/habitaciones-eliminar/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM habitaciones WHERE id_habitacion = ?", [id], (err, result) => {
        if (err) {
            return res.status(500).json({ 
                error: "No se puede eliminar: Esta habitación tiene un historial de reservas vinculado." 
            });
        }
        res.json({ success: true, message: "Habitación eliminada del sistema" });
    });
});

app.put('/api/actualizar-reserva/:id', (req, res) => {
    const { id } = req.params;
    const { 
        id_habitacion, 
        id_habitacion_antigua, 
        fecha_ingreso, 
        fecha_salida, 
        monto_total,
        nombre_completo,
        documento_identidad,
        telefono 
    } = req.body;

    const sqlCliente = `
        UPDATE clientes c
        JOIN reservas r ON c.id_cliente = r.id_cliente
        SET c.nombre_completo = ?, c.documento_identidad = ?, c.telefono = ?
        WHERE r.id_reserva = ?`;

    db.query(sqlCliente, [nombre_completo, documento_identidad, telefono, id], (err) => {
        if (err) return res.status(500).json({ success: false, mensaje: "Error al actualizar datos del cliente" });

        const sqlCheck = "SELECT estado FROM habitaciones WHERE id_habitacion = ?";
        db.query(sqlCheck, [id_habitacion], (err, rows) => {
            if (id_habitacion !== id_habitacion_antigua && rows[0].estado !== 'Disponible') {
                return res.status(400).json({ success: false, mensaje: `La habitación nueva está ${rows[0].estado}` });
            }

            const sqlUpdateRes = `
                UPDATE reservas 
                SET id_habitacion = ?, fecha_ingreso = ?, fecha_salida = ?, monto_total = ? 
                WHERE id_reserva = ?`;
            
            db.query(sqlUpdateRes, [id_habitacion, fecha_ingreso, fecha_salida, monto_total, id], (err) => {
                if (err) return res.status(500).json({ success: false });

                if (id_habitacion !== id_habitacion_antigua) {
                    db.query("UPDATE habitaciones SET estado = 'Disponible' WHERE id_habitacion = ?", [id_habitacion_antigua]);
                    db.query("UPDATE habitaciones SET estado = 'Ocupada' WHERE id_habitacion = ?", [id_habitacion]);
                }
                res.json({ success: true, message: "Reserva y datos de cliente actualizados" });
            });
        });
    });
});

app.put('/api/actualizar-trabajador/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, usuario, password, rol } = req.body;
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/;

    if (!soloLetras.test(usuario) || usuario.length > 10) {
        return res.status(400).json({ success: false, mensaje: "Usuario inválido: solo letras, máximo 10." });
    }

    try {
        if (password && password.trim() !== "") {
            if (password.length < 6) {
                return res.status(400).json({ success: false, mensaje: "La nueva contraseña debe tener al menos 6 caracteres." });
            }
            const newHash = await bcrypt.hash(password, saltRounds);
            const sql = "UPDATE administradores SET nombre = ?, usuario = ?, password_hash = ?, rol = ? WHERE id_admin = ?";
            db.query(sql, [nombre, usuario, newHash, rol, id], (err) => {
                if (err) return res.status(500).json({ success: false });
                res.json({ success: true });
            });
        } else {
            const sql = "UPDATE administradores SET nombre = ?, usuario = ?, rol = ? WHERE id_admin = ?";
            db.query(sql, [nombre, usuario, rol, id], (err) => {
                if (err) return res.status(500).json({ success: false });
                res.json({ success: true });
            });
        }
    } catch (error) { res.status(500).json({ success: false }); }
});

app.delete('/api/eliminar-trabajador/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM administradores WHERE id_admin = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error al eliminar:", err);
            return res.status(500).json({ success: false, mensaje: "Error al eliminar el trabajador" });
        }
        
        if (result.affectedRows > 0) {
            res.json({ success: true, mensaje: "Trabajador eliminado correctamente" });
        } else {
            res.json({ success: false, mensaje: "No se encontró el trabajador" });
        }
    });
});
// ==========================================
// CONFIGURACIÓN DE WHATSAPP WEB REAL
// ==========================================
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(), // Guarda la sesión localmente para que no escanees el QR cada vez que reinicies el servidor
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Configuraciones de compatibilidad para evitar bloqueos del SO
    }
});

// Generar el código QR en la consola para escanear con el celular
client.on('qr', (qr) => {
    console.log('⚠️ [WHATSAPP] Escanea este código QR con el celular del Hostal para iniciar sesión:');
    qrcode.generate(qr, { small: true });
});

// Mensaje cuando la conexión sea exitosa
client.on('ready', () => {
    console.log('✅ [WHATSAPP READY] El bot de WhatsApp está conectado y listo para enviar notificaciones.');
});

// ==========================================
// MÓDULO: RECEPTOR DE COMPROBANTES (IA - PAO)
// ==========================================
// ==========================================
// MÓDULO: RECEPTOR DE COMPROBANTES (IA - PAO) - CORREGIDO
// ==========================================
client.on('message', async (msg) => {
    // 1. FILTROS DE SEGURIDAD: Ignorar estados, grupos y mensajes sin media
    if (msg.from === 'status@broadcast' || msg.from.endsWith('@g.us')) return;
    if (!msg.hasMedia) return;

    try {
        console.log(`[WhatsApp Bot] Multimedia detectada desde ${msg.from}...`);
        const media = await msg.downloadMedia();
        
        if (!media) return;

        // 2. USO DE RUTA UNIFICADA (La misma que definiste al principio del archivo)
        // Asegúrate de que UPLOADS_DIR esté disponible aquí (si es necesario defínelo fuera)
        const extension = media.mimetype.includes('pdf') ? '.pdf' : '.jpg';
        const nombreArchivo = `${Date.now()}_${msg.from.replace('@c.us', '')}${extension}`;
        const rutaGuardado = path.join(UPLOADS_DIR, nombreArchivo);
        
        // 3. Guardamos en disco
        require('fs').writeFileSync(rutaGuardado, Buffer.from(media.data, 'base64'));
        
        console.log(`[WhatsApp Bot] Comprobante guardado en: ${rutaGuardado}`);

        // 4. Lógica de registro en BD
        const telefono = msg.from.replace('@c.us', '');
        const sqlBuscarReserva = `
            SELECT r.id_reserva 
            FROM reservas r 
            JOIN clientes c ON r.id_cliente = c.id_cliente 
            WHERE c.telefono = ? AND r.estado_reserva = 'Pendiente' 
            ORDER BY r.id_reserva DESC LIMIT 1`;

        db.query(sqlBuscarReserva, [telefono], (err, results) => {
            if (results && results.length > 0) {
                const idReserva = results[0].id_reserva;
                const urlComprobante = `http://localhost:5000/uploads/${nombreArchivo}`;

                db.query(
                    'INSERT INTO pagos_qr (id_reserva, comprobante_url, estado_validacion) VALUES (?, ?, ?)',
                    [idReserva, urlComprobante, 'pendiente'],
                    () => {
                        client.sendMessage(msg.from, "¡Recibido! He guardado tu comprobante. Nuestro administrador lo revisará en breve.");
                    }
                );
            } else {
                client.sendMessage(msg.from, "Recibí tu archivo, pero no encontré una reserva pendiente con este número.");
            }
        });

    } catch (error) {
        // Esto evita que el error de puppeteer detenga tu servidor
        console.warn("⚠️ Advertencia al procesar mensaje multimedia (posible estado o archivo no descargable):", error.message);
    }
});


// Inicializamos el cliente de WhatsApp
client.initialize();

app.listen(5000, () => console.log('Servidor Paola Hostal en puerto 5000'));