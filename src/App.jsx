import { lazy, Suspense } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Components
import Navbar from './components/layout/Navbar'
import InstallPWA from './components/InstallPWA'

// Pages - Eager loaded (para navegación instantánea)
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Customer/Profile'
import Menu from './pages/Menu'
import Attendance from './pages/Customer/Attendance'

// Pages - Lazy loaded (para no saturar el inicio)
const Quiz = lazy(() => import('./pages/Quiz'))
const ClaimTicket = lazy(() => import('./pages/Customer/ClaimTicket'))
const WaiterDashboard = lazy(() => import('./pages/Waiter/Dashboard'))
const WaiterScanner = lazy(() => import('./pages/Waiter/Scanner'))
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'))
const Settings = lazy(() => import('./pages/Customer/Settings'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const AdventureHome = lazy(() => import('./pages/Customer/AdventureHome'))
const AdventureScanner = lazy(() => import('./pages/Customer/AdventureScanner'))
const AdventurePlay = lazy(() => import('./pages/Customer/AdventurePlay'))
const AdventureReward = lazy(() => import('./pages/Customer/AdventureReward'))
const DuelHome = lazy(() => import('./pages/Customer/DuelHome'))
const DuelRoom = lazy(() => import('./pages/Customer/DuelRoom'))
const DuelLobby = lazy(() => import('./pages/Customer/DuelLobby'))
const DuelShop = lazy(() => import('./pages/Customer/DuelShop'))
const DuelRanking = lazy(() => import('./pages/Customer/DuelRanking'))
const DuelSpellGuide = lazy(() => import('./pages/Customer/DuelSpellGuide'))
const DuelAchievements = lazy(() => import('./pages/Customer/DuelAchievements'))
const DuelWaitingRoom = lazy(() => import('./pages/Customer/DuelWaitingRoom'))
const DuelTutorial = lazy(() => import('./pages/Customer/DuelTutorial'))
const DuelManual = lazy(() => import('./pages/Customer/DuelManual'))

import LocationGuard from './components/LocationGuard'

const ProtectedRoute = ({ children, role }) => {
  const { user, profile, loading, profileLoading } = useAuth()

  if (loading || profileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-magical-gold uppercase font-black tracking-widest">
        {loading ? 'Cargando sesión...' : 'Verificando credenciales...'}
      </div>
    )
  }

  if (!user) return <Navigate to="/login" />
  if (role === 'admin' && profile?.role !== 'admin') return <Navigate to="/" />
  if (role === 'waiter' && !['waiter', 'admin'].includes(profile?.role)) return <Navigate to="/" />
  return children
}

const LoadingMagic = () => (
  <div className="flex-1 flex items-center justify-center text-magical-gold uppercase font-black tracking-widest animate-pulse">
    Cargando magia...
  </div>
)

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col max-w-full overflow-x-hidden">
          <Navbar />
          <InstallPWA />
          <Suspense fallback={<LoadingMagic />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/login" element={<Login />} />
              <Route path="/olvide-password" element={<ForgotPassword />} />
              <Route path="/restablecer-password" element={<ResetPassword />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/quiz" element={<LocationGuard><Quiz /></LocationGuard>} />

              {/* Customer Routes */}
              <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/ajustes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/asistencia" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
              <Route path="/registrar-ticket" element={<ProtectedRoute><ClaimTicket /></ProtectedRoute>} />
              
              <Route element={<ProtectedRoute><LocationGuard /></ProtectedRoute>}>
                <Route path="/aventura" element={<AdventureHome />} />
                <Route path="/aventura/escanear" element={<AdventureScanner />} />
                <Route path="/aventura/jugar/:runId" element={<AdventurePlay />} />
                <Route path="/aventura/recompensa/:runId" element={<AdventureReward />} />

                {/* Magic Duels Routes */}
                <Route path="/duelos" element={<DuelHome />} />
                <Route path="/duelos/retar" element={<DuelLobby />} />
                <Route path="/duelos/sala/:duelId" element={<DuelRoom />} />
                <Route path="/duelos/tienda" element={<DuelShop />} />
                <Route path="/duelos/ranking" element={<DuelRanking />} />
                <Route path="/duelos/hechizos" element={<DuelSpellGuide />} />
                <Route path="/duelos/logros" element={<DuelAchievements />} />
                <Route path="/duelos/espera/:duelId" element={<DuelWaitingRoom />} />
                <Route path="/duelos/tutorial" element={<DuelTutorial />} />
                <Route path="/duelos/manual" element={<DuelManual />} />
              </Route>

              {/* Waiter Routes */}
              <Route path="/mesero" element={<ProtectedRoute role="waiter"><WaiterDashboard /></ProtectedRoute>} />
              <Route path="/mesero/escanear" element={<ProtectedRoute role="waiter"><WaiterScanner /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
