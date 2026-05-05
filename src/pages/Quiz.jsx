import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const questions = [
  {
      question: "¿Qué cualidad valoras más en un aliado?",
      options: [
          { text: "La valentía inquebrantable", house: "red" },
          { text: "La astucia y el ingenio", house: "green" },
          { text: "La lealtad y el trabajo duro", house: "yellow" },
          { text: "La sabiduría y el conocimiento", house: "blue" }
      ]
  },
  {
      question: "Te encuentras con un lago oscuro. ¿Qué haces?",
      options: [
          { text: "Nadas hasta el fondo sin dudarlo", house: "red" },
          { text: "Buscas una forma de controlarlo", house: "green" },
          { text: "Esperas a tus amigos para decidir", house: "yellow" },
          { text: "Observas sus patrones antes de actuar", house: "blue" }
      ]
  },
  {
      question: "¿Qué poción elegirías beber?",
      options: [
          { text: "Esencia de Fuego (Poder)", house: "red" },
          { text: "Elixir de Sombras (Invisibilidad)", house: "green" },
          { text: "Suero de la Verdad (Justicia)", house: "yellow" },
          { text: "Filtro de Claridad (Clarividencia)", house: "blue" }
      ]
  }
];

export default function Quiz() {
  const { user, profile } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(-1) // -1 for intro
  const [scores, setScores] = useState({ red: 0, green: 0, yellow: 0, blue: 0 })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const handleStart = () => setCurrentIndex(0)

  const handleAnswer = async (house) => {
    const newScores = { ...scores, [house]: scores[house] + 1 }
    setScores(newScores)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Calculate result and save
      setSaving(true)
      const winner = Object.keys(newScores).reduce((a, b) => newScores[a] > newScores[b] ? a : b)
      
      if (user) {
        await supabase
          .from('hsf_profiles')
          .update({ house_slug: winner })
          .eq('user_id', user.id)
      }
      
      navigate('/perfil')
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-2xl p-12 text-center space-y-8 animate-in zoom-in duration-500">
        {currentIndex === -1 ? (
          <>
            <h1 className="text-4xl md:text-6xl font-bold text-magical-gold">El Ritual del Espíritu</h1>
            <p className="text-xl text-white/60">
              Deja que las sombras del pasado y la luz del presente decidan tu lugar en Howard's.
            </p>
            <button onClick={handleStart} className="btn-gold text-xl px-12 py-4">
              Comenzar Ritual
            </button>
          </>
        ) : (
          <div className="space-y-8">
            <div className="space-y-2">
              <span className="text-magical-gold text-sm font-bold uppercase tracking-widest">
                Pregunta {currentIndex + 1} de {questions.length}
              </span>
              <h2 className="text-3xl font-bold">{questions[currentIndex].question}</h2>
            </div>

            <div className="grid gap-4">
              {questions[currentIndex].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(opt.house)}
                  disabled={saving}
                  className="w-full text-left p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-magical-gold/50 transition-all group"
                >
                  <span className="text-lg group-hover:text-magical-gold transition-colors">
                    {opt.text}
                  </span>
                </button>
              ))}
            </div>

            {saving && <p className="text-magical-gold animate-pulse">Sincronizando con los espíritus...</p>}
          </div>
        )}
      </div>
    </div>
  )
}
