import { useState, useMemo } from 'react'
import { menuData } from '../data/menuData'
import { Search, Filter, Sparkles, Flame, Wine, Coffee } from 'lucide-react'

const CATEGORIES = [
  "Todos",
  "Hamburguesas",
  "Alitas",
  "Boneless",
  "Snacks",
  "Cajitas Mágicas",
  "Bebidas Café",
  "Bebidas Mágicas",
  "Carajillos",
  "Casas",
  "Crepas",
  "Nuevos"
]

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMenu = useMemo(() => {
    return menuData.filter(item => {
      const matchesCategory = activeCategory === "Todos" || item.categoria === activeCategory
      const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.categoria.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  return (
    <div className="flex-1 pb-20">
      {/* Header */}
      <header className="relative h-64 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="./src/assets/background.png" 
            className="w-full h-full object-cover blur-sm opacity-50"
            alt="Fondo" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-magical-navy/80 to-magical-navy" />
        </div>
        
        <div className="relative z-10 text-center space-y-4 px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-magical-gold tracking-tight">
            Menú de Hechizos Gastronómicos
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            Explora nuestra selección de platillos y pociones preparadas con ingredientes 
            del mundo mágico.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
        {/* Search and Filter Bar */}
        <div className="glass-card p-4 md:p-6 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="text"
              placeholder="Busca un hechizo o platillo..."
              className="input-field pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? 'bg-magical-gold text-magical-navy shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenu.length > 0 ? (
            filteredMenu.map(item => (
              <ProductCard key={item.id} item={item} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <Sparkles className="w-12 h-12 text-magical-gold/20 mx-auto mb-4" />
              <p className="text-white/40 text-lg">No se encontraron hechizos con ese nombre.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductCard({ item }) {
  const isNew = item.tags?.includes('nuevo')
  const isAlcohol = item.tags?.includes('18+')
  const isPremium = item.tags?.includes('premium')

  return (
    <div className="glass-card overflow-hidden group hover:border-magical-gold/50 transition-all duration-300 flex flex-col h-full">
      <div className="p-6 space-y-4 flex-1">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap gap-2 mb-2">
              {isNew && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider rounded border border-green-500/30">
                  Nuevo
                </span>
              )}
              {isAlcohol && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded border border-red-500/30">
                  18+
                </span>
              )}
              {isPremium && (
                <span className="px-2 py-0.5 bg-magical-gold/20 text-magical-gold text-[10px] font-bold uppercase tracking-wider rounded border border-magical-gold/30">
                  Premium
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-magical-gold transition-colors">
              {item.nombre}
            </h3>
            <p className="text-xs text-magical-gold/60 font-medium uppercase tracking-widest">
              {item.categoria}
            </p>
          </div>
          <div className="text-xl font-bold text-magical-gold">
            {item.precio > 0 ? `$${item.precio}` : 'TBA'}
          </div>
        </div>
        
        {item.descripcion && (
          <p className="text-sm text-white/50 leading-relaxed italic">
            "{item.descripcion}"
          </p>
        )}
      </div>
      
      <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex justify-between items-center">
        <span className="text-[10px] text-white/30 uppercase tracking-widest">Hogwarts S&F</span>
        <button className="text-magical-gold hover:text-white transition-colors">
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
