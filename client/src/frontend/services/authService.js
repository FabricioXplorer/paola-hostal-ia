// Este es el "mensajero" que conectará la Vista con el Controlador del Backend
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/auth';

export const loginUsuario = async (credenciales) => {
    // Aquí es donde en el futuro llamaremos a la base de datos MySQL
    console.log("Enviando datos al controlador del backend...", credenciales);
    // return await axios.post(`${API_URL}/login`, credenciales); 
    return { success: true, user: "Empleado Paola" }; // Simulación para el avance
};