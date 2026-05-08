import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Customer/Profile'
import Menu from './pages/Menu'
import Quiz from './pages/Quiz'
import Attendance from './pages/Customer/Attendance'
import ClaimTicket from './pages/Customer/ClaimTicket'
import WaiterDashboard from './pages/Waiter/Dashboard'
import WaiterScanner from './pages/Waiter/Scanner'
import AdminDashboard from './pages/Admin/Dashboard'
import Settings from './pages/Customer/Settings'
import ForgotPassword from './pages/ForgotPassword'
import Navbar from './components/layout/Navbar'
import InstallPWA from './components/InstallPWA'

const ProtectedRoute = ({ children, role }) => {
  const { user, profile } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (role === 'admin' && profile?.role !== 'admin') return <Navigate to="/" />
  if (role === 'waiter' && !['waiter', 'admin'].includes(profile?.role)) return <Navigate to="/" />
  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col max-w-full overflow-x-hidden">
          <Navbar />
          <InstallPWA />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/login" element={<Login />} />
            <Route path="/olvide-password" element={<ForgotPassword />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/quiz" element={<Quiz />} />

            {/* Customer Routes */}
            <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/ajustes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/asistencia" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/registrar-ticket" element={<ProtectedRoute><ClaimTicket /></ProtectedRoute>} />

            {/* Waiter Routes */}
            <Route path="/mesero" element={<ProtectedRoute role="waiter"><WaiterDashboard /></ProtectedRoute>} />
            <Route path="/mesero/escanear" element={<ProtectedRoute role="waiter"><WaiterScanner /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
