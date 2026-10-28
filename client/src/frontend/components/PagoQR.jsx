// src/components/PagoQR.jsx
import { useState } from 'react';
import { FaCloudUploadAlt, FaCheckCircle, FaSpinner, FaFilePdf, FaImage } from 'react-icons/fa';
import './PagoQR.css';

// Imagen de ejemplo para tu QR estático (reemplázala por el QR real del hostal)
import qrHostal from '../assets/images/qr-hostal-paola.jpeg'; 

function PagoQR({ idReserva, montoTotal, onPagoEnviado }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Manejar y validar la selección del archivo (Solo imágenes y PDF)
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Tipos permitidos: cualquier imagen o documento PDF
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
      
      if (!validTypes.includes(selectedFile.type)) {
        alert("Formato no válido. Por favor, sube únicamente una imagen (JPEG, PNG) o un archivo PDF.");
        e.target.value = null; // Limpiar el input
        return;
      }

      setFile(selectedFile);

      // Si es una imagen generamos la vista previa; si es PDF mostramos un icono representativo
      if (selectedFile.type === 'application/pdf') {
        setPreview(null); // Los PDF no se previsualizan igual, manejaremos el texto/icono
      } else {
        setPreview(URL.createObjectURL(selectedFile));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('comprobante', file);
      formData.append('id_reserva', idReserva);
      formData.append('monto_pagado', montoTotal);

      // 🚀 PETICIÓN REAL AL SERVIDOR
      const response = await fetch('http://localhost:5000/api/pagos-qr', {
        method: 'POST',
        body: formData // Aquí enviamos el archivo real
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        if (onPagoEnviado) onPagoEnviado();
      } else {
        alert("Error del servidor: " + data.error);
      }
      
    } catch (error) {
      console.error("Error al subir el comprobante:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="qr-success-card">
        <FaCheckCircle className="success-icon" />
        <h2>¡Comprobante Enviado!</h2>
        <p>Nuestro sistema y la IA están verificando tu transacción. Te notificaremos en unos minutos.</p>
      </div>
    );
  }

  return (
    <div className="qr-payment-container">
      <div className="qr-instructions">
        <h3>Pago Seguro por QR</h3>
        <p>Para confirmar tu reserva, escanea el código QR de abajo desde la app de tu banco.</p>
        
        <div className="monto-box">
          <span>Monto a transferir:</span>
          <strong>{montoTotal} Bs</strong>
        </div>
      </div>

      {/* Imagen del QR Estático del Hostal */}
      <div className="qr-image-wrapper">
        <img src={qrHostal} alt="QR de Pago Hostal Paola" className="qr-img" />
      </div>

      {/* Formulario de Carga del Comprobante */}
      <form onSubmit={handleSubmit} className="qr-upload-form">
        <label className="dropzone-label">
          <input 
            type="file" 
            accept="image/*,application/pdf" 
            onChange={handleFileChange} 
            className="file-input-hidden"
            required
          />
          <div className="dropzone-content">
            <FaCloudUploadAlt className="upload-icon" />
            <span>{file ? "Cambiar comprobante" : "Subir captura o PDF del comprobante"}</span>
            {file && <p className="file-name">{file.name}</p>}
          </div>
        </label>

        {/* Vista previa si es imagen o aviso si es PDF */}
        {preview && (
          <div className="image-preview-box">
            <p><FaImage /> Vista previa de la imagen:</p>
            <img src={preview} alt="Vista previa" className="comprobante-preview" />
          </div>
        )}

        {file && file.type === 'application/pdf' && (
          <div className="image-preview-box pdf-selected-box">
            <p><FaFilePdf className="pdf-icon-preview" /> Archivo PDF seleccionado correctamente</p>
          </div>
        )}

        <button  className='btn-enviar-pago'
          type="submit" 
          btn-enviar-pago 
          disabled={!file || loading}
        >
          {loading ? (
            <>
              <FaSpinner className="spinner" /> Procesando con IA...
            </>
          ) : (
            "Enviar Comprobante"
          )}
        </button>
      </form>
    </div>
  );
}

export default PagoQR;