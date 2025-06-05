// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Summary from "./pages/Summary";
import Portfolio from "./pages/Portfolio";
import Chat from "./pages/Chat";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/chat" element={<Chat />} />
        

      </Routes>
    </Router>

    
  );
}

export default App;
