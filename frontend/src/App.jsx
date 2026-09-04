import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";

import { MinistryDashboard } from "./pages/MinistryDashboard";
import { IdaDashboard } from "./pages/IdaDashboard";
import { MpDashboard } from "./pages/MpDashboard";
import { StateDashboard } from "./pages/StateDashboard";
import { VendorNetworkPage } from "./pages/VendorNetworkPage";
import { SpatialVerificationPage } from "./pages/SpatialVerificationPage";
import { AlertInboxPage } from "./pages/AlertInboxPage";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/ministry" replace />} />
          <Route path="/ministry" element={<MinistryDashboard />} />
          <Route path="/ida" element={<IdaDashboard />} />
          <Route path="/mp" element={<MpDashboard />} />
          <Route path="/state" element={<StateDashboard />} />
          <Route path="/vendors" element={<VendorNetworkPage />} />
          <Route path="/spatial" element={<SpatialVerificationPage />} />
          <Route path="/alerts" element={<AlertInboxPage />} />
          <Route path="*" element={<Navigate to="/ministry" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
