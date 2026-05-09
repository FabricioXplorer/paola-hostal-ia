const natural = require('natural');
const classifier = new natural.LogisticRegressionClassifier();

// --- INTENCIÓN: SALUDO ---
classifier.addDocument('hola', 'saludo');
classifier.addDocument('buenos dias', 'saludo');
classifier.addDocument('buenas tardes', 'saludo');
classifier.addDocument('que tal', 'saludo');
classifier.addDocument('hey', 'saludo');

// --- INTENCIÓN: DISPONIBILIDAD (Mejorado) ---
classifier.addDocument('¿tienen habitaciones disponibles?', 'disponibilidad');
classifier.addDocument('quisiera ver si hay cuartos libres', 'disponibilidad');
classifier.addDocument('hay espacio para hoy por favor', 'disponibilidad');
classifier.addDocument('estoy buscando alojamiento en sucre', 'disponibilidad');
classifier.addDocument('¿que habitaciones tienen libres?', 'disponibilidad');
classifier.addDocument('quiero hacer una reserva', 'disponibilidad');
classifier.addDocument('¿tienen disponibilidad para estos dias?', 'disponibilidad');
classifier.addDocument('necesito un cuarto', 'disponibilidad');
classifier.addDocument('ver disponibilidad', 'disponibilidad');

// --- INTENCIÓN: PRECIOS ---
classifier.addDocument('cuanto cuesta', 'precios');
classifier.addDocument('tarifas', 'precios');
classifier.addDocument('precio de la noche', 'precios');
classifier.addDocument('valor de la habitacion', 'precios');
classifier.addDocument('costo', 'precios');

// --- INTENCIÓN: CONFIRMACIÓN ---
classifier.addDocument('si', 'confirmar');
classifier.addDocument('claro que si', 'confirmar');
classifier.addDocument('por favor', 'confirmar');
classifier.addDocument('me parece bien', 'confirmar');
classifier.addDocument('adelante', 'confirmar');
classifier.addDocument('esta bien', 'confirmar');
classifier.addDocument('si deseo', 'confirmar');

// --- INTENCIÓN: NEGACIÓN ---
classifier.addDocument('no', 'cancelar');
classifier.addDocument('luego', 'cancelar');
classifier.addDocument('ahora no', 'cancelar');
classifier.addDocument('no gracias', 'cancelar');

// --- INTENCIÓN: CANCELAR RESERVA ---
classifier.addDocument('quiero cancelar mi reserva', 'cancelar_reserva');
classifier.addDocument('ya no voy a ir', 'cancelar_reserva');
classifier.addDocument('anular mi reserva', 'cancelar_reserva');
classifier.addDocument('cancelar habitacion', 'cancelar_reserva');
classifier.addDocument('eliminar mi reserva', 'cancelar_reserva');

// --- INTENCION DE AGRADECIMIENDO ---
classifier.addDocument('gracias', 'agradecimiento');
classifier.addDocument('muchas gracias', 'agradecimiento');
classifier.addDocument('mil gracias', 'agradecimiento');
classifier.addDocument('perfecto gracias', 'agradecimiento');
classifier.addDocument('listo gracias', 'agradecimiento');
classifier.addDocument('ok gracias', 'agradecimiento');

classifier.train();

// ENTRENAR EL MODELO
classifier.train();

module.exports = classifier;