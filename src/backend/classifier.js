const natural = require('natural');
const classifier = new natural.LogisticRegressionClassifier();

// --- INTENCIÓN: SALUDO ---
classifier.addDocument('hola', 'saludo');
classifier.addDocument('buenos dias', 'saludo');
classifier.addDocument('buenas tardes', 'saludo');
classifier.addDocument('que tal', 'saludo');
classifier.addDocument('hey', 'saludo');

// --- INTENCIÓN: DISPONIBILIDAD ---
classifier.addDocument('habitaciones disponibles', 'disponibilidad');
classifier.addDocument('tienes cuartos libres', 'disponibilidad');
classifier.addDocument('hay espacio para hoy', 'disponibilidad');
classifier.addDocument('quiero reservar una habitacion', 'disponibilidad');
classifier.addDocument('busco alojamiento', 'disponibilidad');
classifier.addDocument('necesito una habitacion', 'disponibilidad');

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

classifier.train();

// ENTRENAR EL MODELO
classifier.train();

module.exports = classifier;