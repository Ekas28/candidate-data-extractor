import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import DatabasePassword from "./pages/DatabasePassword";
import SavedDatabase from "./pages/SavedDatabase";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Main Dashboard */}
        <Route
          path="/"
          element={<Dashboard />}
        />

        {/* Database Password */}
        <Route
          path="/database"
          element={<DatabasePassword />}
        />

        {/* Saved Candidate Database */}
        <Route
          path="/database/saved"
          element={<SavedDatabase />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;