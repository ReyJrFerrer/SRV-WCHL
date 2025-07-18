import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./src/App";
import "./src/index.css";
import ClientHome from "./src/pages/client/home";
import ProviderHome from "./src/pages/provider/home";
import CreateProfile from "./src/pages/create-profile";
import { AuthProvider } from "./src/context/AuthContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/client/home" element={<ClientHome />} />
          <Route path="/provider/home" element={<ProviderHome />} />
          <Route path="/create-profile" element={<CreateProfile />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
