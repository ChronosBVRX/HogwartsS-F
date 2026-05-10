import { QRCodeSVG } from 'qrcode.react'
import { Wand2 } from 'lucide-react'

export default function AdventurePoster({ zone }) {
  if (!zone) return null

  const qrUrl = `${window.location.origin}/#/aventura/escanear?zone=${zone.slug}&token=${zone.qr_token}`

  return (
    <div className="poster-letter bg-[#0a0e1a] text-white relative overflow-hidden">
      <style>{`
        .poster-letter {
          width: 8.5in;
          min-height: 11in;
          padding: 0.55in;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-radius: 24px;
          background:
            radial-gradient(circle at top, rgba(212,175,55,0.16), transparent 35%),
            linear-gradient(135deg, #0a0e1a 0%, #101a2f 45%, #05070d 100%);
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          .poster-letter,
          .poster-letter * {
            visibility: visible !important;
          }

          .poster-letter {
            position: fixed !important;
            inset: 0 !important;
            width: 8.5in !important;
            height: 11in !important;
            min-height: 11in !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          @page {
            size: letter;
            margin: 0;
          }
        }
      `}</style>

      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full border border-yellow-500/30 bg-yellow-500/10 flex items-center justify-center">
          <Wand2 className="w-10 h-10 text-yellow-400" />
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.45em] text-yellow-300 font-black">
            Hogwarts Snacks & Foods
          </p>
          <h1 className="text-6xl font-black uppercase italic leading-none tracking-tighter text-white">
            Aventura<br />
            <span className="text-yellow-300">Mágica</span>
          </h1>
        </div>
      </div>

      <div className="relative z-10 bg-white/5 border border-white/10 rounded-[2rem] p-8 text-center space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-white/45 font-black">
            Sello de zona
          </p>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-yellow-300">
            {zone.poster_title || zone.name}
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            {zone.poster_subtitle || 'Escanea desde tu perfil para continuar la misión.'}
          </p>
        </div>

        <div className="mx-auto bg-white p-6 rounded-[2rem] w-fit shadow-2xl">
          <QRCodeSVG value={qrUrl} size={285} level="H" includeMargin />
        </div>

        <p className="text-white/50 text-sm leading-relaxed">
          Abre tu perfil, toca “Aventura Mágica” y escanea este código. Si este es el portal correcto, el siguiente acertijo aparecerá en tu celular.
        </p>
      </div>

      <div className="relative z-10 text-center space-y-2">
        <p className="text-yellow-300 font-black uppercase tracking-[0.3em] text-xs">
          Recorre las zonas · Resuelve acertijos · Reclama recompensa
        </p>
        <p className="text-white/35 text-xs">
          Código único de zona: {zone.slug}
        </p>
      </div>
    </div>
  )
}
