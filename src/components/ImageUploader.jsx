import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, Loader2, Check, X } from 'lucide-react'

export default function ImageUploader({ productId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('idle') // idle, loading, success, error

  const uploadImage = async (event) => {
    try {
      setUploading(true)
      setStatus('loading')

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${productId}-${Math.random()}.${fileExt}`
      const filePath = `products/${fileName}`

      // 1. Subir al Bucket 'menu-images'
      let { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Obtener URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath)

      // 3. Actualizar la tabla hsf_menu_items
      const { error: updateError } = await supabase
        .from('hsf_menu_items')
        .update({ image_url: publicUrl })
        .eq('id', productId)

      if (updateError) throw updateError

      setStatus('success')
      if (onUploadComplete) onUploadComplete(publicUrl)
      
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      console.error('Error subiendo imagen:', error)
      setStatus('error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className={`
        flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all
        ${status === 'idle' ? 'bg-magical-gold/10 hover:bg-magical-gold/20 text-magical-gold border border-magical-gold/20' : ''}
        ${status === 'loading' ? 'bg-white/5 text-white/50 cursor-not-allowed' : ''}
        ${status === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : ''}
        ${status === 'error' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : ''}
      `}>
        {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {status === 'idle' && 'Subir Foto'}
        {status === 'loading' && 'Subiendo...'}
        {status === 'success' && '¡Lista!'}
        {status === 'error' && 'Error'}
        <input
          type="file"
          accept="image/*"
          onChange={uploadImage}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  )
}
