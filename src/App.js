// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Register from './pages/Register';
import Login from './pages/Login';

function App() {
  return (
    <div style={{
      backgroundColor: '#0b3864', // Change to your desired color
      minHeight: '100vh', // Ensures the background fills the viewport
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/Login" element={<Login />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;


