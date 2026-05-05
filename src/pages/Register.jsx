import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          display_name: formData.displayName,
          phone: formData.phone
        }
      }
    })
    
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
          <h1 className="text-3xl font-bold text-magical-gold">Registro</h1>
          <p className="text-white/60">Únete a Hogwarts Snacks & Foods.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Nombre Completo</label>
            <input 
              type="text" 
              className="input-field"
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Teléfono</label>
            <input 
              type="tel" 
              className="input-field"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Correo Electrónico</label>
            <input 
              type="email" 
              className="input-field"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Contraseña</label>
            <input 
              type="password" 
              className="input-field"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button 
            type="submit" 
            className="btn-gold w-full py-3"
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p className="text-center text-white/60 text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-magical-gold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
