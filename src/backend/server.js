const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const chrono = require('chrono-node'); 
const classifier = require('./classifier'); 
const app = express();

app.use(cors());
app.use(express.json());

// --- MEMORIA TEMPORAL DE SESIÓN ---
const sesiones = {};

// --- CONEXIÓN A LA BASE DE DATOS ---
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

// --- RUTA PRINCIPAL DEL CHAT (IA PAO) ---
app.post('/api/chat', (req, res) => {
    const { mensaje, usuarioId } = req.body;
    const msgLower = mensaje.toLowerCase();
    
    if (!sesiones[usuarioId]) {
        sesiones[usuarioId] = { paso: 'inicio', datos: {} };
    }

    const entidades = {
        fecha: chrono.es.parseDate(mensaje),
        personas: msgLower.match(/\d+/) ? msgLower.match(/\d+/)[0] : null,
        tipo_habitacion: null
    };

    const tiposHab = ['simple', 'doble', 'matrimonial', 'triple', 'suite', 'familiar', 'cuadruple'];
    tiposHab.forEach(tipo => {
        if (msgLower.includes(tipo)) entidades.tipo_habitacion = tipo;
    });

    const intencion = classifier.classify(msgLower);
    let respuestaPao = "";

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

    // FLUJO DE RESERVA IA
    if (sesiones[usuarioId].paso === 'esperando_nombre') {
        sesiones[usuarioId].datos.nombre_completo = mensaje;
        sesiones[usuarioId].paso = 'esperando_documento';
        respuestaPao = `¡Gracias, ${mensaje}! Ahora, indícame tu CI o Pasaporte:`;
        return finalizarInteraccion(mensaje, 'proporciona_nombre', respuestaPao, entidades, res);
    }

    if (sesiones[usuarioId].paso === 'esperando_documento') {
        sesiones[usuarioId].datos.documento = mensaje;
        sesiones[usuarioId].paso = 'esperando_telefono';
        respuestaPao = "Perfecto. ¿Cuál es tu número de teléfono?";
        return finalizarInteraccion(mensaje, 'proporciona_documento', respuestaPao, entidades, res);
    }

    if (sesiones[usuarioId].paso === 'esperando_telefono') {
        sesiones[usuarioId].datos.telefono = mensaje;
        sesiones[usuarioId].paso = 'esperando_email';
        respuestaPao = "Por último, ¿cuál es tu correo electrónico?";
        return finalizarInteraccion(mensaje, 'proporciona_telefono', respuestaPao, entidades, res);
    }

    if (sesiones[usuarioId].paso === 'esperando_email') {
        sesiones[usuarioId].datos.email = mensaje;
        const d = sesiones[usuarioId].datos;
        const sqlCli = 'INSERT INTO clientes (nombre_completo, documento_identidad, telefono, email) VALUES (?, ?, ?, ?)';
        db.query(sqlCli, [d.nombre_completo, d.documento, d.telefono, d.email], (err, resCli) => {
            if (err) return res.json({ texto: "Error al registrar tus datos." });
            const idCliente = resCli.insertId;
            db.query('SELECT id_habitacion, numero FROM habitaciones WHERE LOWER(tipo) = LOWER(?) AND estado = "Disponible" LIMIT 1', [d.tipo], (err, resHab) => {
                if (!resHab || resHab.length === 0) return res.json({ texto: `Lo siento, no hay disponibilidad para tipo ${d.tipo}.` });
                const { id_habitacion, numero } = resHab[0];
                const sqlRes = 'INSERT INTO reservas (id_cliente, id_habitacion, fecha_ingreso, fecha_salida, monto_total, estado_reserva) VALUES (?, ?, ?, ?, ?, "Confirmada")';
                db.query(sqlRes, [idCliente, id_habitacion, d.fecha_ingreso_obj, d.fecha_salida_obj, d.monto_total], (errRes) => {
                    db.query('UPDATE habitaciones SET estado = "Ocupada" WHERE id_habitacion = ?', [id_habitacion], () => {
                        respuestaPao = `¡RESERVA EXITOSA! ${d.nombre_completo}, Habitación ${numero}. Total: ${d.monto_total} Bs.`;
                        sesiones[usuarioId] = { paso: 'inicio', datos: {} }; 
                        finalizarInteraccion(mensaje, 'reserva_completada', respuestaPao, entidades, res);
                    });
                });
            });
        });
        return;
    }

    if (entidades.fecha && sesiones[usuarioId].paso === 'inicio') {
        const f = entidades.fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        sesiones[usuarioId].datos.fecha_ingreso_obj = entidades.fecha; 
        sesiones[usuarioId].paso = 'esperando_fecha_salida';
        respuestaPao = `¡He anotado el ${f}! ¿Hasta qué día planeas quedarte?`;
        return finalizarInteraccion(mensaje, 'proporciona_fecha_ingreso', respuestaPao, entidades, res); 
    }

    if (sesiones[usuarioId].paso === 'esperando_fecha_salida') {
        const fSalidaDetectada = chrono.es.parseDate(mensaje);
        if (fSalidaDetectada) {
            sesiones[usuarioId].datos.fecha_salida_obj = fSalidaDetectada;
            sesiones[usuarioId].paso = 'esperando_habitacion';
            db.query('SELECT tipo, precio_noche FROM habitaciones GROUP BY tipo', (err, rows) => {
                let lista = rows.map(h => `\n• ${h.tipo}: ${h.precio_noche} Bs.`).join('');
                respuestaPao = `Entendido. Opciones:${lista}\n¿Cuál deseas?`;
                finalizarInteraccion(mensaje, 'proporciona_fecha_salida', respuestaPao, entidades, res);
            });
            return;
        }
    }

    if (entidades.tipo_habitacion && sesiones[usuarioId].paso === 'esperando_habitacion') {
        db.query('SELECT precio_noche FROM habitaciones WHERE LOWER(tipo) = LOWER(?) AND estado = "Disponible" LIMIT 1', [entidades.tipo_habitacion], (err, results) => {
            if (results && results.length > 0) {
                const noches = Math.ceil(Math.abs(sesiones[usuarioId].datos.fecha_salida_obj - sesiones[usuarioId].datos.fecha_ingreso_obj) / (1000 * 60 * 60 * 24)) || 1;
                const total = results[0].precio_noche * noches;
                sesiones[usuarioId].datos.tipo = entidades.tipo_habitacion;
                sesiones[usuarioId].datos.monto_total = total;
                sesiones[usuarioId].paso = 'confirmando_reserva';
                respuestaPao = `La ${entidades.tipo_habitacion} por ${noches} noche(s) cuesta ${total} Bs. ¿Confirmamos?`;
            } else { respuestaPao = "No hay disponibilidad."; }
            finalizarInteraccion(mensaje, 'consulta_precio_real', respuestaPao, entidades, res);
        });
        return;
    }

    if (intencion === 'confirmar' && sesiones[usuarioId].paso === 'confirmando_reserva') {
        respuestaPao = `¡Excelente! ¿Cuál es tu nombre completo?`;
        sesiones[usuarioId].paso = 'esperando_nombre';
    } else if (intencion === 'saludo' && sesiones[usuarioId].paso === 'inicio') {
        respuestaPao = "¡Hola! Soy PAO. ¿Para qué fecha planeas tu visita?";
    } else {
        respuestaPao = "Entiendo. ¿Deseas consultar disponibilidad?";
    }
    finalizarInteraccion(mensaje, intencion, respuestaPao, entidades, res);
});

// --- RUTAS DE ADMIN ---
app.post('/api/login', (req, res) => {
    const { usuario, password } = req.body;
    db.query('SELECT nombre FROM administradores WHERE usuario = ? AND password_hash = ?', [usuario, password], (err, results) => {
        if (results && results.length > 0) res.json({ success: true, nombre: results[0].nombre });
        else res.status(401).json({ success: false, mensaje: "Credenciales inválidas" });
    });
});

app.post('/api/register', (req, res) => {
    const { nombre, usuario, password } = req.body;
    db.query('INSERT INTO administradores (nombre, usuario, password_hash) VALUES (?, ?, ?)', [nombre, usuario, password], () => res.json({ success: true }));
});

app.get('/api/habitaciones', (req, res) => {
    db.query('SELECT * FROM habitaciones ORDER BY numero ASC', (err, results) => res.json(results));
});

app.get('/api/lista-reservas', (req, res) => {
    const sql = `SELECT r.id_reserva, c.nombre_completo, h.numero, r.fecha_ingreso, r.fecha_salida, r.monto_total, r.estado_reserva 
                 FROM reservas r JOIN clientes c ON r.id_cliente = c.id_cliente 
                 JOIN habitaciones h ON r.id_habitacion = h.id_habitacion ORDER BY r.id_reserva DESC`;
    db.query(sql, (err, results) => res.json(results));
});

app.get('/api/administradores-lista', (req, res) => {
    db.query('SELECT id_admin, nombre, usuario, rol, ultimo_acceso FROM administradores ORDER BY rol ASC', (err, results) => res.json(results));
});

// ================================================================
// --- MÓDULO DE REPORTES Y ESTADÍSTICAS (CORREGIDO) ---
// ================================================================
app.get('/api/reportes-estadisticas', (req, res) => {
    // Consulta Ingresos por Mes (Forzamos nombres en español)
    const sqlIngresos = `
        SELECT 
            CASE MONTH(fecha_ingreso)
                WHEN 1 THEN 'Enero' WHEN 2 THEN 'Febrero' WHEN 3 THEN 'Marzo' 
                WHEN 4 THEN 'Abril' WHEN 5 THEN 'Mayo' WHEN 6 THEN 'Junio'
                WHEN 7 THEN 'Julio' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Septiembre' 
                WHEN 10 THEN 'Octubre' WHEN 11 THEN 'Noviembre' WHEN 12 THEN 'Diciembre'
            END as mes, 
            SUM(monto_total) as total 
        FROM reservas 
        WHERE estado_reserva != 'Cancelada'
        GROUP BY MONTH(fecha_ingreso)
        ORDER BY MONTH(fecha_ingreso) ASC`;

    // Consulta de Resumen para Cards
    const sqlResumen = `
        SELECT 
            (SELECT COUNT(*) FROM reservas WHERE estado_reserva = 'Confirmada') as activas,
            (SELECT COALESCE(SUM(monto_total), 0) FROM reservas WHERE estado_reserva != 'Cancelada') as ingresos_totales,
            (SELECT COUNT(*) FROM habitaciones WHERE estado = 'Disponible') as habit_libres`;

    db.query(sqlIngresos, (err, ingresos) => {
        if (err) return res.status(500).json(err);
        db.query(sqlResumen, (err, resumen) => {
            if (err) return res.status(500).json(err);
            res.json({ ingresos: ingresos || [], resumen: resumen[0] });
        });
    });
});

// --- GESTIÓN DE PERSONAL Y RESERVAS MANUALES ---
app.post('/api/registrar-trabajador', (req, res) => {
    const { nombre, usuario, password, rol } = req.body;
    db.query('INSERT INTO administradores (nombre, usuario, password_hash, rol) VALUES (?, ?, ?, ?)', [nombre, usuario, password, rol], () => res.json({ success: true }));
});

app.post('/api/reserva-manual', (req, res) => {
    const { nombre, documento, telefono, email, id_habitacion, fecha_ingreso, fecha_salida, monto_total } = req.body;
    const sqlCli = `INSERT INTO clientes (nombre_completo, documento_identidad, telefono, email) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id_cliente=LAST_INSERT_ID(id_cliente)`;
    db.query(sqlCli, [nombre, documento, telefono, email], (err, r) => {
        const idC = r.insertId;
        const sqlR = `INSERT INTO reservas (id_cliente, id_habitacion, fecha_ingreso, fecha_salida, monto_total, estado_reserva) VALUES (?, ?, ?, ?, ?, 'Confirmada')`;
        db.query(sqlR, [idC, id_habitacion, fecha_ingreso, fecha_salida, monto_total], () => {
            db.query('UPDATE habitaciones SET estado = "Ocupada" WHERE id_habitacion = ?', [id_habitacion], () => res.json({ success: true }));
        });
    });
});

app.put('/api/cancelar-reserva/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT id_habitacion FROM reservas WHERE id_reserva = ?', [id], (err, results) => {
        const idH = results[0].id_habitacion;
        db.query('UPDATE reservas SET estado_reserva = "Cancelada" WHERE id_reserva = ?', [id], () => {
            db.query('UPDATE habitaciones SET estado = "Disponible" WHERE id_habitacion = ?', [idH], () => res.json({ success: true }));
        });
    });
});

function finalizarInteraccion(frase, intencion, respuesta, entidades, res) {
    db.query('INSERT INTO memoria_ia (frase_usuario, intencion_detectada, entidades_json, respuesta_pao) VALUES (?, ?, ?, ?)', 
    [frase, intencion, JSON.stringify(entidades), respuesta], () => { if (!res.headersSent) res.json({ texto: respuesta }); });
}

app.listen(5000, () => console.log('Servidor en puerto 5000'));