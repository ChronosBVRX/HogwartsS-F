import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { withTimeout } from '../lib/supabaseSafe'
import { Wand2, Shield, Sparkles, AlertCircle } from 'lucide-react'
import { useAdventureAudio } from '../hooks/useAdventureAudio'
import { quizAudio } from '../data/quizAudioManifest'

// Real house assets
import gryffindorLogo from '../assets/houses/gryffindor.png'
import slytherinLogo from '../assets/houses/slytherin.png'
import hufflepuffLogo from '../assets/houses/hufflepuff.png'
import ravenclawLogo from '../assets/houses/ravenclaw.png'
import logo from '../assets/logo.png'

const ASSETS = {
  sorting_hat: logo,
  red: gryffindorLogo,
  green: slytherinLogo,
  blue: ravenclawLogo,
  yellow: hufflepuffLogo
}

const questions = [
  {
    id: 'q01',
    hatLine: 'El primer impulso rara vez dice la verdad completa... pero siempre deja una huella.',
    question: 'Llegas a una puerta antigua sin cerradura. Solo tiene una inscripción que dice: “Entra únicamente quien se atreva a perder algo”. ¿Qué haces?',
    options: [
      {
        id: 'q01_a',
        text: 'Intento entender qué tipo de pérdida exige antes de tocar la puerta.',
        scores: { blue: 2, yellow: 1 }
      },
      {
        id: 'q01_b',
        text: 'Entro. Algunas respuestas solo aparecen cuando ya cruzaste.',
        scores: { red: 2, green: 1 }
      },
      {
        id: 'q01_c',
        text: 'Busco si alguien más ya intentó entrar y qué consecuencias tuvo.',
        scores: { green: 2, blue: 1 }
      },
      {
        id: 'q01_d',
        text: 'No entraría solo; si algo se pierde, prefiero que nadie cargue con eso sin apoyo.',
        scores: { yellow: 2, red: 1 }
      }
    ]
  },
  {
    id: 'q02',
    hatLine: 'No todos desean brillar por las mismas razones.',
    question: 'Encuentras un objeto mágico que puede mostrarte cómo serías si alcanzaras tu máximo potencial. Solo puedes verlo una vez. ¿Qué buscarías primero?',
    options: [
      {
        id: 'q02_a',
        text: 'Qué decisiones tuve que tomar para llegar ahí.',
        scores: { blue: 2, green: 1 }
      },
      {
        id: 'q02_b',
        text: 'Quién sigue a mi lado en esa versión de mí.',
        scores: { yellow: 2, red: 1 }
      },
      {
        id: 'q02_c',
        text: 'Qué tan lejos logré llegar comparado con lo que otros esperaban de mí.',
        scores: { green: 2, blue: 1 }
      },
      {
        id: 'q02_d',
        text: 'Si esa versión de mí todavía se atreve a defender lo que cree.',
        scores: { red: 2, yellow: 1 }
      }
    ]
  },
  {
    id: 'q03',
    hatLine: 'El miedo habla bajo, pero decide mucho.',
    question: 'Durante una noche en el castillo escuchas que alguien pide ayuda desde un pasillo prohibido. No sabes si es una trampa. ¿Qué pesa más en tu decisión?',
    options: [
      {
        id: 'q03_a',
        text: 'Que si es real, cada segundo perdido importa.',
        scores: { red: 2, yellow: 1 }
      },
      {
        id: 'q03_b',
        text: 'Que una trampa también puede entenderse si no actúo por impulso.',
        scores: { blue: 2, green: 1 }
      },
      {
        id: 'q03_c',
        text: 'Que entrar sin plan podría convertir dos problemas en uno más grande.',
        scores: { green: 2, blue: 1 }
      },
      {
        id: 'q03_d',
        text: 'Que nadie debería ser ignorado solo porque hay riesgo.',
        scores: { yellow: 2, red: 1 }
      }
    ]
  },
  {
    id: 'q04',
    hatLine: 'Una promesa revela más cuando nadie puede obligarte a cumplirla.',
    question: 'Un profesor te confía un secreto que podría beneficiar a tu grupo si lo compartes, pero te pidió no decir nada. ¿Qué harías?',
    options: [
      {
        id: 'q04_a',
        text: 'Cumplo la promesa, aunque me cueste explicar por qué guardé silencio.',
        scores: { yellow: 2, red: 1 }
      },
      {
        id: 'q04_b',
        text: 'Busco una forma de ayudar sin romper literalmente la confianza.',
        scores: { green: 2, blue: 1 }
      },
      {
        id: 'q04_c',
        text: 'Analizo si guardar el secreto causa más daño que revelarlo.',
        scores: { blue: 2, yellow: 1 }
      },
      {
        id: 'q04_d',
        text: 'Si alguien puede salir lastimado, prefiero asumir el conflicto y decirlo.',
        scores: { red: 2, yellow: 1 }
      }
    ]
  },
  {
    id: 'q05',
    hatLine: 'La forma en que compites dice mucho de lo que crees merecer.',
    question: 'Estás cerca de ganar una competencia importante. Descubres una ventaja legal que nadie más ha notado. ¿Qué haces?',
    options: [
      {
        id: 'q05_a',
        text: 'La uso; observar mejor también es parte de competir.',
        scores: { green: 2, blue: 1 }
      },
      {
        id: 'q05_b',
        text: 'La estudio primero para asegurarme de que no sea una falla peligrosa.',
        scores: { blue: 2, green: 1 }
      },
      {
        id: 'q05_c',
        text: 'La usaría solo si no humilla ni perjudica injustamente a otros.',
        scores: { yellow: 2, green: 1 }
      },
      {
        id: 'q05_d',
        text: 'Prefiero ganar de una forma que nadie pueda cuestionar.',
        scores: { red: 2, yellow: 1 }
      }
    ]
  },
  {
    id: 'q06',
    hatLine: 'Cuando nadie mira, el alma suele hablar con más honestidad.',
    question: 'Encuentras una carta perdida. Al abrirla por accidente, notas que contiene información importante sobre alguien que conoces. ¿Qué haces después?',
    options: [
      {
        id: 'q06_a',
        text: 'La cierro y la entrego; no todo lo que se puede saber debe saberse.',
        scores: { yellow: 2, blue: 1 }
      },
      {
        id: 'q06_b',
        text: 'Leo lo necesario si creo que puede evitar un problema mayor.',
        scores: { green: 2, red: 1 }
      },
      {
        id: 'q06_c',
        text: 'Me pregunto por qué llegó a mí y si hay un patrón detrás.',
        scores: { blue: 2, green: 1 }
      },
      {
        id: 'q06_d',
        text: 'Busco directamente a la persona; prefiero enfrentar la incomodidad.',
        scores: { red: 2, yellow: 1 }
      }
    ]
  },
  {
    id: 'q07',
    hatLine: 'El lugar que eliges en una sala también revela cómo eliges estar en el mundo.',
    question: 'Entras a un gran salón lleno de personas desconocidas. ¿Dónde te colocarías instintivamente?',
    options: [
      {
        id: 'q07_a',
        text: 'Cerca del centro, donde pueda entender rápido qué está ocurriendo.',
        scores: { green: 2, red: 1 }
      },
      {
        id: 'q07_b',
        text: 'En un punto tranquilo desde donde pueda observar antes de participar.',
        scores: { blue: 2, green: 1 }
      },
      {
        id: 'q07_c',
        text: 'Junto a alguien que parezca incómodo para no dejarlo solo.',
        scores: { yellow: 2, red: 1 }
      },
      {
        id: 'q07_d',
        text: 'Donde haga falta alguien que se anime a romper el silencio.',
        scores: { red: 2, yellow: 1 }
      }
    ]
  },
  {
    id: 'q08',
    hatLine: 'No todos se rompen por lo mismo. No todos se levantan por la misma razón.',
    question: 'Después de cometer un error público, ¿qué te dolería más?',
    options: [
      {
        id: 'q08_a',
        text: 'Haber decepcionado a quienes confiaban en mí.',
        scores: { yellow: 2, red: 1 }
      },
      {
        id: 'q08_b',
        text: 'No haber previsto algo que podía analizarse mejor.',
        scores: { blue: 2, green: 1 }
      },
      {
        id: 'q08_c',
        text: 'Que otros usen ese error para definirme.',
        scores: { green: 2, red: 1 }
      },
      {
        id: 'q08_d',
        text: 'No haber tenido el valor de actuar distinto cuando pude.',
        scores: { red: 2, blue: 1 }
      }
    ]
  },
  {
    id: 'q09',
    hatLine: 'La magia más profunda no siempre está en lo que eliges, sino en lo que decides proteger.',
    question: 'Si pudieras proteger una sola cosa con un hechizo irrompible, ¿qué protegerías?',
    options: [
      {
        id: 'q09_a',
        text: 'La posibilidad de que las personas cambien.',
        scores: { yellow: 2, blue: 1 }
      },
      {
        id: 'q09_b',
        text: 'La libertad de decidir incluso cuando otros no entienden.',
        scores: { red: 2, green: 1 }
      },
      {
        id: 'q09_c',
        text: 'El conocimiento que evita repetir errores.',
        scores: { blue: 2, yellow: 1 }
      },
      {
        id: 'q09_d',
        text: 'La voluntad de llegar más lejos de lo que parecía permitido.',
        scores: { green: 2, red: 1 }
      }
    ]
  },
  {
    id: 'q10',
    hatLine: 'Última hebra. Ya casi puedo ver el escudo que espera por ti.',
    question: 'El Sombrero te ofrece elegir entre cuatro caminos, pero no te dice a dónde llevan. Solo puedes guiarte por una frase. ¿Cuál eliges?',
    options: [
      {
        id: 'q10_a',
        text: '“Lo correcto también necesita a alguien que se atreva.”',
        scores: { red: 2, yellow: 1 }
      },
      {
        id: 'q10_b',
        text: '“Toda puerta tiene una lógica, incluso cuando parece magia.”',
        scores: { blue: 2, green: 1 }
      },
      {
        id: 'q10_c',
        text: '“El mundo no se abre para quien espera permiso.”',
        scores: { green: 2, red: 1 }
      },
      {
        id: 'q10_d',
        text: '“Nadie llega lejos si olvida a quienes caminaron con él.”',
        scores: { yellow: 2, blue: 1 }
      }
    ]
  }
]

const HOUSE_DATA = {
  red: { 
    name: "Gryffindor", 
    color: "from-red-600 to-amber-600", 
    reward: "Bebida de Mantequilla de Regalo", 
    motto: "Donde habitan los valientes",
    explanation: "Tu alma arde con un fuego que no conoce el miedo. Prefieres la acción a la duda y la justicia a la comodidad. El Sombrero ha visto que ante el peligro, tu instinto es proteger y liderar con el corazón."
  },
  green: { 
    name: "Slytherin", 
    color: "from-emerald-600 to-slate-800", 
    reward: "Postre Mágico Gratis", 
    motto: "Orgullo, ambición y astucia",
    explanation: "Posees la chispa de la grandeza y la astucia para alcanzarla. No te conformas con lo ordinario; buscas el éxito y sabes que los fines a veces justifican los medios. Eres un líder nato que sabe cuándo actuar."
  },
  blue: { 
    name: "Ravenclaw", 
    color: "from-blue-600 to-indigo-900", 
    reward: "Upgrade a Bebida Grande", 
    motto: "Una mente dispuesta siempre aprenderá",
    explanation: "Tu curiosidad es infinita y tu lógica, impecable. Para ti, el conocimiento es el tesoro más valioso. El Sombrero ha detectado que valoras la verdad por encima de todo y tu mente es tu arma más poderosa."
  },
  yellow: { 
    name: "Hufflepuff", 
    color: "from-yellow-500 to-orange-400", 
    reward: "Snack de Bienvenida", 
    motto: "Justos, leales y trabajadores",
    explanation: "Tu corazón es puro y tu lealtad es inquebrantable. Entiendes que la verdadera magia reside en la bondad y el trabajo duro. No buscas la gloria personal, sino el bienestar de quienes te rodean."
  }
}

export default function Quiz() {
  const { user, loading, refreshProfile } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [scores, setScores] = useState({ red: 0, green: 0, yellow: 0, blue: 0 })
  const [strongHits, setStrongHits] = useState({ red: 0, green: 0, yellow: 0, blue: 0 })
  const [answerHistory, setAnswerHistory] = useState([])
  const [stage, setStage] = useState('welcome') // welcome, quiz, sorting, result
  const [result, setResult] = useState(null)
  const [sortingText, setSortingText] = useState("Difícil... muy difícil...")
  const [shuffledOptions, setShuffledOptions] = useState([])
  const [startingCeremony, setStartingCeremony] = useState(false)
  const [answering, setAnswering] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const navigate = useNavigate()
  const audio = useAdventureAudio()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  const handleStart = async () => {
    setStartingCeremony(true)
    setCurrentIndex(-1)
    setScores({ red: 0, green: 0, yellow: 0, blue: 0 })
    setStrongHits({ red: 0, green: 0, yellow: 0, blue: 0 })
    setAnswerHistory([])
    setResult(null)
    setSortingText('Difícil... muy difícil...')

    try {
      await audio.unlockAudio()
      audio.setAudioContext('sorting-hat-welcome')

      await audio.playSequence([
        { type: 'sfx', src: quizAudio.ui.magicClick, volume: 0.7 },
        { type: 'voice', src: quizAudio.welcome.intro, volume: 0.95, delay: 250 },
        { type: 'voice', src: quizAudio.welcome.start, volume: 0.95, delay: 250 }
      ], { contextId: 'sorting-hat-welcome' })
    } catch (err) {
      console.warn('[QUIZ AUDIO START ERROR]', err)
    }

    setStartingCeremony(false)
    setCurrentIndex(0)
    setStage('quiz')
  }

  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < questions.length) {
      const options = [...questions[currentIndex].options];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      setShuffledOptions(options)
    }
  }, [currentIndex])

  useEffect(() => {
    if (stage !== 'quiz' || currentIndex < 0 || !audio.enabled) return

    const questionAudio = quizAudio.questions[currentIndex]
    if (!questionAudio) return

    const contextId = `sorting-hat-question-${currentIndex}`
    audio.setAudioContext(contextId)

    audio.playSequence([
      { type: 'sfx', src: quizAudio.ui.thinking, volume: 0.45 },
      { type: 'voice', src: questionAudio.intro, volume: 0.95, delay: 250 },
      { type: 'voice', src: questionAudio.question, volume: 0.95, delay: 250 }
    ], { contextId }).catch(() => {})

    return () => {
      audio.stopSequence()
      audio.stopVoice()
    }
  }, [stage, currentIndex, audio.enabled, audio.setAudioContext, audio.playSequence, audio.stopSequence, audio.stopVoice])

  const applyScores = (option) => {
    const nextScores = { ...scores }
    const nextStrongHits = { ...strongHits }

    Object.entries(option.scores || {}).forEach(([house, value]) => {
      nextScores[house] = (nextScores[house] || 0) + value
      if (value >= 2) {
        nextStrongHits[house] = (nextStrongHits[house] || 0) + 1
      }
    })

    return { nextScores, nextStrongHits }
  }

  const resolveWinner = (finalScores, finalStrongHits, finalAnswerHistory) => {
    const houses = ['red', 'green', 'blue', 'yellow']
    const maxScore = Math.max(...houses.map(h => finalScores[h] || 0))
    let tied = houses.filter(h => (finalScores[h] || 0) === maxScore)

    if (tied.length === 1) return tied[0]

    // Tie breaker 1: Strong hits
    const maxStrong = Math.max(...tied.map(h => finalStrongHits[h] || 0))
    tied = tied.filter(h => (finalStrongHits[h] || 0) === maxStrong)

    if (tied.length === 1) return tied[0]

    // Tie breaker 2: Last answer
    const last = finalAnswerHistory[finalAnswerHistory.length - 1]
    if (last?.scores) {
      const lastMax = Math.max(...tied.map(h => last.scores[h] || 0))
      const lastTied = tied.filter(h => (last.scores[h] || 0) === lastMax)
      if (lastTied.length === 1) return lastTied[0]
      tied = lastTied
    }

    // Tie breaker 3: Random
    return tied[Math.floor(Math.random() * tied.length)]
  }

  const runSortingSequence = async (winner) => {
    const lines = [
      { text: 'Silencio... estoy mirando más allá de tus palabras.', audio: quizAudio.sorting.start },
      { text: 'Veo impulsos de grandeza, dudas nobles y deseos que no siempre dices en voz alta.', audio: quizAudio.sorting.line01 },
      { text: 'Hay valor aquí... pero también estrategia. Hay corazón... pero también una mente que observa.', audio: quizAudio.sorting.line02 },
      { text: 'Esto no es fácil. No, no lo es. Pero el Sombrero nunca se equivoca.', audio: quizAudio.sorting.line03 },
      { text: 'Ya lo tengo...', audio: quizAudio.sorting.final }
    ]

    const contextId = 'sorting-hat-sorting'
    audio.setAudioContext(contextId)

    for (const line of lines) {
      setSortingText(line.text)
      try {
        await audio.playSequence([
          { type: 'voice', src: line.audio, volume: 0.95 }
        ], { contextId })
      } catch (err) {
        // Fallback delay if audio fails
        await new Promise(resolve => setTimeout(resolve, 2500))
      }
    }

    if (user) {
      setSaving(true)
      
      const { error } = await withTimeout(
        supabase
          .from('hsf_profiles')
          .upsert({ 
            user_id: user.id,
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Mago sin nombre',
            phone: user.user_metadata?.phone || null,
            house_slug: winner,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' }),
        8000,
        'Guardando casa'
      )
      
      if (error) {
        console.error('[QUIZ SAVE ERROR]', error)
        alert('El Sombrero eligió tu casa, pero no se pudo guardar en tu perfil. Intenta nuevamente.')
        setSaving(false)
        return
      } else {
        console.log('[QUIZ SAVE SUCCESS]', winner)
        // Refresh the global profile state so other pages see the change immediately
        if (refreshProfile) {
          await refreshProfile()
          // Small delay to ensure the state propagation is complete
          await new Promise(r => setTimeout(r, 500))
        }
      }
      setSaving(false)
    }

    setStage('result')

    try {
      await audio.playSequence([
        { type: 'sfx', src: quizAudio.ui.reveal, volume: 0.85 },
        { type: 'voice', src: quizAudio.results[winner], volume: 0.98, delay: 300 }
      ], { contextId: `sorting-hat-result-${winner}` })
    } catch (err) {
      console.warn('[QUIZ RESULT AUDIO ERROR]', err)
    }
  }

  const handleAnswer = async (option) => {
    setAnswering(true)
    const { nextScores, nextStrongHits } = applyScores(option)
    const nextHistory = [...answerHistory, option]

    setScores(nextScores)
    setStrongHits(nextStrongHits)
    setAnswerHistory(nextHistory)

    const questionAudio = quizAudio.questions[currentIndex]
    const contextId = `sorting-hat-answer-${currentIndex}`

    try {
      audio.stopSequence()
      audio.stopVoice()

      await audio.playSequence([
        { type: 'sfx', src: quizAudio.ui.magicClick, volume: 0.65 },
        { type: 'voice', src: questionAudio?.afterAnswer, volume: 0.95, delay: 200 }
      ], { contextId })
    } catch (err) {
      console.warn('[QUIZ ANSWER AUDIO ERROR]', err)
    }

    setAnswering(false)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      return
    }

    const winner = resolveWinner(nextScores, nextStrongHits, nextHistory)
    setResult(winner)
    setStage('sorting')
    await runSortingSequence(winner)
  }

  if (stage === 'sorting') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in duration-700 bg-magical-navy">
        <div className="relative group">
          <div className="absolute inset-0 bg-magical-gold/20 blur-[60px] rounded-full animate-pulse" />
          <img 
            src={ASSETS.sorting_hat} 
            alt="Sorting Hat" 
            className="w-64 h-64 md:w-80 md:h-80 object-contain relative z-10 animate-bounce-slow"
          />
        </div>
        <div className="text-center space-y-6 relative z-10 max-w-xl">
          <div className="space-y-2">
            <p className="text-magical-gold text-xs font-black uppercase tracking-[0.4em] animate-pulse">
              {saving ? 'Escribiendo en los registros del castillo...' : 'El Sombrero está leyendo tus decisiones...'}
            </p>
          </div>
          <h2 className="text-2xl md:text-3xl font-black italic text-white leading-relaxed">
            “{saving ? 'Casi terminamos...' : sortingText}”
          </h2>
        </div>
      </div>
    )
  }

  if (stage === 'result') {
    const house = HOUSE_DATA[result]
    return (
      <div className="flex-1 flex items-center justify-center p-6 animate-in zoom-in duration-1000">
        <div className="glass-card w-full max-w-2xl p-10 md:p-14 text-center space-y-8 relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${house.color} opacity-20`} />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-magical-gold to-transparent animate-pulse" />
          
          <div className="relative z-10 space-y-8">
            <img 
              src={ASSETS[result]} 
              alt={house.name} 
              className="w-48 h-48 md:w-64 md:h-64 mx-auto object-contain drop-shadow-[0_0_30px_rgba(255,215,0,0.3)] animate-in slide-in-from-bottom duration-1000"
            />
            
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/50">¡Bienvenido a tu nueva casa!</p>
                <h2 className={`text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${house.color} drop-shadow-2xl`}>
                  {house.name}
                </h2>
                <p className="text-white/60 italic font-medium">{house.motto}</p>
              </div>

              <div className="max-w-md mx-auto bg-black/20 p-6 rounded-2xl border border-white/5">
                <p className="text-white/70 text-sm leading-relaxed italic">
                  “{house.explanation}”
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-3 relative overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-to-r ${house.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <div className="flex items-center justify-center gap-2 text-magical-gold">
                <Sparkles className="w-4 h-4" />
                <p className="font-black uppercase text-[10px] tracking-widest">Recompensa de Bienvenida</p>
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-2xl md:text-3xl font-black text-white">{house.reward}</p>
            </div>

            <button 
              onClick={() => navigate('/perfil')} 
              className="btn-gold w-full py-5 text-xl font-black uppercase tracking-widest flex items-center justify-center gap-4 group"
            >
              Ver mi Identificación Mágica
              <Shield className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-2xl p-8 md:p-12 text-center space-y-8 animate-in zoom-in duration-500 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-magical-gold via-white to-magical-gold animate-pulse opacity-20" />
        
        {stage === 'welcome' ? (
          <>
            <div className="space-y-6">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 bg-magical-gold/20 blur-2xl rounded-full" />
                <img src={ASSETS.sorting_hat} alt="Sombrero" className="w-full h-full object-contain relative z-10 animate-float" />
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                  El Sombrero <br />
                  <span className="text-magical-gold">Seleccionador</span>
                </h1>
                <p className="text-lg text-white/60 italic max-w-md mx-auto leading-relaxed">
                  “No responderás lo que eres. <br />Responderás lo que escondes.”
                </p>
              </div>
            </div>
            <button 
              onClick={handleStart} 
              disabled={startingCeremony}
              className="btn-gold text-xl px-12 py-5 w-full flex justify-center items-center gap-3 group disabled:opacity-50"
            >
              {startingCeremony ? 'El Sombrero está despertando...' : 'Ponerme el Sombrero'}
              {!startingCeremony && <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
            </button>
          </>
        ) : (
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-magical-gold/60">
                   Pregunta {currentIndex + 1} de {questions.length}
                </p>
                <div className="flex justify-center gap-1 w-full max-w-xs">
                  {questions.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-700 ${i <= currentIndex ? 'bg-magical-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-magical-gold italic">El Sombrero susurra...</p>
                <p className="text-sm text-white/50 italic leading-relaxed">“{questions[currentIndex].hatLine}”</p>
                <h2 className="text-2xl md:text-3xl font-black leading-tight text-white italic">
                  {questions[currentIndex].question}
                </h2>
              </div>
            </div>

            <div className="grid gap-3">
              {shuffledOptions.map((opt, idx) => (
                <button
                  key={opt.id}
                  disabled={answering}
                  onClick={() => handleAnswer(opt)}
                  className="w-full text-left p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-magical-gold hover:text-magical-navy transition-all group flex items-start gap-4 disabled:opacity-50"
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg font-black text-xs group-hover:bg-magical-navy/20 transition-colors shrink-0 mt-1">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-base font-bold leading-snug pt-1">
                    {opt.text}
                  </span>
                </button>
              ))}
            </div>

            {audio.playing && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Sparkles className="w-3 h-3 text-magical-gold animate-pulse" />
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-magical-gold animate-pulse">
                  El Sombrero está hablando...
                </p>
                <Sparkles className="w-3 h-3 text-magical-gold animate-pulse" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
