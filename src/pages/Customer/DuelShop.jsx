import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { withTimeout } from '../../lib/supabaseSafe'
import { ShoppingBag, Star, Zap, Wand2, Box, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import audioManager from '../../lib/audioManager'

export default function DuelShop() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [duelProfile, setDuelProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
    // Play shop welcome
    const hasHeardWelcome = sessionStorage.getItem('hsf_duel_shop_welcome_played')
    if (!hasHeardWelcome) {
      audioManager.playVoice('shop_welcome', { delayMs: 1000 })
      sessionStorage.setItem('hsf_duel_shop_welcome_played', 'true')
    }
  }, [profile])

  const fetchData = async () => {
    if (!profile) {
      setLoading(false)
      return
    }
    
    try {
      const [itemsRes, profileRes] = await Promise.all([
        withTimeout(
          supabase.from('hsf_duel_items').select('*').eq('is_active', true).order('category'),
          8000,
          'Cargando objetos de tienda'
        ),
        withTimeout(
          supabase.from('hsf_duel_profiles').select('*').eq('user_id', profile.user_id).maybeSingle(),
          8000,
          'Cargando perfil de duelo'
        )
      ])

      if (itemsRes.data) setItems(itemsRes.data)
      if (profileRes.data) setDuelProfile(profileRes.data)
    } catch (err) {
      console.error('Error fetching shop data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (item) => {
    if (!profile || !duelProfile) return
    
    // Validate funds
    const canAffordGalleons = item.price_galleons > 0 && profile.loyalty_points >= item.price_galleons
    const canAffordShards = item.price_shards > 0 && duelProfile.duel_shards >= item.price_shards

    if (!canAffordGalleons && !canAffordShards) {
      audioManager.playVoice('shop_not_enough_funds')
      alert('No tienes suficientes fondos (Galeones o Fragmentos)')
      return
    }

    setPurchasing(item.item_key)
    
    // Purchase Logic (Inventory + Deducting funds via transaction)
    const { error: invError } = await withTimeout(
      supabase.rpc('hsf_purchase_duel_item', { p_item_key: item.item_key }),
      8000,
      'Procesando compra'
    )

    if (invError) {
      if (invError.message.includes('Ya posees')) alert('Ya posees este objeto')
      else alert('Error en la compra: ' + invError.message)
      setPurchasing(null)
      return
    }

    audioManager.playVoice('shop_purchase_success')
    alert(`¡Has adquirido ${item.name}!`)
    fetchData()
    setPurchasing(null)
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 pb-32 space-y-10 animate-in fade-in duration-1000">
      <header className="relative h-64 md:h-80 rounded-[3rem] overflow-hidden flex items-center justify-between px-8 md:px-16 border border-magical-gold/20 shadow-2xl bg-magical-navy">
        {/* Shop Background Decoration */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-magical-gold/20 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-spell-blue/10 blur-[100px]" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-magical-gold/10 border border-magical-gold/30 backdrop-blur-md">
            <ShoppingBag className="w-3 h-3 text-magical-gold" />
            <p className="text-[10px] font-black text-magical-gold uppercase tracking-[0.4em]">Ollivanders Premium</p>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic drop-shadow-xl">
            Boutique <span className="text-magical-gold">Mágica</span>
          </h1>
          <p className="text-text-gray font-black uppercase tracking-widest text-[10px] opacity-60 italic">“La varita elige al mago, el estilo lo eliges tú”</p>
        </div>

        <div className="hidden lg:flex flex-col gap-4 relative z-10">
           <div className="glass-card px-8 py-4 text-left group">
             <p className="text-[9px] font-black text-text-gray uppercase tracking-widest mb-1">Galeones de Oro</p>
             <div className="flex items-center gap-3">
               <span className="text-3xl font-black text-magical-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">{profile?.loyalty_points || 0}</span>
               <span className="text-xl">✨</span>
             </div>
           </div>
           <div className="glass-card px-8 py-4 text-left group">
             <p className="text-[9px] font-black text-text-gray uppercase tracking-widest mb-1">Fragmentos Mágicos</p>
             <div className="flex items-center gap-3">
               <span className="text-3xl font-black text-spell-blue drop-shadow-[0_0_10px_rgba(77,161,255,0.3)]">{duelProfile?.duel_shards || 0}</span>
               <span className="text-xl">💠</span>
             </div>
           </div>
        </div>
      </header>

      {/* Categories / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item) => {
          // Determine rarity for visual effect (random placeholder logic for demo if not in DB)
          const isLegendary = item.price_shards > 50 || item.price_galleons > 1000
          const isEpic = item.price_shards > 20 || item.price_galleons > 500
          
          return (
            <div key={item.id} className="magic-card group p-6 space-y-6 flex flex-col justify-between" style={{
              borderColor: isLegendary ? 'var(--color-magical-gold)' : isEpic ? 'var(--color-control-purple)' : 'rgba(212,175,55,0.2)'
            }}>
              {/* Item Header */}
              <div className="flex justify-between items-start">
                <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                  isLegendary ? 'bg-magical-gold/20 border-magical-gold text-magical-gold' : 
                  isEpic ? 'bg-control-purple/20 border-control-purple text-control-purple' : 
                  'bg-white/5 border-white/10 text-text-gray'
                }`}>
                  {isLegendary ? 'Legendario' : isEpic ? 'Épico' : 'Común'}
                </div>
                <div className="text-[10px] font-black text-text-gray/40 uppercase tracking-tighter">{item.category}</div>
              </div>

              {/* Item Preview */}
              <div className="h-48 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-magical-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 {item.category === 'wand' && <Wand2 className="w-20 h-20 text-magical-gold/30 group-hover:scale-125 transition-all duration-700" />}
                 {item.category === 'utility' && <Zap className="w-20 h-20 text-spell-blue/30 group-hover:scale-125 transition-all duration-700" />}
                 {item.category === 'title' && <Star className="w-20 h-20 text-healing-green/30 group-hover:scale-125 transition-all duration-700" />}
                 
                 {/* Shine effect for rarity */}
                 {(isLegendary || isEpic) && <div className="absolute inset-0 animate-glow-pulse pointer-events-none" />}
                 <div className="scanline" />
              </div>

              {/* Info */}
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{item.name}</h3>
                <p className="text-[10px] text-text-gray leading-relaxed italic line-clamp-2">“{item.description}”</p>
              </div>

              {/* Footer / Price */}
              <div className="pt-4 flex items-center justify-between border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-text-gray uppercase tracking-widest mb-0.5">Precio</span>
                  <div className="flex items-center gap-2">
                    {item.price_galleons > 0 && (
                       <span className="text-xl font-black text-magical-gold drop-shadow-sm">{item.price_galleons} ✨</span>
                    )}
                    {item.price_shards > 0 && (
                       <span className="text-xl font-black text-spell-blue drop-shadow-sm">{item.price_shards} 💠</span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => handlePurchase(item)}
                  disabled={purchasing === item.item_key}
                  className={`btn-gold !px-8 !py-4 text-xs font-black rounded-2xl shadow-xl transition-all ${
                    purchasing === item.item_key ? 'opacity-50' : ''
                  }`}
                >
                  {purchasing === item.item_key ? '...' : 'Comprar'}
                </button>
              </div>
            </div>
          )
        })}

        {items.length === 0 && !loading && (
          <div className="col-span-full py-32 text-center glass-card border-dashed border-white/10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Box className="w-10 h-10 text-white/20" />
            </div>
            <p className="text-white/30 font-black uppercase tracking-[0.3em] text-xs">Inventario vacío por el momento</p>
          </div>
        )}
      </div>

      <div className="pt-10 flex justify-center">
        <button 
          onClick={() => navigate('/duelos')}
          className="group flex items-center gap-3 text-text-gray hover:text-magical-gold transition-all text-xs font-black uppercase tracking-[0.4em]"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
          Volver
        </button>
      </div>
    </div>

  )
}
