const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const chrono = require('chrono-node'); 
const classifier = require('./classifier'); 
const app = express();
const bcrypt = require('bcrypt');
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

const sesiones = {};

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

    // --- FLUJO DE RESERVA ---
   if (sesiones[usuarioId].paso === 'esperando_fecha_salida' && entidades.fecha) {
        sesiones[usuarioId].datos.fecha_salida_obj = entidades.fecha;
        sesiones[usuarioId].paso = 'esperando_tipo';

        // LÓGICA DINÁMICA: Consultamos qué hay disponible de verdad
        const sqlDisponibles = 'SELECT DISTINCT tipo, precio_noche FROM habitaciones WHERE estado = "Disponible"';
        
        db.query(sqlDisponibles, (err, results) => {
            if (err || results.length === 0) {
                respuestaPao = "¡Excelente elección! Sin embargo, actualmente no tengo habitaciones disponibles para esas fechas. 😔";
                sesiones[usuarioId].paso = 'inicio'; // Reiniciamos porque no hay nada que ofrecer
            } else {
                // Creamos la lista con los datos reales de tu tabla 'habitaciones'
                let lista = results.map(h => `• ${h.tipo}: ${h.precio_noche} Bs`).join('\n');
                respuestaPao = `¡Perfecto! He revisado mi sistema y estas son las opciones disponibles para tus fechas:\n\n${lista}\n\n¿Cuál prefieres?`;
            }
            return finalizarInteraccion(mensaje, 'proporciona_fecha_salida', respuestaPao, entidades, res);
        });
        return; // Obligatorio para que no ejecute código posterior mientras espera la BD
    }

 if (sesiones[usuarioId].paso === 'esperando_tipo') {
        // Función para obtener la lista de lo que realmente hay disponible
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
                    // CAMINO TRUE: Avanzamos
                    sesiones[usuarioId].paso = 'esperando_nombre';
                    respuestaPao = `¡Excelente! He confirmado la disponibilidad de la habitación ${tipoDetectadoAhora}. Para registrarte, ¿cuál es tu nombre completo?`;
                    return finalizarInteraccion(mensaje, 'proporciona_tipo', respuestaPao, entidades, res);
                } else {
                    // CAMINO FALSE: No hay, mostramos la lista de nuevo
                    listarDisponiblesYResponder(`Lo siento, la habitación tipo "${tipoDetectadoAhora}" ya no está disponible. 😔`);
                }
            });
            return;
        } 
        else if (msgLower === "si" || msgLower === "sí") {
            // Caso del "SÍ": Le recordamos qué opciones tiene
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

    if (sesiones[usuarioId].paso === 'esperando_telefono') {
        sesiones[usuarioId].datos.telefono = mensaje;
        sesiones[usuarioId].paso = 'esperando_email';
        respuestaPao = "Ya casi terminamos. Por último, ¿cuál es tu correo electrónico?";
        return finalizarInteraccion(mensaje, 'proporciona_telefono', respuestaPao, entidades, res);
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

                    const sqlRes = 'INSERT INTO reservas (id_cliente, id_habitacion, fecha_ingreso, fecha_salida, monto_total, estado_reserva) VALUES (?, ?, ?, ?, ?, "Confirmada")';
                    db.query(sqlRes, [idCliente, id_habitacion, d.fecha_ingreso_obj, d.fecha_salida_obj, totalReserva], (errRes) => {
                        db.query('UPDATE habitaciones SET estado = "Ocupada" WHERE id_habitacion = ?', [id_habitacion], () => {
                            respuestaPao = `¡RESERVA EXITOSA! 🎉\n\n${d.nombre_completo}, Habitación ${numero}.\nEstadía: ${noches} noche(s).\nTotal: ${totalReserva} Bs.`;
                            delete sesiones[usuarioId]; 
                            finalizarInteraccion(mensaje, 'reserva_completada', respuestaPao, entidades, res);
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
            // Opcional: delete sesiones[usuarioId]; // Para limpiar la sesión si ya terminó
        } 
        else {
            respuestaPao = "Lo siento, no logré entenderte del todo. ¿Podrías indicarme una fecha para tu reserva?";
        }
    }
    finalizarInteraccion(mensaje, intencion, respuestaPao, entidades, res);
});

// ==========================================
// 3. MÓDULO: AUTENTICACIÓN Y ADMINS (RESTAURADO)
// ==========================================
app.post('/api/login', (req, res) => {
    const { usuario, password } = req.body;

    // 1. Buscamos al usuario solo por su nombre de usuario
    const sqlSelect = 'SELECT id_admin, nombre, rol, password_hash FROM administradores WHERE usuario = ?';
    
    db.query(sqlSelect, [usuario], async (err, results) => {
        if (err) return res.status(500).json({ success: false, mensaje: "Error en el servidor" });

        // 2. Verificamos si el usuario existe
        if (results && results.length > 0) {
            const userFound = results[0];

            try {
                // 3. COMPARACIÓN SEGURA: Compara el password del login con el hash de la BD
                const match = await bcrypt.compare(password, userFound.password_hash);

                if (match) {
                    // 4. Si la contraseña es correcta, actualizamos el último acceso
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
                    // Contraseña incorrecta
                    res.status(401).json({ success: false, mensaje: "Contraseña incorrecta" });
                }
            } catch (error) {
                res.status(500).json({ success: false, mensaje: "Error al verificar credenciales" });
            }
        } else {
            // Usuario no encontrado
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

    // VALIDACIONES
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


// Ruta para registrar Check-in desde el Dashboard
app.post('/api/registrar-checkin', (req, res) => {
    const { 
        nombre_completo, documento_identidad, telefono, email, 
        id_habitacion, monto_total, fecha_entrada, fecha_salida 
    } = req.body;

    // VALIDACIÓN DE SEGURIDAD: Si falta algún dato importante, no hace nada
    if (!id_habitacion || !documento_identidad) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // PASO 1: Gestionar Cliente (Insertar o recuperar ID si ya existe)
    const sqlCliente = `
        INSERT INTO clientes (nombre_completo, documento_identidad, telefono, email) 
        VALUES (?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE id_cliente=LAST_INSERT_ID(id_cliente), nombre_completo=?, telefono=?, email=?`;

    db.query(sqlCliente, [nombre_completo, documento_identidad, telefono, email, nombre_completo, telefono, email], (err, result) => {
        if (err) {
            console.error("Error en Clientes:", err);
            return res.status(500).json({ error: "Error al registrar cliente" });
        }
        



        // Obtenemos el ID del cliente (sea nuevo o existente)
        const id_cliente = result.insertId;

        // PASO 2: Insertar en RESERVAS (Usando tus nombres reales: fecha_ingreso)
        const sqlReserva = `
            INSERT INTO reservas (id_cliente, id_habitacion, fecha_ingreso, fecha_salida, monto_total, estado_reserva) 
            VALUES (?, ?, ?, ?, ?, 'Check-in')`;

        db.query(sqlReserva, [id_cliente, id_habitacion, fecha_entrada, fecha_salida, monto_total], (err) => {
            if (err) {
                console.error("Error en Reservas:", err);
                return res.status(500).json({ error: "Error al crear registro de reserva" });
            }

            // PASO 3: Actualizar Habitación
            db.query("UPDATE habitaciones SET estado = 'Ocupada' WHERE id_habitacion = ?", [id_habitacion], (err) => {
                if (err) return res.status(500).json({ error: "Error al ocupar habitación" });
                
                res.json({ success: true, message: "Check-in completo y guardado" });
            });
        });
    });
});
// Ruta para registrar Check-out desde el Dashboard
        app.put('/api/registrar-checkout/:idHabitacion', (req, res) => {
    const { idHabitacion } = req.params;

    // 1. Finalizamos la reserva activa para esa habitación
    const sqlReserva = `
        UPDATE reservas 
        SET estado_reserva = 'Check-out' 
        WHERE id_habitacion = ? AND estado_reserva = 'Check-in'`;

    db.query(sqlReserva, [idHabitacion], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al cerrar la reserva" });

        // 2. Cambiamos el estado de la habitación a Disponible
        const sqlHabitacion = "UPDATE habitaciones SET estado = 'Disponible' WHERE id_habitacion = ?";
        
        db.query(sqlHabitacion, [idHabitacion], (err, resultHab) => {
            if (err) return res.status(500).json({ error: "Error al liberar la habitación" });
            
            res.json({ success: true, message: "Check-out realizado y habitación liberada" });
        });
    });
});
app.get('/api/detalles-huesped/:idHabitacion', (req, res) => {
    const { idHabitacion } = req.params;
    
    const sql = `
        SELECT 
            c.nombre_completo, 
            c.documento_identidad, 
            c.telefono,
            c.email,
            r.fecha_ingreso AS fecha_entrada, 
            r.fecha_salida, 
            r.monto_total 
        FROM reservas r
        JOIN clientes c ON r.id_cliente = c.id_cliente
        WHERE r.id_habitacion = ? 
        AND r.estado_reserva IN ('Confirmada', 'Check-in') 
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
            // Si llega aquí, es porque la habitación está "Ocupada" en la tabla habitaciones,
            // pero no hay ninguna fila en 'reservas' con estado Confirmada o Check-in.
            res.status(404).json({ message: "No se encontró una reserva activa." });
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
    // Agregamos los campos de contacto del cliente
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
    // Recibimos los parámetros del frontend
    const { periodo, mes, anio } = req.query;
    
    // Filtro base: ignorar canceladas y filtrar por el año seleccionado
    let filterSQL = `WHERE estado_reserva != 'Cancelada' AND YEAR(fecha_ingreso) = ${anio}`;
    
    // Si la vista es mensual, filtramos también por el mes
    if (periodo === 'mes') {
        filterSQL += ` AND MONTH(fecha_ingreso) = ${mes}`;
    }

    // 1. Consulta para la gráfica y la tabla (Ingresos por periodo)
    // Si es mensual muestra días, si es anual muestra meses
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

    // 2. Consulta para las tarjetas superiores (Resumen dinámico)
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

// --- GESTIÓN DE INVENTARIO: AÑADIR NUEVA ---
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

// --- GESTIÓN DE INVENTARIO: EDITAR EXISTENTE ---
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

// --- GESTIÓN DE INVENTARIO: ELIMINAR ---
app.delete('/api/habitaciones-eliminar/:id', (req, res) => {
    const { id } = req.params;
    
    // Verificamos si no tiene reservas para evitar errores de llave foránea
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
    // Agregamos nombre_completo, documento_identidad y telefono que vienen del body
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

    // 1. Actualizamos primero los datos del cliente asociado a la reserva
    const sqlCliente = `
        UPDATE clientes c
        JOIN reservas r ON c.id_cliente = r.id_cliente
        SET c.nombre_completo = ?, c.documento_identidad = ?, c.telefono = ?
        WHERE r.id_reserva = ?`;

    db.query(sqlCliente, [nombre_completo, documento_identidad, telefono, id], (err) => {
        if (err) return res.status(500).json({ success: false, mensaje: "Error al actualizar datos del cliente" });

        // 2. Validamos la nueva habitación
        const sqlCheck = "SELECT estado FROM habitaciones WHERE id_habitacion = ?";
        db.query(sqlCheck, [id_habitacion], (err, rows) => {
            if (id_habitacion !== id_habitacion_antigua && rows[0].estado !== 'Disponible') {
                return res.status(400).json({ success: false, mensaje: `La habitación nueva está ${rows[0].estado}` });
            }

            // 3. Actualizamos la reserva
            const sqlUpdateRes = `
                UPDATE reservas 
                SET id_habitacion = ?, fecha_ingreso = ?, fecha_salida = ?, monto_total = ? 
                WHERE id_reserva = ?`;
            
            db.query(sqlUpdateRes, [id_habitacion, fecha_ingreso, fecha_salida, monto_total, id], (err) => {
                if (err) return res.status(500).json({ success: false });

                // 4. Gestión de estados de habitación
                if (id_habitacion !== id_habitacion_antigua) {
                    db.query("UPDATE habitaciones SET estado = 'Disponible' WHERE id_habitacion = ?", [id_habitacion_antigua]);
                    db.query("UPDATE habitaciones SET estado = 'Ocupada' WHERE id_habitacion = ?", [id_habitacion]);
                }
                res.json({ success: true, mensaje: "Reserva y datos de cliente actualizados" });
            });
        });
    });
});

// Ruta para actualizar datos de personal (SuperAdmin o Recepcionista)
app.put('/api/actualizar-trabajador/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, usuario, password, rol } = req.body;
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/;

    // Validación de Usuario
    if (!soloLetras.test(usuario) || usuario.length > 10) {
        return res.status(400).json({ success: false, mensaje: "Usuario inválido: solo letras, máximo 10." });
    }

    try {
        if (password && password.trim() !== "") {
            // Validación de Password si se intenta cambiar
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

// RUTA PARA ELIMINAR TRABAJADOR
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
app.listen(5000, () => console.log('Servidor Paola Hostal en puerto 5000'));