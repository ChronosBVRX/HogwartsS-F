import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Lock, Wand2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }

    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setMessage({ type: 'error', text: 'Error al actualizar la contraseña: ' + error.message })
    } else {
      setMessage({ type: 'success', text: '¡Tu contraseña ha sido actualizada con éxito!' })
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="glass-card w-full max-w-md overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/5 text-center space-y-4">
           <div className="p-4 bg-magical-gold/10 rounded-3xl w-fit mx-auto border border-magical-gold/20">
             <Lock className="w-10 h-10 text-magical-gold" />
           </div>
           <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Nueva Llave</h1>
           <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Escribe tu nueva contraseña secreta</p>
        </div>

        <div className="p-8 space-y-6">
          {message && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 ${
              message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p className="text-sm font-bold">{message.text}</p>
            </div>
          )}

          {!message || message.type !== 'success' ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Nueva Contraseña</label>
                <input 
                  type="password" 
                  className="input-field"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-gold w-full py-4 flex items-center justify-center gap-3 group"
                disabled={loading}
              >
                <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="font-black uppercase italic tracking-tighter">
                  {loading ? 'Hechizando...' : 'Actualizar Llave'}
                </span>
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-white/40 uppercase font-black tracking-widest">Serás redirigido al Gran Comedor en unos segundos...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
