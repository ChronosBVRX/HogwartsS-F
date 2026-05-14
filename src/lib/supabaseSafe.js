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

/**
 * Versión segura que no lanza excepciones, ideal para Promise.all
 */
export async function safeWithTimeout(promise, ms = 8000, label = 'Consulta') {
  try {
    const result = await withTimeout(promise, ms, label)
    return { data: result.data || result, error: result.error || null }
  } catch (err) {
    return { data: null, error: err }
  }
}

export function getReadableSupabaseError(error, fallback = 'No se pudo completar la consulta.') {
  if (!error) return fallback
  return error.message || error.details || error.hint || fallback
}
