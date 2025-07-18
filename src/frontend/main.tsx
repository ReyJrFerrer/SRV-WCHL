import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./src/App";
import "./src/index.css";

// Placeholder components for the routes
const ClientHome = () => <div>Client Home - Coming Soon</div>;
const ProviderHome = () => <div>Provider Home - Coming Soon</div>;
const CreateProfile = () => <div>Create Profile - Coming Soon</div>;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/client/home" element={<ClientHome />} />
        <Route path="/provider/home" element={<ProviderHome />} />
        <Route path="/create-profile" element={<CreateProfile />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
