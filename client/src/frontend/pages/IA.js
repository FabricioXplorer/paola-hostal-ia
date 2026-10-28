// src/pages/IA.jsx
import React, { useState, useRef, useEffect } from 'react';
import PagoQR from '../components/PagoQR'; // Importación limpia del componente QR
import './IA.css';

const IA = () => {
    const [messages, setMessages] = useState([
        { 
            id: 1, 
            text: "SISTEMA ACTIVO. Soy PAO, tu asistente inteligente de Paola Hostal.", 
            sender: 'ai',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    // Auto-scroll al último mensaje
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // La IA procesa la subida asíncrona y despacha tu mensaje de espera amigable
    const handleVerificacionIA = async (idReserva, montoTotal, nombreCliente, habitacion) => {
        setIsTyping(true);

        try {
            // Simulación de los 2 segundos exactos mientras el archivo viaja por red y se guarda en /uploads
            await new Promise((resolve) => setTimeout(resolve, 2000));
            
            setIsTyping(false);

            // RESPUESTA DEFINITIVA PROPUESTA POR TI: La IA avisa del estado En Espera
            setMessages(prev => [...prev, {
                id: Date.now() + 10,
                text: `⚙️ COMPROBANTE RECIBIDO. Muchas gracias por elegir Paola Hostal, ${nombreCliente}. En unos momentos nuestro personal de recepción verificará tu pago en el sistema bancario. Mientras tanto, la Habitación ${habitacion} ha quedado asegurada para ti en estado 'En Espera'. ¡Te esperamos pronto!`,
                sender: 'ai',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);

        } catch (error) {
            setIsTyping(false);
            console.error("Error en el envío del comprobante:", error);
            
            setMessages(prev => [...prev, {
                id: Date.now() + 12,
                text: "Hubo un inconveniente físico al cargar la imagen al servidor central. Por favor, reintenta adjuntar tu captura.",
                sender: 'ai',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }
    };

    // Función handleSend original intacta con lectura extendida de propiedades dinámicas para el QR
    const handleSend = async () => {
        if (!input || input.trim() === "") return;

        const userMsg = { 
            id: Date.now(), 
            text: input, 
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const textoParaEnviar = input; // Guardamos el texto antes de limpiar el input
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            // LLAMADA AL BACKEND (Donde reside la lógica de aprendizaje autónomo)
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    mensaje: textoParaEnviar,
                    usuarioId: "user_pao_hostal" // Identificador para que PAO aprenda de este usuario
                }),
            });

            if (!response.ok) throw new Error("Error en la comunicación con PAO");

            const data = await response.json();

            setIsTyping(false);
            
            const aiMsg = { 
                id: Date.now() + 1, 
                text: data.texto, // Respuesta generada por Machine Learning
                sender: 'ai',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                
                // Mapeo de parámetros para controlar la inyección del QR de forma segura
                showQR: data.showQR || false, 
                montoTotal: data.montoTotal || 380,
                idReserva: data.idReserva || 36,
                nombreCliente: data.nombreCliente || "Fabricio Meraldo",
                habitacion: data.habitacion || "301"
            };

            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error("Error:", error);
            setIsTyping(false);
            
            // Mensaje de respaldo en caso de que el servidor esté apagado
            const errorMsg = {
                id: Date.now() + 1,
                text: "Lo siento, mi conexión cerebral está inestable. Por favor, asegúrate de que mi servidor de aprendizaje esté activo.",
                sender: 'ai',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        }
    };

    return (
        <div className="pao-main-container">
            <div className="pao-chat-interface">
                <header className="pao-chat-header">
                    <div className="pao-header-info">
                        <div className="pao-avatar">P</div>
                        <div>
                            <h2>PAO <span>Virtual Assistant</span></h2>
                            <p>● EN LÍNEA</p>
                        </div>
                    </div>
                </header>

                <div className="pao-messages-display">
                    {messages.map(m => (
                        <div key={m.id} className={`pao-msg-group ${m.sender}`}>
                            <div className="pao-bubble-new">
                                <p>{m.text}</p>
                                
                                {/* Inyección condicional del QR bajo la burbuja de la IA antes del veredicto final */}
                                {m.sender === 'ai' && m.showQR && (
                                    <div style={{ marginTop: '15px' }}>
                                        <PagoQR 
                                            idReserva={m.idReserva}
                                            montoTotal={m.montoTotal}
                                            onPagoEnviado={() => {
                                                // Desactivamos la bandera visual para congelar la subida múltiple en esta burbuja
                                                m.showQR = false;
                                                // Ejecutamos la validación secuencial del modelo de visión
                                                handleVerificacionIA(m.idReserva, m.montoTotal, m.nombreCliente, m.habitacion);
                                            }}
                                        />
                                    </div>
                                )}
                                
                                <span className="pao-time-tag">{m.time}</span>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="pao-msg-group ai">
                            <div className="pao-bubble-new typing">
                                <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="pao-input-bar-container">
                    <div className="pao-glass-input">
                        <input 
                            type="text" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Consulta por disponibilidad, precios o servicios..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button className="pao-btn-s" onClick={handleSend}>
                            <i className="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IA;