import React, { useState, useRef, useEffect } from 'react';
import './IA.css';

const IA = () => {
    const [messages, setMessages] = useState([
        { 
            id: 1, 
            text: "SISTEMA ACTIVO. Soy PAO, tu asistente inteligente de Paola Hostal. ¿En qué fechas planeas visitarnos en la Ciudad Blanca?", 
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

    // Función handleSend actualizada con conexión al Backend de Machine Learning
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
                text: data.texto, // Respuesta generada por tu Machine Learning
                sender: 'ai',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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