import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
import NewTicket from "./pages/NewTicket";
import CustomerTicketDetail from "./pages/CustomerTicketDetail";
import AgentDashboard from "./pages/AgentDashboard";
import AgentTicketDetail from "./pages/AgentTicketDetail";
import AgentBookingDetail from "./pages/AgentBookingDetail";

const Home = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === "agent" ? "/agent" : "/customer"} />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/customer"
            element={
              <ProtectedRoute role="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/new"
            element={
              <ProtectedRoute role="customer">
                <NewTicket />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/tickets/:id"
            element={
              <ProtectedRoute role="customer">
                <CustomerTicketDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent"
            element={
              <ProtectedRoute role="agent">
                <AgentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/tickets/:id"
            element={
              <ProtectedRoute role="agent">
                <AgentTicketDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/bookings/:id"
            element={
              <ProtectedRoute role="agent">
                <AgentBookingDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;