import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronLeft, Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Se ha enviado un enlace de recuperación a tu correo.' })
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="glass-card w-full max-w-md overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/5 text-center space-y-4">
           <Link to="/login" className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest w-fit mx-auto">
             <ChevronLeft className="w-4 h-4" />
             Volver al Login
           </Link>
           <div className="p-4 bg-magical-gold/10 rounded-3xl w-fit mx-auto border border-magical-gold/20">
             <Mail className="w-10 h-10 text-magical-gold" />
           </div>
           <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Recuperar Acceso</h1>
           <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Enviaremos una lechuza con tu nueva llave</p>
        </div>

        <div className="p-8 space-y-6">
          {message ? (
            <div className={`p-6 rounded-2xl text-center space-y-4 ${
              message.type === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
            }`}>
              {message.type === 'success' ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                  <p className="text-sm font-bold text-white">{message.text}</p>
                  <p className="text-[10px] text-white/40 uppercase font-black">Revisa tu bandeja de entrada y spam.</p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                  <p className="text-sm font-bold text-white">{message.text}</p>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Tu Correo Electrónico</label>
                <input 
                  type="email" 
                  className="input-field"
                  placeholder="ejemplo@hogwarts.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-gold w-full py-4 flex items-center justify-center gap-3 group"
                disabled={loading}
              >
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                <span className="font-black uppercase italic tracking-tighter">Enviar Enlace</span>
              </button>
            </form>
          )}

          <p className="text-center text-[10px] text-white/20 uppercase font-bold tracking-widest">
            ¿Sigues teniendo problemas? <br /> Contacta con el Guardián de las Llaves.
          </p>
        </div>
      </div>
    </div>
  )
}
