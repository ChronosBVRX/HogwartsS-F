import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Utensils } from 'lucide-react'

export default function Menu() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    const [catsRes, itemsRes] = await Promise.all([
      supabase.from('hsf_menu_categories').select('*').eq('active', true).order('sort_order'),
      supabase.from('hsf_menu_items').select('*').eq('active', true).order('sort_order')
    ])

    if (!catsRes.error) setCategories(catsRes.data)
    if (!itemsRes.error) setItems(itemsRes.data)
    setLoading(false)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center">Cargando Menú...</div>

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-12">
      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold text-magical-gold">Menú Mágico</h1>
        <p className="text-white/60 max-w-lg mx-auto">
          Platillos encantados preparados al momento para satisfacer tu apetito de hechicero.
        </p>
      </header>

      <div className="space-y-16">
        {categories.map(cat => (
          <section key={cat.id} className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
              <h2 className="text-2xl font-bold text-magical-gold px-4 uppercase tracking-widest">
                {cat.name}
              </h2>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.filter(i => i.category_id === cat.id).map(item => (
                <div key={item.id} className="glass-card p-6 flex flex-col justify-between group hover:border-magical-gold/30 transition-all">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-xl font-bold text-white group-hover:text-magical-gold transition-colors">
                        {item.name}
                      </h3>
                      <span className="text-magical-gold font-bold text-lg">${item.price}</span>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  
                  {item.is_featured && (
                    <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-tighter text-magical-gold font-bold bg-magical-gold/10 w-fit px-2 py-0.5 rounded border border-magical-gold/20">
                      Destacado
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
