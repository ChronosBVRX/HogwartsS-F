import { withTimeout } from '../lib/supabaseSafe'
import { formatMagicalText } from '../utils/magicalFormatters'
import { Swords, Trophy, ShoppingBag, Trash2, Edit3, Plus, Search, Check, X } from 'lucide-react'

export default function AdminDuelManager() {
  const [items, setItems] = useState([])
  const [activeDuels, setActiveDuels] = useState([])
  const [housePoints, setHousePoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState('items')

  useEffect(() => {
    fetchDuelData()
  }, [activeSubTab])

  const fetchDuelData = async () => {
    setLoading(true)
    try {
      if (activeSubTab === 'items') {
        const { data } = await withTimeout(
          supabase.from('hsf_duel_items').select('*').order('created_at', { ascending: false }),
          8000,
          'Cargando tienda'
        )
        if (data) setItems(data)
      } else if (activeSubTab === 'active') {
        const { data } = await withTimeout(
          supabase.from('hsf_duels').select('*').neq('status', 'finished').order('updated_at', { ascending: false }).limit(20),
          8000,
          'Cargando duelos'
        )
        if (data) setActiveDuels(data)
      } else if (activeSubTab === 'ranking') {
        const monthKey = new Date().toISOString().substring(0, 7)
        const { data } = await withTimeout(
          supabase.from('hsf_duel_house_points').select('*').eq('month_key', monthKey).order('points', { ascending: false }),
          8000,
          'Cargando ranking'
        )
        if (data) setHousePoints(data)
      }
    } catch (err) {
      console.error('[ADMIN DUEL FETCH ERROR]', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleItemActive = async (itemId, currentState) => {
    await supabase.from('hsf_duel_items').update({ is_active: !currentState }).eq('id', itemId)
    fetchDuelData()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Sub Tabs */}
      <div className="flex gap-4 border-b border-white/5 pb-4">
        {[
          { id: 'items', label: 'Tienda (Items)', icon: <ShoppingBag className="w-4 h-4" /> },
          { id: 'active', label: 'Duelos Activos', icon: <Swords className="w-4 h-4" /> },
          { id: 'ranking', label: 'Ranking Casas', icon: <Trophy className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeSubTab === tab.id ? 'bg-magical-gold/20 text-magical-gold border border-magical-gold/30' : 'text-white/40 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'items' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Gestión de la Tienda</h2>
            <button className="btn-gold px-4 py-2 text-[10px] font-black uppercase flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nuevo Item
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Precio (✨/💠)</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm">{item.name}</div>
                      <div className="text-[10px] text-white/30 truncate max-w-xs">{item.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/40 bg-white/5 px-2 py-1 rounded-md">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 font-black">
                      <span className="text-magical-gold">{item.price_galleons} ✨</span>
                      <span className="mx-2 text-white/20">/</span>
                      <span className="text-blue-400">{item.price_shards} 💠</span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleItemActive(item.id, item.is_active)}
                        className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${item.is_active ? 'border-green-500/20 text-green-400 bg-green-500/5' : 'border-red-500/20 text-red-400 bg-red-500/5'}`}
                      >
                        {item.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Edit3 className="w-4 h-4 text-white/40" /></button>
                        <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-400/40" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'active' && (
        <div className="grid md:grid-cols-2 gap-4">
          {activeDuels.map(duel => (
            <div key={duel.id} className="glass-card p-4 flex justify-between items-center border-white/5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">{formatMagicalText(duel.player_one_name)}</span>
                  <span className="text-[10px] text-white/20 italic">vs</span>
                  <span className="text-xs font-black text-white">{formatMagicalText(duel.player_two_name)}</span>
                </div>
                <div className="text-[8px] font-black uppercase tracking-widest text-magical-gold">Turno {duel.turn_number} • {duel.status}</div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/30 font-mono">{duel.id.substring(0, 8)}</p>
                <p className="text-[8px] text-white/20">{new Date(duel.updated_at).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          {activeDuels.length === 0 && <p className="col-span-full py-20 text-center text-white/20 uppercase font-black text-xs">No hay duelos activos en este momento</p>}
        </div>
      )}

      {activeSubTab === 'ranking' && (
        <div className="glass-card p-8 space-y-6">
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Puntos de Copa Mensual</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['red', 'green', 'blue', 'yellow'].map(slug => {
              const pts = housePoints.find(p => p.house_slug === slug)?.points || 0
              return (
                <div key={slug} className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center space-y-2">
                  <div className="text-2xl">{slug === 'red' ? '🦁' : slug === 'green' ? '🐍' : slug === 'blue' ? '🦅' : '🦡'}</div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                     {slug === 'red' ? 'Gryffindor' : slug === 'green' ? 'Slytherin' : slug === 'blue' ? 'Ravenclaw' : 'Hufflepuff'}
                  </p>
                  <p className="text-3xl font-black text-white">{pts}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
