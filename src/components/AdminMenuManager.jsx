import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Wand2, Plus, Edit2, Trash2, Save, X, Eye, EyeOff } from 'lucide-react'

export default function AdminMenuManager() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [editingItem, setEditingItem] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [catRes, itemRes] = await Promise.all([
      supabase.from('hsf_menu_categories').select('id, name, description, sort_order, active').order('sort_order', { ascending: true }),
      supabase.from('hsf_menu_items').select('*, category:hsf_menu_categories(name)').order('sort_order', { ascending: true })
    ])
    if (catRes.data) setCategories(catRes.data)
    if (itemRes.data) setItems(itemRes.data)
    setLoading(false)
  }

  const [uploading, setUploading] = useState(false)

  /**
   * Comprime una imagen a WebP y reduce su tamaño máximo
   */
  const compressImage = async (file, maxSize = 1200, quality = 0.82) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        let { width, height } = img

        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('No se pudo comprimir la imagen'))
              return
            }
            resolve(
              new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.webp'),
                { type: 'image/webp' }
              )
            )
          },
          'image/webp',
          quality
        )
      }
      img.onerror = reject
      img.src = url
    })
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()
    setUploading(true)
    const formData = new FormData(e.target)
    
    let imageUrl = editingItem?.image_url || null
    const imageFile = formData.get('image')

    if (imageFile && imageFile.size > 0) {
      try {
        // Optimización: Comprimir a WebP antes de subir
        const optimizedFile = await compressImage(imageFile)
        const fileName = `item-${Date.now()}.webp`

        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, optimizedFile, {
            contentType: 'image/webp',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      } catch (err) {
        alert("¡Error Mágico! No se pudo subir la imagen. Verifica que el bucket 'menu-images' sea PÚBLICO. Detalles: " + err.message)
        setUploading(false)
        return
      }
    }

    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price')) || 0,
      category_id: formData.get('category_id'),
      is_featured: formData.get('is_featured') === 'on',
      active: formData.get('active') === 'on',
      image_url: imageUrl
    }

    if (editingItem?.id) {
      const { error } = await supabase.from('hsf_menu_items').update(data).eq('id', editingItem.id)
      if (error) alert("Error: " + error.message)
    } else {
      const { error } = await supabase.from('hsf_menu_items').insert([data])
      if (error) alert("Error: " + error.message)
    }

    setIsFormOpen(false)
    setEditingItem(null)
    setPreviewUrl(null)
    setUploading(false)
    fetchData()
  }

  const toggleItemActive = async (id, currentStatus) => {
    await supabase.from('hsf_menu_items').update({ active: !currentStatus }).eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <Wand2 className="w-5 h-5 text-magical-gold" />
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Gestión de Menú</h2>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setPreviewUrl(null); setIsFormOpen(true); }}
          className="px-4 py-2 bg-magical-gold text-magical-navy rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Nuevo Platillo
        </button>
      </div>

      {isFormOpen && (
        <div className="glass-card p-6 border border-magical-gold/30 relative">
          <button onClick={() => { setIsFormOpen(false); setPreviewUrl(null); }} className="absolute top-4 right-4 text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-black italic uppercase text-magical-gold mb-6">
            {editingItem ? 'Editar Platillo' : 'Nuevo Platillo'}
          </h3>
          <form onSubmit={handleSaveItem} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-white/40">Nombre</label>
                <input required name="name" defaultValue={editingItem?.name} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-magical-gold outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-white/40">Precio ($)</label>
                <input required type="number" step="0.01" name="price" defaultValue={editingItem?.price} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-magical-gold outline-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-white/40">Descripción</label>
              <textarea name="description" defaultValue={editingItem?.description} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-magical-gold outline-none" rows="2" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-white/40">Fotografía del Platillo (Opcional)</label>
              <div className="flex flex-col gap-4">
                {(editingItem?.image_url || previewUrl) && (
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                    <img 
                      src={previewUrl || editingItem.image_url} 
                      alt="Preview" 
                      className="w-full h-full object-contain" 
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-[8px] font-black uppercase text-white tracking-widest">Vista Previa</div>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  name="image" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setPreviewUrl(URL.createObjectURL(file));
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-magical-gold file:text-magical-navy hover:file:bg-magical-gold/80" 
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-white/40">Categoría</label>
                 <select required name="category_id" defaultValue={editingItem?.category_id} className="w-full bg-magical-navy border border-white/10 rounded-xl p-3 text-white focus:border-magical-gold outline-none">
                   <option value="">Selecciona una categoría</option>
                   {categories.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                 </select>
               </div>
               
               <div className="flex items-center gap-6 pt-6">
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input type="checkbox" name="active" defaultChecked={editingItem ? editingItem.active : true} className="w-4 h-4 accent-magical-gold" />
                   <span className="text-xs uppercase font-bold text-white/60">Activo (Visible)</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input type="checkbox" name="is_featured" defaultChecked={editingItem?.is_featured} className="w-4 h-4 accent-magical-gold" />
                   <span className="text-xs uppercase font-bold text-magical-gold/60">Premium / Destacado</span>
                 </label>
               </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={uploading} className="px-6 py-3 bg-magical-gold text-magical-navy rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" />
                {uploading ? 'Guardando...' : (editingItem ? 'Guardar Cambios' : 'Crear Platillo')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-5">Platillo</th>
                <th className="px-6 py-5">Categoría</th>
                <th className="px-6 py-5">Precio</th>
                <th className="px-6 py-5">Estado</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-16 text-center text-white/20 uppercase font-black">Cargando menú...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-16 text-center text-white/20 uppercase font-black">Sin platillos</td></tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className={`hover:bg-white/5 transition-colors group ${!item.active ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 flex items-center gap-4">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <Wand2 className="w-5 h-5 text-white/20" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-white uppercase italic text-sm">{item.name}</div>
                        <div className="text-[10px] text-white/40 truncate max-w-[200px]">{item.description}</div>
                        {item.is_featured && <span className="text-[8px] text-magical-gold uppercase tracking-widest border border-magical-gold/20 px-1.5 rounded bg-magical-gold/10 mt-1 inline-block">Premium</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-[10px] uppercase text-white/60 tracking-widest">{item.category?.name}</td>
                    <td className="px-6 py-4 font-black text-lg text-magical-gold">${item.price}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleItemActive(item.id, item.active)} className="flex items-center gap-1 hover:scale-110 transition-transform">
                        {item.active ? (
                           <span className="text-[8px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest border border-green-500/20 text-green-400 bg-green-500/5 flex items-center gap-1"><Eye className="w-3 h-3"/> Visible</span>
                        ) : (
                           <span className="text-[8px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest border border-red-500/20 text-red-400 bg-red-500/5 flex items-center gap-1"><EyeOff className="w-3 h-3"/> Oculto</span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => { setEditingItem(item); setPreviewUrl(null); setIsFormOpen(true); }}
                        className="p-2 bg-white/10 text-white/60 rounded-lg hover:bg-magical-gold hover:text-magical-navy transition-colors inline-flex"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
