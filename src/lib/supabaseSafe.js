export async function withTimeout(promise, ms = 8000, label = 'Consulta') {
  let timeoutId

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} tardó demasiado en responder.`))
    }, ms)
  })

  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timeoutId)
  }
}

export function getReadableSupabaseError(error, fallback = 'No se pudo completar la consulta.') {
  if (!error) return fallback
  return error.message || error.details || error.hint || fallback
}
