import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {  Skull, Eye, Heart, Zap, Shield, Wand2, Moon } from 'lucide-react'

const questions = [
  {
    question: "En la penumbra del Bosque Prohibido, escuchas un susurro. ¿Qué haces?",
    options: [
      { text: "Desenvainas tu varita y avanzas hacia el sonido.", house: "red", icon: <Shield className="w-5 h-5" /> },
      { text: "Lanzas un hechizo desilusionador para observar sin ser visto.", house: "green", icon: <Eye className="w-5 h-5" /> },
      { text: "Intentas descifrar si el susurro es un idioma antiguo.", house: "blue", icon: <Wand2 className="w-5 h-5" /> },
      { text: "Buscas huellas para ver si alguien necesita ayuda.", house: "yellow", icon: <Heart className="w-5 h-5" /> }
    ]
  },
  {
    question: "Un cofre antiguo aparece frente a ti. ¿Cómo decides abrirlo?",
    options: [
      { text: "Con un hechizo de apertura audaz, pase lo que pase.", house: "red", icon: <Zap className="w-5 h-5" /> },
      { text: "Manipulando los mecanismos ocultos con paciencia.", house: "green", icon: <Skull className="w-5 h-5" /> },
      { text: "Analizando las runas grabadas en la tapa.", house: "blue", icon: <Wand2 className="w-5 h-5" /> },
      { text: "Tocando suavemente para ver si el cofre tiene vida.", house: "yellow", icon: <Moon className="w-5 h-5" /> }
    ]
  },
  {
    question: "¿Qué tipo de magia te atrae más por su complejidad?",
    options: [
      { text: "La magia de combate y defensa.", house: "red", icon: <Shield className="w-5 h-5" /> },
      { text: "Las artes oscuras y la transmutación.", house: "green", icon: <Skull className="w-5 h-5" /> },
      { text: "La alquimia y la astronomía.", house: "blue", icon: <Wand2 className="w-5 h-5" /> },
      { text: "La herbología y el cuidado de criaturas.", house: "yellow", icon: <Heart className="w-5 h-5" /> }
    ]
  },
  {
    question: "Si pudieras crear un objeto mágico, ¿cuál sería su propósito?",
    options: [
      { text: "Proteger a los débiles de cualquier amenaza.", house: "red" },
      { text: "Asegurar el éxito y la gloria de mi linaje.", house: "green" },
      { text: "Revelar todas las verdades del universo.", house: "blue" },
      { text: "Hacer que todos se sientan bienvenidos y seguros.", house: "yellow" }
    ]
  }
];

const HOUSE_DATA = {
  red: { name: "Gryffindor", color: "from-red-600 to-amber-600", reward: "Bebida de Mantequilla de Regalo" },
  green: { name: "Slytherin", color: "from-emerald-600 to-slate-800", reward: "Postre Mágico Gratis" },
  blue: { name: "Ravenclaw", color: "from-blue-600 to-indigo-900", reward: "Upgrade a Bebida Grande" },
  yellow: { name: "Hufflepuff", color: "from-yellow-500 to-orange-400", reward: "Snack de Bienvenida" }
}

export default function Quiz() {
  const { user } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [scores, setScores] = useState({ red: 0, green: 0, yellow: 0, blue: 0 })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  const handleStart = () => setCurrentIndex(0)

  const handleAnswer = async (house) => {
    const newScores = { ...scores, [house]: scores[house] + 1 }
    setScores(newScores)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      const winner = Object.keys(newScores).reduce((a, b) => newScores[a] > newScores[b] ? a : b)
      setResult(winner)
      setSaving(true)
      
      if (user) {
        await supabase
          .from('hsf_profiles')
          .update({ house_slug: winner })
          .eq('user_id', user.id)
      }
      setSaving(false)
    }
  }

  if (result) {
    const house = HOUSE_DATA[result]
    return (
      <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in duration-1000">
        <div className="glass-card w-full max-w-2xl p-12 text-center space-y-8 relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${house.color} opacity-20`} />
          <div className="relative z-10 space-y-6">
            <Wand2 className="w-16 h-16 text-magical-gold mx-auto animate-bounce-slow" />
            <h1 className="text-2xl font-black uppercase tracking-[0.5em] text-white/60">El Sombrero ha hablado</h1>
            <h2 className={`text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${house.color} drop-shadow-2xl`}>
              {house.name}
            </h2>
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-2">
              <p className="text-magical-gold font-bold uppercase text-xs tracking-widest">Recompensa Especial</p>
              <p className="text-2xl font-black text-white">{house.reward}</p>
            </div>
            <button onClick={() => navigate('/perfil')} className="btn-gold w-full py-5 text-xl font-black uppercase">
              Ver mi Identificación
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-2xl p-8 md:p-12 text-center space-y-8 animate-in zoom-in duration-500 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 animate-pulse" />
        
        {currentIndex === -1 ? (
          <>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase italic">
                El Sombrero <br />
                <span className="text-magical-gold">Seleccionador</span>
              </h1>
              <p className="text-lg text-white/60 italic">
                "No soy de paja ni de tela, soy de magia pura. <br /> 
                Ponme sobre tus pensamientos y revelaré tu destino."
              </p>
            </div>
            <button onClick={handleStart} className="btn-gold text-xl px-12 py-5 w-full flex justify-center items-center gap-3 group">
              Ponerme el Sombrero
              <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>
          </>
        ) : (
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex justify-center gap-1">
                {questions.map((_, i) => (
                  <div key={i} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${i <= currentIndex ? 'bg-magical-gold' : 'bg-white/10'}`} />
                ))}
              </div>
              <h2 className="text-3xl md:text-4xl font-black leading-tight">{questions[currentIndex].question}</h2>
            </div>

            <div className="grid gap-4">
              {questions[currentIndex].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(opt.house)}
                  disabled={saving}
                  className="w-full text-left p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-magical-gold hover:text-magical-navy transition-all group flex items-center gap-4"
                >
                  <div className="p-3 bg-white/5 rounded-xl group-hover:bg-magical-navy/20 transition-colors">
                    {opt.icon || <Wand2 className="w-5 h-5" />}
                  </div>
                  <span className="text-lg font-bold">
                    {opt.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
