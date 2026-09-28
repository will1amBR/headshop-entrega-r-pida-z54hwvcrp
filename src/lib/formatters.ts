export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDateTime(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch (_) {
    return dateStr
  }
}

export function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch (_) {
    return dateStr
  }
}

export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function getFileUrl(
  collectionIdOrName: string,
  recordId: string,
  filename?: string,
): string {
  if (!filename) return ''
  const baseUrl = (import.meta.env.VITE_POCKETBASE_URL || '').replace(/\/$/, '')
  return `${baseUrl}/api/files/${collectionIdOrName}/${recordId}/${filename}`
}

export function getCategoryFallbackImage(slug: string): string {
  switch (slug) {
    case 'vaporizadores':
      return 'https://img.usecurling.com/p/600/600?q=vaporizer%20device'
    case 'seddas':
      return 'https://img.usecurling.com/p/600/600?q=rolling%20paper%20hemp'
    case 'acessorios':
      return 'https://img.usecurling.com/p/600/600?q=herb%20grinder%20metal'
    case 'pipes':
      return 'https://img.usecurling.com/p/600/600?q=glass%20pipe%20craft'
    default:
      return 'https://img.usecurling.com/p/600/600?q=smoke%20accessories'
  }
}

export function getProductFallbackImage(name: string, categorySlug?: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('vaporizador') || lower.includes('slim') || lower.includes('pen')) {
    return 'https://img.usecurling.com/p/600/600?q=vape%20device%20black'
  }
  if (lower.includes('seda') || lower.includes('hemp') || lower.includes('brown')) {
    return 'https://img.usecurling.com/p/600/600?q=rolling%20paper%20leaves'
  }
  if (lower.includes('dichavador') || lower.includes('grinder')) {
    return 'https://img.usecurling.com/p/600/600?q=metal%20herb%20grinder'
  }
  if (lower.includes('bandeja')) {
    return 'https://img.usecurling.com/p/600/600?q=metal%20tray%20black'
  }
  if (lower.includes('pipe') || lower.includes('vidro') || lower.includes('bong')) {
    return 'https://img.usecurling.com/p/600/600?q=glass%20smoking%20pipe'
  }
  return getCategoryFallbackImage(categorySlug || '')
}
