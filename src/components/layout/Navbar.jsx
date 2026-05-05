import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Shield, Users, Utensils, User, LogIn } from 'lucide-react'

export default function Navbar() {
  const { user, profile, isAdmin, isWaiter } = useAuth()

  return (
    <nav className="glass-card m-4 px-6 py-4 flex justify-between items-center z-50">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-xl font-bold text-magical-gold tracking-tighter">HSF</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/menu" className="text-sm font-medium hover:text-magical-gold transition-colors flex items-center gap-2">
          <Utensils className="w-4 h-4" />
          <span className="hidden md:inline">Menú</span>
        </Link>

        {user ? (
          <>
            <Link to="/perfil" className="text-sm font-medium hover:text-magical-gold transition-colors flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden md:inline">Mi Perfil</span>
            </Link>

            {isWaiter && (
              <Link to="/mesero" className="text-sm font-medium text-magical-gold hover:brightness-110 flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden md:inline">Mesero</span>
              </Link>
            )}

            {isAdmin && (
              <Link to="/admin" className="text-sm font-medium text-magical-gold hover:brightness-110 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden md:inline">Admin</span>
              </Link>
            )}
          </>
        ) : (
          <Link to="/login" className="btn-gold !px-4 !py-1 text-xs flex items-center gap-2">
            <LogIn className="w-3 h-3" />
            Entrar
          </Link>
        )}
      </div>
    </nav>
  )
}
