import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
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

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0F172A',
              color: '#F8FAFC',
              fontSize: '13px',
              borderRadius: '12px',
              border: '1px solid #334155'
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#0F172A' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#0F172A' } },
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
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