const DEFAULT_TTL = 1000 * 60 * 10 // 10 minutos

/**
 * Obtiene datos del caché local (localStorage)
 * @param {string} key - Clave única para la consulta
 * @param {number} ttl - Tiempo de vida en milisegundos
 * @returns {object|null} - Objeto con {data, expired} o null
 */
export function getCachedQuery(key, ttl = DEFAULT_TTL) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const expired = Date.now() - parsed.savedAt > ttl

    return {
      data: parsed.data,
      expired
    }
  } catch (err) {
    console.warn('[CACHE GET ERROR]', err)
    return null
  }
}

/**
 * Guarda datos en el caché local
 * @param {string} key 
 * @param {any} data 
 */
export function setCachedQuery(key, data) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        savedAt: Date.now(),
        data
      })
    )
  } catch (err) {
    console.warn('[CACHE SET ERROR]', err)
  }
}

/**
 * Limpia una entrada específica del caché
 * @param {string} key 
 */
export function invalidateCache(key) {
  try {
    localStorage.removeItem(key)
  } catch (err) {}
}
