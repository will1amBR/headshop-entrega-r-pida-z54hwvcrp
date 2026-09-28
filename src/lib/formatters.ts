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
  if (
    lower.includes('vaporizador') ||
    lower.includes('slim') ||
    lower.includes('pen') ||
    lower.includes('bocal')
  ) {
    if (lower.includes('convecção') || lower.includes('storm')) {
      return 'https://img.usecurling.com/p/600/600?q=vaporizer%20oled%20black'
    }
    if (lower.includes('wax') || lower.includes('dab')) {
      return 'https://img.usecurling.com/p/600/600?q=vape%20pen%20concentrate'
    }
    return 'https://img.usecurling.com/p/600/600?q=vape%20device%20black'
  }
  if (
    lower.includes('seda') ||
    lower.includes('hemp') ||
    lower.includes('brown') ||
    lower.includes('piteira') ||
    lower.includes('livreto')
  ) {
    if (lower.includes('vidro')) {
      return 'https://img.usecurling.com/p/600/600?q=glass%20filter%20tip'
    }
    return 'https://img.usecurling.com/p/600/600?q=rolling%20paper%20leaves'
  }
  if (lower.includes('maçarico') || lower.includes('torch')) {
    return 'https://img.usecurling.com/p/600/600?q=butane%20torch%20metal'
  }
  if (lower.includes('dabber') || lower.includes('case')) {
    return 'https://img.usecurling.com/p/600/600?q=stainless%20tool%20kit'
  }
  if (lower.includes('hermético') || lower.includes('pote') || lower.includes('antiodor')) {
    return 'https://img.usecurling.com/p/600/600?q=black%20glass%20jar'
  }
  if (lower.includes('tapete') || lower.includes('silicone') || lower.includes('mat')) {
    return 'https://img.usecurling.com/p/600/600?q=silicone%20black%20mat'
  }
  if (lower.includes('dichavador') || lower.includes('grinder')) {
    return 'https://img.usecurling.com/p/600/600?q=metal%20herb%20grinder'
  }
  if (lower.includes('bandeja')) {
    return 'https://img.usecurling.com/p/600/600?q=metal%20tray%20black'
  }
  if (lower.includes('bong') || lower.includes('bubbler')) {
    if (lower.includes('beaker') || lower.includes('ice')) {
      return 'https://img.usecurling.com/p/600/600?q=glass%20water%20pipe'
    }
    return 'https://img.usecurling.com/p/600/600?q=glass%20bong%20bubbler'
  }
  if (lower.includes('pipe') || lower.includes('one hitter')) {
    return 'https://img.usecurling.com/p/600/600?q=glass%20smoking%20pipe'
  }
  return getCategoryFallbackImage(categorySlug || '')
}
