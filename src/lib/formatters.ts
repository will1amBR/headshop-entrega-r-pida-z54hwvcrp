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
    case 'sedas':
    case 'seddas':
      return 'https://img.usecurling.com/p/600/600?q=smoking%20rolling%20papers%20pack'
    case 'piteiras':
      return 'https://img.usecurling.com/p/600/600?q=glass%20filter%20tips%20pack'
    case 'dichavadores':
      return 'https://img.usecurling.com/p/600/600?q=metal%20herb%20grinder%20product'
    case 'isqueiros-macaricos':
      return 'https://img.usecurling.com/p/600/600?q=butane%20torch%20lighter%20metal'
    case 'bongs-pipes':
    case 'pipes':
      return 'https://img.usecurling.com/p/600/600?q=borosilicate%20glass%20bong%20waterpipe'
    case 'acessorios':
      return 'https://img.usecurling.com/p/600/600?q=metal%20rolling%20tray%20accessories'
    case 'vaporizadores':
      return 'https://img.usecurling.com/p/600/600?q=herb%20vaporizer%20device'
    default:
      return 'https://img.usecurling.com/p/600/600?q=smoking%20accessories%20tray'
  }
}

export function getProductFallbackImage(name: string, categorySlug?: string): string {
  const lower = name.toLowerCase()

  // 1. Sedas e papéis de enrolar (Smoking, RAW, Seda King Size)
  if (
    lower.includes('seda') &&
    !lower.includes('porta beck') &&
    !lower.includes('guarda ocklinas') &&
    !lower.includes('mocó') &&
    !lower.includes('moco') &&
    !lower.includes('pré-bolado') &&
    !lower.includes('pre-bolado') &&
    !lower.includes('preroll') &&
    !lower.includes('cone') &&
    !lower.includes('isqueiro')
  ) {
    if (lower.includes('raw')) {
      return '/products/seda-raw.svg'
    }
    if (lower.includes('deluxe') || lower.includes('smoking') || lower.includes('master')) {
      return '/products/seda-smoking.svg'
    }
    return '/products/seda-generica.svg'
  }

  // 2. Cones, Pré-bolados e Wraps
  if (
    lower.includes('pré-bolado') ||
    lower.includes('pre-bolado') ||
    lower.includes('preroll') ||
    lower.includes('blunt') ||
    lower.includes('wrap') ||
    (lower.includes('cone') &&
      !lower.includes('tubo-cone') &&
      !lower.includes('inflável') &&
      !lower.includes('inflavel'))
  ) {
    return '/products/cones-pre-bolados.svg'
  }

  // 3. Piteiras e Filtros
  if (lower.includes('piteira') || lower.includes('filtro') || lower.includes('filter')) {
    if (
      lower.includes('vidro') ||
      lower.includes('borossilicato') ||
      lower.includes('print') ||
      lower.includes('artística') ||
      lower.includes('artistica')
    ) {
      return '/products/piteira-vidro.svg'
    }
    return '/products/piteira-papel.svg'
  }

  // 4. Dichavadores & Grinders
  if (lower.includes('dichavador') || lower.includes('grinder') || lower.includes('desfiador')) {
    return '/products/dichavador-metal.svg'
  }

  // 5. Isqueiros, Maçaricos e Acessórios de chama
  if (
    lower.includes('maçarico') ||
    lower.includes('macarico') ||
    lower.includes('maçanico') ||
    lower.includes('macanico') ||
    lower.includes('torch')
  ) {
    return '/products/macarico.svg'
  }
  if (lower.includes('isqueiro') || lower.includes('clipper')) {
    return '/products/isqueiro-clipper.svg'
  }

  // 6. Cuias e Slicks
  if (lower.includes('cuia')) {
    return '/products/cuia-silicone.svg'
  }
  if (lower.includes('slick') || lower.includes('reservatório') || lower.includes('reservatorio')) {
    return '/products/slick-silicone.svg'
  }

  // 7. Potes Herméticos
  if (lower.includes('pote') || lower.includes('hermético') || lower.includes('hermetico')) {
    return '/products/pote-hermetico.svg'
  }

  // 8. Porta Beck / Guarda Ocklinas / Mocó / Beck Tube
  if (
    lower.includes('porta beck') ||
    lower.includes('guarda ocklinas') ||
    lower.includes('mocó') ||
    lower.includes('moco') ||
    lower.includes('beck tube')
  ) {
    return '/products/moco-porta-beck.svg'
  }

  // 9. Bandejas e Rolling Trays
  if (
    lower.includes('bandeja') ||
    lower.includes('rolling tray') ||
    lower.includes('tin case') ||
    lower.includes('tin box')
  ) {
    return '/products/bandeja-metal.svg'
  }

  // 10. Cinzeiros
  if (lower.includes('cinzeiro')) {
    return '/products/cinzeiro.svg'
  }

  // 11. Bongs & Pipes
  if (lower.includes('bong') || lower.includes('percobator') || lower.includes('bubbler')) {
    return '/products/bong-vidro.svg'
  }
  if (lower.includes('pipe') || lower.includes('one hitter')) {
    return '/products/pipe-vidro.svg'
  }

  // 12. Tabacos e ervas naturais
  if (
    lower.includes('tabaco') ||
    lower.includes('fumo') ||
    lower.includes('camomila') ||
    lower.includes('kumbaya')
  ) {
    return '/products/tabaco-natural.svg'
  }

  // 13. Ziplocks & Embalagens
  if (lower.includes('ziplock')) {
    return '/products/ziplock-metalizado.svg'
  }

  // 14. Ferramentas e Tesouras
  if (lower.includes('tesoura')) {
    return '/products/tesoura-dobravel.svg'
  }

  return getCategoryFallbackImage(categorySlug || '')
}
