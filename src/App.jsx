import { lazy, Suspense } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Components
import Navbar from './components/layout/Navbar'
import InstallPWA from './components/InstallPWA'

// Pages - Lazy loaded
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Customer/Profile'))
const Menu = lazy(() => import('./pages/Menu'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Attendance = lazy(() => import('./pages/Customer/Attendance'))
const ClaimTicket = lazy(() => import('./pages/Customer/ClaimTicket'))
const WaiterDashboard = lazy(() => import('./pages/Waiter/Dashboard'))
const WaiterScanner = lazy(() => import('./pages/Waiter/Scanner'))
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'))
const Settings = lazy(() => import('./pages/Customer/Settings'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
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

const ProtectedRoute = ({ children, role }) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-magical-gold uppercase font-black tracking-widest">
        Cargando sesión...
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
              <Route path="/registro" element={<Register />} />
              <Route path="/quiz" element={<Quiz />} />

              {/* Customer Routes */}
              <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/ajustes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/asistencia" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
              <Route path="/registrar-ticket" element={<ProtectedRoute><ClaimTicket /></ProtectedRoute>} />
              <Route path="/aventura" element={<ProtectedRoute><AdventureHome /></ProtectedRoute>} />
              <Route path="/aventura/escanear" element={<ProtectedRoute><AdventureScanner /></ProtectedRoute>} />
              <Route path="/aventura/jugar/:runId" element={<ProtectedRoute><AdventurePlay /></ProtectedRoute>} />
              <Route path="/aventura/recompensa/:runId" element={<ProtectedRoute><AdventureReward /></ProtectedRoute>} />

              {/* Magic Duels Routes */}
              <Route path="/duelos" element={<ProtectedRoute><DuelHome /></ProtectedRoute>} />
              <Route path="/duelos/retar" element={<ProtectedRoute><DuelLobby /></ProtectedRoute>} />
              <Route path="/duelos/sala/:duelId" element={<ProtectedRoute><DuelRoom /></ProtectedRoute>} />
              <Route path="/duelos/tienda" element={<ProtectedRoute><DuelShop /></ProtectedRoute>} />
              <Route path="/duelos/ranking" element={<ProtectedRoute><DuelRanking /></ProtectedRoute>} />
              <Route path="/duelos/hechizos" element={<ProtectedRoute><DuelSpellGuide /></ProtectedRoute>} />
              <Route path="/duelos/logros" element={<ProtectedRoute><DuelAchievements /></ProtectedRoute>} />
              <Route path="/duelos/espera/:duelId" element={<ProtectedRoute><DuelWaitingRoom /></ProtectedRoute>} />
              <Route path="/duelos/tutorial" element={<ProtectedRoute><DuelTutorial /></ProtectedRoute>} />
              <Route path="/duelos/manual" element={<ProtectedRoute><DuelManual /></ProtectedRoute>} />

              {/* Waiter Routes */}
              <Route path="/mesero" element={<ProtectedRoute role="waiter"><WaiterDashboard /></ProtectedRoute>} />
              <Route path="/mesero/escanear" element={<ProtectedRoute role="waiter"><WaiterScanner /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
