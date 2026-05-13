export function publicAsset(path) {
  const cleanPath = String(path || '').replace(/^\/+/, '')
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${cleanPath}`.replace(/\/{2,}/g, '/')
}
