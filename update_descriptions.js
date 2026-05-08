import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://nyfokfwghqvitfmbhkgc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Zm9rZndnaHF2aXRmbWJoa2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMjM3ODYsImV4cCI6MjA5Mjg5OTc4Nn0.t2C7sJAMC-P9g6d_h8t6HPkvoQd4w0mE7pVMtJCXgPg'
)

const updates = [
  { name: 'Hamburguesa Centauro Doble', desc: 'Doble carne de res premium, queso cheddar fundido como oro de Gringotts y el toque secreto de la casa.' },
  { name: 'Hamburguesa Centauro Clásica', desc: 'La clásica del Gran Comedor. Carne jugosa, vegetales frescos del huerto de Hagrid y nuestra salsa especial.' },
  { name: 'Hamburguesa Triple Trol', desc: 'Un festín para valientes. Triple carne, capas de queso y tocino crujiente. ¡Ni un trol podría con ella!' },
  { name: 'Hamburguesa Alohomora', desc: 'Carne de res seleccionada con piña caramelizada y jamón. Un viaje tropical desde el Expreso de Hogwarts.' },
  { name: 'Hamburguesa Carne de Dragón', desc: 'Picante y poderosa. Carne de res con chiles toreados y aderezo chipotle. Forjada en el aliento de un Colacuerno.' },
  { name: 'Alitas Fénix 6 pzs', desc: '6 piezas de alitas crujientes bañadas en salsas que arden con la intensidad de un fénix renaciendo.' },
  { name: 'Alitas Fénix 12 pzs', desc: '12 piezas de alitas crujientes bañadas en salsas que arden con la intensidad de un fénix renaciendo.' },
  { name: 'Alitas Fénix 18 pzs', desc: '18 piezas de alitas crujientes bañadas en salsas que arden con la intensidad de un fénix renaciendo.' },
  { name: 'Boneless Hipogrifo 175gr', desc: 'Trozos de pechuga de pollo premium (175gr), empanizados con una receta secreta de los elfos domésticos.' },
  { name: 'Boneless Hipogrifo 350gr', desc: 'Trozos de pechuga de pollo premium (350gr), empanizados con una receta secreta de los elfos domésticos.' },
  { name: 'Boneless Hipogrifo 500gr', desc: 'Trozos de pechuga de pollo premium (500gr), empanizados con una receta secreta de los elfos domésticos.' },
  { name: 'Dedos de Queso', desc: 'Crujientes por fuera y con un corazón de queso tan elástico como un encantamiento de extensión.' },
  { name: 'Papas Colacuerno', desc: 'Papas fritas bañadas en una mezcla de quesos y especias que te harán ver estrellas en el techo del Gran Comedor.' },
  { name: 'Nuguets de Hipogrifo', desc: 'Bocados de pollo crujientes, ideales para compartir mientras esperas los resultados del Torneo de los Tres Magos.' },
  { name: 'HotDog Clásico', desc: 'Salchicha de pavo jumbo, pan artesanal y los complementos clásicos que nunca fallan.' },
  { name: 'HotDog Salchichón', desc: 'Para los de apetito voraz. Salchicha de alta calidad con el toque premium de la cocina de Hogwarts.' },
  { name: 'Cold Brew', desc: 'Café extraído lentamente en frío durante 12 horas, más fuerte que un hechizo de vigilancia.' }
]

async function runUpdates() {
  console.log('🪄 Iniciando encantamiento de descripciones...')
  
  for (const item of updates) {
    const { error } = await supabase
      .from('hsf_menu_items')
      .update({ description: item.desc })
      .eq('name', item.name)
    
    if (error) {
      console.error(`❌ Error en ${item.name}:`, error.message)
    } else {
      console.log(`✅ Actualizado: ${item.name}`)
    }
  }
  
  console.log('✨ ¡Encantamiento completado!')
}

runUpdates()
