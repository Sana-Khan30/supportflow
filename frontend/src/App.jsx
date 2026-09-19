import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import CustomerDashboard from "./pages/CustomerDashboard";
import NewTicket from "./pages/NewTicket";
import CustomerTicketDetail from "./pages/CustomerTicketDetail";
import AgentDashboard from "./pages/AgentDashboard";
import AgentTicketDetail from "./pages/AgentTicketDetail";
import AgentBookingDetail from "./pages/AgentBookingDetail";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import Landing from "./pages/Landing";

const Home = () => {
  const { user } = useAuth();
  if (!user) return <Landing />;
  return <Navigate to={user.role === "agent" ? "/agent" : "/customer"} />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#171B21',
              color: '#F4F3EF',
              fontSize: '14px',
              borderRadius: '8px',
            },
            success: { iconTheme: { primary: '#3D7A68', secondary: '#F4F3EF' } },
            error: { iconTheme: { primary: '#BF4A3D', secondary: '#F4F3EF' } },
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
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
            <Route
              path="/agent/analytics"
              element={
                <ProtectedRoute role="agent">
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;