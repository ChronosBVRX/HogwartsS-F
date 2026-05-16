import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { withTimeout } from '../lib/supabaseSafe'
import { formatMagicalText } from '../utils/magicalFormatters'
import AdventurePoster from './AdventurePoster'
import { QrCode, Printer, RefreshCw, CheckCircle2, Map, AlertCircle, Compass } from 'lucide-react'

export default function AdminAdventureManager() {
  const [zones, setZones] = useState([])
  const [adventures, setAdventures] = useState([])
  const [runs, setRuns] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    try {
      const [zonesRes, adventuresRes, runsRes] = await Promise.all([
        withTimeout(
          supabase.from('hsf_active_adventure_zones').select('*'),
          8000,
          'Cargando zonas de aventura'
        ),
        withTimeout(
          supabase
            .from('hsf_adventures')
            .select('*, steps:hsf_adventure_steps(id)')
            .order('created_at', { ascending: true }),
          8000,
          'Cargando aventuras'
        ),
        withTimeout(
          supabase
            .from('hsf_adventure_runs')
            .select(`
              id, customer_id, current_step_order, status, started_at, completed_at, failed_attempts,
              adventure:hsf_adventures!hsf_adventure_runs_adventure_id_fkey(title, slug)
            `)
            .order('created_at', { ascending: false })
            .limit(100),
          8000,
          'Cargando carreras de aventura'
        )
      ])

      if (zonesRes.error) throw zonesRes.error
      if (adventuresRes.error) throw adventuresRes.error
      if (runsRes.error) throw runsRes.error

      setZones(zonesRes.data || [])

      if (!selectedZone && zonesRes.data?.length) {
        setSelectedZone(zonesRes.data[0])
      }

      setAdventures(adventuresRes.data || [])

      let finalRuns = runsRes.data || []
      if (finalRuns.length > 0) {
        const customerIds = [...new Set(finalRuns.map(r => r.customer_id).filter(Boolean))]
        if (customerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('hsf_profiles')
            .select('user_id, display_name, phone')
            .in('user_id', customerIds)
          
          if (profilesData) {
            const profileMap = Object.fromEntries(profilesData.map(p => [p.user_id, p]))
            finalRuns = finalRuns.map(r => ({
              ...r,
              customer: profileMap[r.customer_id] || null
            }))
          }
        }
      }

      setRuns(finalRuns)
    } catch (err) {
      console.error('[ADMIN ADVENTURE FETCH ERROR]', err)
      setMessage('No se pudieron cargar las aventuras. Revisa permisos, vistas o RPC en Supabase.')
    } finally {
      setLoading(false)
    }
  }

  const regenerateZone = async (zoneId) => {
    if (!confirm('Esto cambiará el QR de la zona. Tendrás que imprimir el póster nuevo. ¿Continuar?')) return

    const { data, error } = await supabase.rpc('hsf_admin_regenerate_zone_qr', {
      p_zone_id: zoneId
    })

    if (error || !data?.ok) {
      alert(error?.message || data?.message || 'No se pudo regenerar el QR.')
      return
    }

    setMessage('QR regenerado. Imprime nuevamente el póster de esa zona.')
    fetchData()
  }

  const handleRunAction = async (runId, action) => {
    const actionText = action === 'close' ? 'cerrar (abandonar)' : 'reiniciar desde el paso 1';
    if (!confirm(`¿Estás seguro de que deseas ${actionText} esta aventura?`)) return;

    try {
      const { data, error } = await supabase.rpc('hsf_admin_update_run_status', {
        p_run_id: runId,
        p_action: action
      });

      if (error || !data?.ok) {
        alert(error?.message || data?.message || 'No se pudo realizar la acción.');
        return;
      }

      setMessage(data.message);
      fetchData();
    } catch (err) {
      console.error('[ADMIN RUN ACTION ERROR]', err);
      alert('Error ejecutando la acción.');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {message && (
        <div className="bg-green-400/10 border border-green-400/20 text-green-400 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <p className="text-xs font-black uppercase tracking-widest">{message}</p>
        </div>
      )}

      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <QrCode className="w-5 h-5 text-magical-gold" />
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Pósters QR por zona</h2>
        </div>

        {loading ? (
          <div className="p-16 text-center text-white/20 uppercase font-black tracking-widest">
            Cargando aventuras...
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-[340px_1fr] gap-6 items-start">
            {/* Zone Selector */}
            <div className="w-full flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`shrink-0 lg:shrink lg:w-full text-left p-4 rounded-2xl border transition-all min-w-[200px] lg:min-w-0 ${
                    selectedZone?.id === zone.id
                      ? 'bg-magical-gold text-magical-navy border-magical-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                      : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <p className="font-black uppercase italic text-sm">{formatMagicalText(zone.name)}</p>
                  <p className="text-[9px] uppercase font-bold opacity-60">Piso {zone.floor_number || '-'}</p>
                </button>
              ))}
            </div>

            {/* Preview and Actions */}
            <div className="w-full space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) {
                      alert('Por favor, permite las ventanas emergentes para generar el PDF.');
                      return;
                    }
                    const posterHtml = document.querySelector('.adventure-poster-root').outerHTML;
                    const styles = document.head.innerHTML;
                    
                    printWindow.document.write(`
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          ${styles}
                          <style>
                            body { margin: 0; padding: 0; background: #0a0e1a !important; }
                            .adventure-poster-root { 
                              width: 8.5in !important; 
                              height: 11in !important; 
                              border-radius: 0 !important;
                              margin: 0 !important;
                              position: relative !important;
                              display: flex !important;
                              visibility: visible !important;
                              -webkit-print-color-adjust: exact !important;
                              print-color-adjust: exact !important;
                            }
                            @media print {
                              @page { size: letter; margin: 0; }
                            }
                          </style>
                        </head>
                        <body>${posterHtml}</body>
                      </html>
                    `);
                    
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                      printWindow.print();
                      setTimeout(() => printWindow.close(), 1000);
                    }, 1500);
                  }}
                  className="btn-gold flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Guardar PDF
                </button>

                {selectedZone && (
                  <button
                    onClick={() => regenerateZone(selectedZone.id)}
                    className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white/50 hover:text-white hover:bg-white/10 text-xs font-black uppercase flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerar QR
                  </button>
                )}
              </div>

              {/* Poster Preview Container */}
              <div className="relative overflow-hidden bg-black/40 p-4 sm:p-8 rounded-[2.5rem] border border-white/10 flex justify-center min-h-[400px]">
                <div className="origin-top scale-[0.35] sm:scale-[0.5] md:scale-[0.6] lg:scale-[0.7] w-[8.5in] transition-transform duration-500">
                  <AdventurePoster zone={selectedZone} />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <Compass className="w-5 h-5 text-magical-gold" />
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Progreso de Aventuras de Usuarios</h2>
        </div>

        <div className="glass-card overflow-hidden border border-white/10">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-6 py-5">Mago / Estudiante</th>
                  <th className="px-6 py-5">Aventura</th>
                  <th className="px-6 py-5">Avance</th>
                  <th className="px-6 py-5">Intentos Fallidos</th>
                  <th className="px-6 py-5">Fecha de Inicio</th>
                  <th className="px-6 py-5">Estado</th>
                  <th className="px-6 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {runs.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-16 text-center text-white/20 uppercase font-black tracking-widest">Sin registros de aventuras iniciadas</td></tr>
                ) : runs.map((run) => (
                  <tr key={run.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-black text-white uppercase italic text-xs">{run.customer?.display_name || 'Desconocido'}</div>
                      <div className="text-[9px] text-white/30">{run.customer?.phone || 'Sin teléfono'}</div>
                    </td>
                    <td className="px-6 py-5 font-black text-magical-gold uppercase italic text-xs">{formatMagicalText(run.adventure?.title || 'Aventura Mágica')}</td>
                    <td className="px-6 py-5 text-white/80 font-bold text-xs">Paso {run.current_step_order}</td>
                    <td className="px-6 py-5 text-white/60 text-xs">{run.failed_attempts || 0}</td>
                    <td className="px-6 py-5 text-white/40 text-[10px]">{new Date(run.started_at).toLocaleDateString()}</td>
                    <td className="px-6 py-5">
                      <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest border ${
                        run.status === 'completed'
                          ? 'border-green-500/20 text-green-400 bg-green-500/5'
                          : run.status === 'active'
                          ? 'border-blue-500/20 text-blue-400 bg-blue-500/5'
                          : 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5'
                      }`}>
                        {run.status === 'completed' ? 'Completada' : run.status === 'active' ? 'Activa' : 'No completada'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right space-x-2 whitespace-nowrap">
                      {run.status === 'active' && (
                        <button
                          onClick={() => handleRunAction(run.id, 'close')}
                          className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-[10px] font-black uppercase transition-colors mr-2"
                        >
                          Cerrar
                        </button>
                      )}
                      <button
                        onClick={() => handleRunAction(run.id, 'restart')}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 rounded-xl text-[10px] font-black uppercase transition-colors"
                      >
                        Reiniciar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <Map className="w-5 h-5 text-magical-gold" />
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Aventuras cargadas</h2>
        </div>

        <div className="glass-card overflow-hidden border border-white/10">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead className="bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-6 py-5">Aventura</th>
                  <th className="px-6 py-5">Pasos</th>
                  <th className="px-6 py-5">Recompensa</th>
                  <th className="px-6 py-5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {adventures.map((adv) => (
                  <tr key={adv.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-black text-white uppercase italic">{formatMagicalText(adv.title)}</p>
                      <p className="text-[10px] text-white/30">{adv.slug}</p>
                    </td>
                    <td className="px-6 py-5 text-magical-gold font-black">{adv.steps?.length || 0}</td>
                    <td className="px-6 py-5 text-white/60 text-xs">{formatMagicalText(adv.reward_title)}</td>
                    <td className="px-6 py-5">
                      <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest border ${
                        adv.active
                          ? 'border-green-500/20 text-green-400 bg-green-500/5'
                          : 'border-red-500/20 text-red-400 bg-red-500/5'
                      }`}>
                        {adv.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

