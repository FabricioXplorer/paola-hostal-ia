import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Navbar from './frontend/components/Navbar';
import Home from './frontend/pages/Home';
// import Login from './pages/Login';

function App() {
  return (
    <Router>
      {/* El Navbar se pone aquí UNA SOLA VEZ para que sea global */}
      {/* <Navbar /> 
       */}
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/login" element={<Route path="/login" element={<Login />} />} /> */}
        {/* Aquí irán tus otras páginas como /chat o /habitaciones */}
      </Routes>
    </Router>
  );
}

export default App;