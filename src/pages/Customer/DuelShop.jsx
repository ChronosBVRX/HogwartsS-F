import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { ShoppingBag, Star, Zap, Wand2, Box, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DuelShop() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [duelProfile, setDuelProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [profile])

  const fetchData = async () => {
    if (!profile) return
    const [itemsRes, profileRes] = await Promise.all([
      supabase.from('hsf_duel_items').select('*').eq('is_active', true).order('category'),
      supabase.from('hsf_duel_profiles').select('*').eq('user_id', profile.user_id).maybeSingle()
    ])

    if (itemsRes.data) setItems(itemsRes.data)
    if (profileRes.data) setDuelProfile(profileRes.data)
    setLoading(false)
  }

  const handlePurchase = async (item) => {
    if (!profile || !duelProfile) return
    
    // Validate funds
    const canAffordGalleons = item.price_galleons > 0 && profile.loyalty_points >= item.price_galleons
    const canAffordShards = item.price_shards > 0 && duelProfile.duel_shards >= item.price_shards

    if (!canAffordGalleons && !canAffordShards) {
      alert('No tienes suficientes fondos (Galeones o Fragmentos)')
      return
    }

    setPurchasing(item.item_key)
    
    // Purchase Logic (Inventory + Deducting funds)
    const { error: invError } = await supabase.from('hsf_duel_inventory').insert({
      user_id: profile.user_id,
      item_key: item.item_key
    })

    if (invError) {
      if (invError.code === '23505') alert('Ya posees este objeto')
      else alert('Error en la compra')
      setPurchasing(null)
      return
    }

    // Deduct funds (Simplified update)
    if (item.price_shards > 0) {
      await supabase.from('hsf_duel_profiles').update({
        duel_shards: duelProfile.duel_shards - item.price_shards
      }).eq('user_id', profile.user_id)
    } else if (item.price_galleons > 0) {
      await supabase.from('hsf_profiles').update({
        loyalty_points: profile.loyalty_points - item.price_galleons
      }).eq('user_id', profile.user_id)
    }

    alert(`¡Has adquirido ${item.name}!`)
    fetchData()
    setPurchasing(null)
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 pb-24 space-y-8 animate-in fade-in duration-700">
      <header className="relative h-48 md:h-64 rounded-[2.5rem] overflow-hidden flex items-center justify-between px-8 md:px-12 bg-magical-navy border border-white/10">
        <div className="relative z-10 space-y-2">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
            Tienda de <span className="text-magical-gold">Duelos</span>
          </h1>
          <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Equípate para la gloria</p>
        </div>
        <div className="hidden md:flex gap-4 relative z-10">
           <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-center">
             <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Tus Galeones</p>
             <p className="text-xl font-black text-magical-gold">{profile?.loyalty_points || 0} ✨</p>
           </div>
           <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-center">
             <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Tus Fragmentos</p>
             <p className="text-xl font-black text-blue-400">{duelProfile?.duel_shards || 0} 💠</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="glass-card group p-6 space-y-4 border-white/5 hover:border-magical-gold/30 transition-all">
            <div className="h-40 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-magical-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               {item.category === 'wand' && <Wand2 className="w-16 h-16 text-magical-gold/40 group-hover:scale-110 transition-transform" />}
               {item.category === 'utility' && <Zap className="w-16 h-16 text-blue-400/40 group-hover:scale-110 transition-transform" />}
               {item.category === 'title' && <Star className="w-16 h-16 text-emerald-400/40 group-hover:scale-110 transition-transform" />}
               <span className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full text-white/40">{item.category}</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{item.name}</h3>
              <p className="text-xs text-white/50 leading-relaxed italic">“{item.description}”</p>
            </div>

            <div className="pt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {item.price_galleons > 0 && (
                   <span className="text-lg font-black text-magical-gold">{item.price_galleons} ✨</span>
                )}
                {item.price_shards > 0 && (
                   <span className="text-lg font-black text-blue-400">{item.price_shards} 💠</span>
                )}
              </div>
              <button 
                onClick={() => handlePurchase(item)}
                disabled={purchasing === item.item_key}
                className="btn-gold px-6 py-3 text-[10px] font-black uppercase rounded-xl shadow-lg hover:scale-105 transition-all"
              >
                {purchasing === item.item_key ? 'Procesando...' : 'Adquirir'}
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <p className="text-white/30 font-black uppercase tracking-widest text-xs">La tienda de Ollivanders está cerrada por ahora</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => navigate('/duelos')}
        className="flex items-center justify-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
      >
        <ChevronLeft className="w-4 h-4" />
        Regresar
      </button>
    </div>
  )
}
