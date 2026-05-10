import { QRCodeSVG } from 'qrcode.react'
import { Wand2 } from 'lucide-react'

export default function AdventurePoster({ zone }) {
  if (!zone) return null

  const qrUrl = `${window.location.origin}/#/aventura/escanear?zone=${zone.slug}&token=${zone.qr_token}`

  return (
    <div className="adventure-poster-root bg-[#0a0e1a] text-white relative overflow-hidden">
      <style>{`
        /* Reset and Base Styles */
        .adventure-poster-root {
          width: 8.5in;
          height: 11in;
          padding: 0.75in;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background-color: #0a0e1a !important;
          border-radius: 24px;
          box-sizing: border-box;
          font-family: inherit;
        }

        @media screen {
          .adventure-poster-root {
            background: radial-gradient(circle at top, rgba(212,175,55,0.16), transparent 35%),
                        linear-gradient(135deg, #0a0e1a 0%, #101a2f 45%, #05070d 100%);
          }
        }

        @media print {
          /* Force page settings */
          @page {
            size: letter;
            margin: 0mm;
          }

          /* Hide absolutely everything */
          html, body, #root, #root > * {
            visibility: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            background: white !important;
          }

          /* Show only the poster */
          .adventure-poster-root {
            visibility: visible !important;
            display: flex !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 8.5in !important;
            height: 11in !important;
            margin: 0 !important;
            padding: 0.75in !important;
            border-radius: 0 !important;
            background-color: #0a0e1a !important;
            z-index: 99999999 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Force child visibility */
          .adventure-poster-root * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Specific SVG handling */
          .adventure-poster-root svg {
            display: block !important;
            width: 280px !important;
            height: 280px !important;
          }
        }
      `}</style>

      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 text-center flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full border border-yellow-500/30 bg-yellow-500/10 flex items-center justify-center">
          <Wand2 className="w-10 h-10 text-yellow-400" />
        </div>

        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.5em] text-yellow-300 font-black">
            Hogwarts Snacks & Foods
          </p>
          <h1 className="text-5xl md:text-6xl font-black uppercase italic leading-none tracking-tighter text-white">
            Aventura<br />
            <span className="text-yellow-300">Mágica</span>
          </h1>
        </div>
      </div>

      <div className="relative z-10 bg-white/5 border border-white/10 rounded-[2.5rem] p-10 text-center flex flex-col items-center gap-8">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-black">
            Sello de zona
          </p>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-yellow-300">
            {zone.poster_title || zone.name}
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-md mx-auto">
            {zone.poster_subtitle || 'Escanea desde tu perfil para continuar la misión.'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-center">
          <QRCodeSVG value={qrUrl} size={280} level="H" includeMargin={true} />
        </div>

        <p className="text-white/40 text-xs leading-relaxed max-w-sm mx-auto">
          Abre tu perfil, toca “Aventura Mágica” y escanea este código para desbloquear el siguiente acertijo.
        </p>
      </div>

      <div className="relative z-10 text-center flex flex-col items-center gap-2">
        <p className="text-yellow-300 font-black uppercase tracking-[0.4em] text-[10px]">
          Explora · Resuelve · Gana
        </p>
        <p className="text-white/10 text-[9px] font-mono tracking-widest uppercase">
          Ref: {zone.slug?.toUpperCase()}
        </p>
      </div>
    </div>
  )
}
