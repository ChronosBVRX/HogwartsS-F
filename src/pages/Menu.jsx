import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Sparkles, Flame, Coffee, Wine, UtensilsCrossed, Star } from 'lucide-react'

// Import illustrations
import burgerImg from '../assets/illustrations/burgers.png'
import wingsImg from '../assets/illustrations/wings.png'
import drinksImg from '../assets/illustrations/drinks.png'
import coffeeImg from '../assets/illustrations/coffee.png'
import defaultBg from '../assets/background.png'
import { MENU_ASSETS } from '../data/menuAssets'

const ICON_MAP = {
  "Sparkles": <Sparkles className="w-4 h-4" />,
  "UtensilsCrossed": <UtensilsCrossed className="w-4 h-4" />,
  "Flame": <Flame className="w-4 h-4" />,
  "Star": <Star className="w-4 h-4" />,
  "Coffee": <Coffee className="w-4 h-4" />,
  "Wine": <Wine className="w-4 h-4" />
}

const STOCK_IMAGES = {
  "Hamburguesas": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400",
  "Alitas de Fénix": "https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?auto=format&fit=crop&q=80&w=400",
  "Boneless de Hipogrifo": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=400",
  "Bebidas con Alcohol": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=400",
  "Bebidas sin Alcohol": "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&q=80&w=400",
  "Cafés Calientes": "https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&q=80&w=400",
  "Cold Brew (Bebidas de café heladas)": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=400",
  "Postres": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=400",
  "Tacos, Burritos, Gringas, Fajitas": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=400",
  "Snacks": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400",
  "Frappes": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=400",
  "Malteadas": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=400",
  "Carajillos (Café Helado con Alcohol)": "https://images.unsplash.com/photo-1594631252845-29fc4586d517?auto=format&fit=crop&q=80&w=400",
  "Expresos": "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&q=80&w=400",
  "Infusiones": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400",
  "Cajitas Mágicas y Ensaladas": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400",
  "default": "https://images.unsplash.com/photo-1561043433-9265f73e685f?auto=format&fit=crop&q=80&w=400"
}

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMenuData()
  }, [])

  const fetchMenuData = async () => {
    setLoading(true)
    const [catRes, itemRes] = await Promise.all([
      supabase.from('hsf_menu_categories').select('*').eq('active', true).order('sort_order', { ascending: true }),
      supabase.from('hsf_menu_items').select('*, category:hsf_menu_categories(name)').eq('active', true).order('sort_order', { ascending: true })
    ])

    if (!catRes.error && catRes.data) {
      const dynamicCats = catRes.data.map(c => ({
        id: c.id,
        name: c.name,
        icon: ICON_MAP[c.description?.split('|')[0]] || <Sparkles className="w-4 h-4" />,
        img: STOCK_IMAGES[c.name] || STOCK_IMAGES["default"]
      }))
      setCategories(dynamicCats)
      if (dynamicCats.length > 0 && !activeCategory) {
        setActiveCategory(dynamicCats[0].name)
      }
    }

    if (!itemRes.error && itemRes.data) {
      // Map DB schema to component schema
      const mappedItems = itemRes.data.map(i => ({
        id: i.id,
        nombre: i.name,
        categoria: i.category?.name || 'Otros',
        descripcion: i.description,
        precio: parseFloat(i.price),
        tags: i.is_featured ? ['premium'] : [],
        image_url: i.image_url || MENU_ASSETS[i.name] || null
      }))
      setMenuItems(mappedItems)
    }
    setLoading(false)
  }

  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === "Todos" || item.categoria === activeCategory
      const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.categoria.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery, menuItems])

  const currentCategoryData = categories.find(c => c.name === activeCategory)

  return (
    <div className="flex-1 pb-20">
      {/* Dynamic Hero based on Category */}
      <header className="relative h-[50vh] md:h-[65vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={currentCategoryData?.img || defaultBg} 
            className="w-full h-full object-cover transition-all duration-1000 scale-100"
            alt="Fondo" 
          />
          {/* Subtle vignette instead of heavy gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-magical-navy via-transparent to-black/20" />
        </div>
        
        <div className="relative z-10 text-center space-y-4 px-4 mt-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-magical-gold/20 backdrop-blur-md border border-magical-gold/30 rounded-full mb-4 animate-bounce-slow">
            {currentCategoryData?.icon}
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-magical-gold">Colección Mágica</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
            <span className="text-magical-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">{activeCategory === "Todos" ? "El Gran Menú" : activeCategory}</span>
          </h1>
          <p className="text-white max-w-xl mx-auto font-bold text-lg md:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] bg-black/20 backdrop-blur-sm p-2 rounded-xl">
            {activeCategory === "Todos" 
              ? "Explora nuestra selección de platillos y pociones preparadas con ingredientes del mundo mágico."
              : `Descubre los secretos de nuestra sección de ${activeCategory}.`}
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        {/* Search and Filter Bar */}
        <div className="p-3 mb-12 flex flex-col md:flex-row gap-3 items-center sticky top-4 z-40 bg-magical-navy border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="text"
              placeholder="Busca un hechizo o platillo..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-magical-gold/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 md:flex md:items-center gap-3 w-full">
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`relative overflow-hidden group rounded-2xl transition-all border h-28 md:h-20 flex-1 ${
                  activeCategory === cat.name 
                    ? 'border-magical-gold shadow-[0_0_30px_rgba(212,175,55,0.4)] scale-[1.02]' 
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                {/* Category Image Background */}
                <img 
                  src={cat.img} 
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                    activeCategory === cat.name ? 'opacity-100' : 'opacity-40 grayscale'
                  }`}
                  alt="" 
                />
                
                {/* Dark Overlay */}
                <div className={`absolute inset-0 transition-colors duration-500 ${
                  activeCategory === cat.name 
                    ? 'bg-magical-navy/40' 
                    : 'bg-black/60 group-hover:bg-black/40'
                }`} />

                {/* Selection border/glow */}
                {activeCategory === cat.name && (
                   <div className="absolute inset-0 border-2 border-magical-gold/50 rounded-2xl animate-pulse" />
                )}
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-2 p-3 text-center">
                  <div className={`p-1.5 rounded-lg transition-colors ${activeCategory === cat.name ? 'text-magical-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]' : 'text-white/60'}`}>
                    {cat.icon}
                  </div>
                  <span className={`text-[10px] md:text-xs font-black uppercase tracking-[0.15em] drop-shadow-lg ${
                    activeCategory === cat.name ? 'text-white' : 'text-white/60'
                  }`}>
                    {cat.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <Sparkles className="w-12 h-12 text-magical-gold/20 mx-auto mb-4 animate-pulse" />
              <p className="text-white/40 text-lg font-medium">Invocando platillos mágicos...</p>
            </div>
          ) : filteredMenu.length > 0 ? (
            filteredMenu.map((item, index) => (
              <ProductCard key={item.id} item={item} index={index} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <Sparkles className="w-12 h-12 text-magical-gold/20 mx-auto mb-4" />
              <p className="text-white/40 text-lg font-medium">No se encontraron hechizos con ese nombre.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductCard({ item, index }) {
  const isNew = item.tags?.includes('nuevo')
  const isAlcohol = item.tags?.includes('18+')
  const isPremium = item.tags?.includes('premium')

  return (
    <div 
      className="group relative"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="absolute inset-0 bg-magical-gold/5 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="glass-card overflow-hidden transition-all duration-500 group-hover:-translate-y-2 border-white/5 group-hover:border-magical-gold/30 flex flex-col h-full relative z-10">
        
        {/* Real Food Image if uploaded */}
        {item.image_url && (
          <div className="w-full h-48 relative overflow-hidden border-b border-white/10">
             <img src={item.image_url} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
             <div className="absolute inset-0 bg-gradient-to-t from-magical-navy via-transparent to-transparent" />
          </div>
        )}

        {/* Card Content */}
        <div className={`px-8 pb-8 space-y-5 flex-1 ${item.image_url ? 'pt-4' : 'pt-8'}`}>
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-2 mb-3">
                {isNew && (
                  <span className="px-2.5 py-1 bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                    Nuevo Hechizo
                  </span>
                )}
                {isAlcohol && (
                  <span className="px-2.5 py-1 bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                    Poción 18+
                  </span>
                )}
                {isPremium && (
                  <span className="px-2.5 py-1 bg-magical-gold/10 text-magical-gold text-[9px] font-black uppercase tracking-widest rounded-lg border border-magical-gold/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                    Calidad Épica
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-white group-hover:text-magical-gold transition-colors leading-tight">
                {item.nombre}
              </h3>
              <p className="text-[10px] text-magical-gold/60 font-black uppercase tracking-[0.2em]">
                {item.categoria}
              </p>
            </div>
            <div className="text-2xl font-black text-magical-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
              {item.precio > 0 ? `$${item.precio}` : <span className="text-sm italic opacity-50">TBA</span>}
            </div>
          </div>
          
          {item.descripcion && (
            <p className="text-sm text-white/60 leading-relaxed font-medium italic border-l-2 border-magical-gold/20 pl-4 py-1">
              "{item.descripcion}"
            </p>
          )}
        </div>
        
        {/* Card Footer */}
        <div className="px-8 py-5 bg-white/5 border-t border-white/5 flex justify-between items-center group-hover:bg-magical-gold/5 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-magical-gold animate-pulse" />
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Hogwarts S&F</span>
          </div>
          <button className="p-2 bg-white/5 rounded-lg text-magical-gold hover:bg-magical-gold hover:text-magical-navy transition-all duration-300">
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
