import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Skull, Eye, Heart, Zap, Shield, Wand2, Moon, Sparkles } from 'lucide-react'

// Asset paths
const ASSETS = {
  sorting_hat: 'file:///C:/Users/Axel Rosete/.gemini/antigravity/brain/73bc4198-493e-494c-8102-d130ae5afbd5/sorting_hat_animatronic_1778437950594.png',
  red: 'file:///C:/Users/Axel Rosete/.gemini/antigravity/brain/73bc4198-493e-494c-8102-d130ae5afbd5/gryffindor_crest_premium_1778437964917.png',
  green: 'file:///C:/Users/Axel Rosete/.gemini/antigravity/brain/73bc4198-493e-494c-8102-d130ae5afbd5/slytherin_crest_premium_1778437980174.png',
  blue: 'file:///C:/Users/Axel Rosete/.gemini/antigravity/brain/73bc4198-493e-494c-8102-d130ae5afbd5/ravenclaw_crest_premium_1778437994911.png',
  yellow: 'file:///C:/Users/Axel Rosete/.gemini/antigravity/brain/73bc4198-493e-494c-8102-d130ae5afbd5/hufflepuff_crest_premium_1778438011879.png'
}

const questions = [
  {
    question: "Te encuentras frente a un laberinto encantado. El camino de la izquierda está lleno de niebla espesa, el de la derecha tiene un brillo plateado inquietante. ¿Cómo procedes?",
    options: [
      { text: "Corro hacia la niebla; el peligro es solo una prueba de valor.", house: "red" },
      { text: "Observo los patrones del brillo plateado para encontrar una salida lógica.", house: "blue" },
      { text: "Busco una forma de usar el laberinto a mi favor para llegar primero.", house: "green" },
      { text: "Espero a ver si alguien más necesita ayuda antes de entrar.", house: "yellow" }
    ]
  },
  {
    question: "Un extraño te ofrece un cáliz con una poción que promete 'revelar tu verdadero potencial'. ¿Qué haces?",
    options: [
      { text: "Lo bebo de inmediato; la aventura requiere riesgos.", house: "red" },
      { text: "Pregunto por los ingredientes y el origen de la receta.", house: "blue" },
      { text: "Acepto, pero solo si puedo usar ese potencial para ascender.", house: "green" },
      { text: "Comparto la oferta con mis amigos; no quiero dejar a nadie atrás.", house: "yellow" }
    ]
  },
  {
    question: "Si pudieras ser recordado por una sola cosa en la historia mágica, ¿cuál preferirías?",
    options: [
      { text: "Por haber defendido lo correcto sin importar las consecuencias.", house: "red" },
      { text: "Por haber descubierto un conocimiento que cambiará el mundo.", house: "blue" },
      { text: "Por haber alcanzado el poder que otros solo soñaron.", house: "green" },
      { text: "Por haber sido el amigo más leal que alguien pudo tener.", house: "yellow" }
    ]
  },
  {
    question: "Estás en un duelo y tu oponente baja la guardia por un segundo. ¿Qué es lo primero que piensas?",
    options: [
      { text: "Es mi oportunidad para un ataque directo y valiente.", house: "red" },
      { text: "Analizo si es una trampa antes de lanzar mi siguiente hechizo.", house: "blue" },
      { text: "Aprovecho su debilidad para asegurar mi victoria total.", house: "green" },
      { text: "Le doy un momento para recuperarse; quiero un duelo justo.", house: "yellow" }
    ]
  },
  {
    question: "En un examen de magia difícil, notas que tu mejor amigo está cometiendo un error fatal. ¿Qué haces?",
    options: [
      { text: "Le advierto en voz alta, arriesgándome a ser castigado.", house: "red" },
      { text: "Espero a que termine y luego le explico la teoría correcta.", house: "blue" },
      { text: "Me aseguro de que mi examen sea perfecto primero; él debe aprender solo.", house: "green" },
      { text: "Le paso discretamente una nota para que pueda corregirlo.", house: "yellow" }
    ]
  }
];

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
  const { user } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [scores, setScores] = useState({ red: 0, green: 0, yellow: 0, blue: 0 })
  const [stage, setStage] = useState('welcome') // welcome, quiz, sorting, result
  const [result, setResult] = useState(null)
  const [sortingText, setSortingText] = useState("Difícil... muy difícil...")
  const [shuffledOptions, setShuffledOptions] = useState([])
  const navigate = useNavigate()

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

  const handleAnswer = async (house) => {
    const newScores = { ...scores, [house]: scores[house] + 1 }
    setScores(newScores)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setStage('sorting')
      const winner = Object.keys(newScores).reduce((a, b) => newScores[a] > newScores[b] ? a : b)
      setResult(winner)
      
      // Animate sorting hat lines
      const lines = [
        "Veo mucha audacia...",
        "O tal vez... ¿un gran intelecto?",
        "Hay sed de gloria aquí...",
        "¡Ya lo tengo!"
      ]
      
      for (let i = 0; i < lines.length; i++) {
        await new Promise(r => setTimeout(r, 1200))
        setSortingText(lines[i])
      }

      await new Promise(r => setTimeout(r, 1000))

      if (user) {
        await supabase
          .from('hsf_profiles')
          .update({ house_slug: winner })
          .eq('user_id', user.id)
      }
      
      setStage('result')
    }
  }

  if (stage === 'sorting') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in duration-700">
        <div className="relative group">
          <div className="absolute inset-0 bg-magical-gold/20 blur-[60px] rounded-full animate-pulse" />
          <img 
            src={ASSETS.sorting_hat} 
            alt="Sorting Hat" 
            className="w-64 h-64 md:w-80 md:h-80 object-contain relative z-10 animate-bounce-slow"
          />
        </div>
        <div className="text-center space-y-4 relative z-10">
          <p className="text-magical-gold font-black uppercase tracking-[0.4em] animate-pulse">
            El Sombrero está analizando tu alma
          </p>
          <h2 className="text-2xl md:text-4xl font-black italic text-white min-h-[3rem]">
            “{sortingText}”
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
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 animate-pulse" />
        
        {stage === 'welcome' ? (
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
              <h2 className="text-3xl md:text-4xl font-black leading-tight text-white">{questions[currentIndex].question}</h2>
            </div>

            <div className="grid gap-4">
              {shuffledOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(opt.house)}
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


