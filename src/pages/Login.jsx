import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/perfil')
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-md p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-magical-gold">Iniciar Sesión</h1>
          <p className="text-white/60">Bienvenido de vuelta, mago.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Correo Electrónico</label>
            <input 
              type="email" 
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Contraseña</label>
            <input 
              type="password" 
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button 
            type="submit" 
            className="btn-gold w-full py-3"
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Entrar'}
          </button>

          <div className="text-center">
            <Link to="/olvide-password" size="sm" className="text-[10px] uppercase font-bold tracking-widest text-white/30 hover:text-magical-gold transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>

        <p className="text-center text-white/60 text-sm">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-magical-gold hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
