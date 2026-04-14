import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Watchlist from "./pages/Watchlist";

// 🔐 Protected Route
function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" /> : <Login />}
      />

      <Route
        path="/signup"
        element={user ? <Navigate to="/dashboard" /> : <Signup />}
      />

      {/* Protected route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
  path="/watchlist"
  element={
    <ProtectedRoute>
      <Watchlist />
    </ProtectedRoute>
  }
/>

      {/* Default redirect */}
      <Route
        path="*"
        element={<Navigate to={user ? "/dashboard" : "/login"} />}
      />
    </Routes>
  );
}

