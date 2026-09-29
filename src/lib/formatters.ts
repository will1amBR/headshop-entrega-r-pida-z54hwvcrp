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
      return 'https://img.usecurling.com/p/600/600?q=rolling%20paper%20leaves'
    case 'piteiras':
      return 'https://img.usecurling.com/p/600/600?q=glass%20filter%20tip'
    case 'dichavadores':
      return 'https://img.usecurling.com/p/600/600?q=metal%20herb%20grinder'
    case 'isqueiros-macaricos':
      return 'https://img.usecurling.com/p/600/600?q=butane%20torch%20lighter'
    case 'bongs-pipes':
    case 'pipes':
      return 'https://img.usecurling.com/p/600/600?q=glass%20water%20pipe'
    case 'acessorios':
      return 'https://img.usecurling.com/p/600/600?q=smoke%20tray%20accessories'
    case 'vaporizadores':
      return 'https://img.usecurling.com/p/600/600?q=vaporizer%20device'
    default:
      return 'https://img.usecurling.com/p/600/600?q=smoke%20accessories'
  }
}

export function getProductFallbackImage(name: string, categorySlug?: string): string {
  const lower = name.toLowerCase()

  // 1. Sedas e papéis
  if (
    lower.includes('seda') &&
    !lower.includes('porta beck') &&
    !lower.includes('guarda ocklinas') &&
    !lower.includes('pré-bolado') &&
    !lower.includes('pre-bolado') &&
    !lower.includes('preroll')
  ) {
    if (lower.includes('marrom') || lower.includes('brown')) {
      return 'https://img.usecurling.com/p/600/600?q=brown%20rolling%20paper'
    }
    if (lower.includes('longa')) {
      return 'https://img.usecurling.com/p/600/600?q=long%20rolling%20paper'
    }
    return 'https://img.usecurling.com/p/600/600?q=rolling%20paper%20pack'
  }

  // 2. Piteiras (vidro e papel)
  if (lower.includes('piteira') || lower.includes('filtro')) {
    if (lower.includes('limpa') || lower.includes('escova')) {
      return 'https://img.usecurling.com/p/600/600?q=pipe%20cleaning%20brush'
    }
    if (lower.includes('filtro')) {
      if (lower.includes('carvão') || lower.includes('carvao')) {
        return 'https://img.usecurling.com/p/600/600?q=carbon%20filter%20tips'
      }
      return 'https://img.usecurling.com/p/600/600?q=cigarette%20filter%20tips'
    }
    if (
      lower.includes('vidro') ||
      lower.includes('print') ||
      lower.includes('artística') ||
      lower.includes('artistica')
    ) {
      if (
        lower.includes('artística') ||
        lower.includes('artistica') ||
        lower.includes('full print')
      ) {
        return 'https://img.usecurling.com/p/600/600?q=artistic%20glass%20tip'
      }
      return 'https://img.usecurling.com/p/600/600?q=glass%20filter%20tip'
    }
    return 'https://img.usecurling.com/p/600/600?q=paper%20filter%20tips'
  }

  // 3. Isqueiros e Maçaricos
  if (lower.includes('maçarico') || lower.includes('macarico') || lower.includes('torch')) {
    if (lower.includes('grande')) {
      return 'https://img.usecurling.com/p/600/600?q=blowtorch%20heavy%20flame'
    }
    if (lower.includes('cano')) {
      return 'https://img.usecurling.com/p/600/600?q=long%20neck%20lighter'
    }
    return 'https://img.usecurling.com/p/600/600?q=butane%20torch%20metal'
  }
  if (lower.includes('isqueiro')) {
    if (lower.includes('clipper')) {
      return 'https://img.usecurling.com/p/600/600?q=clipper%20refillable%20lighter'
    }
    return 'https://img.usecurling.com/p/600/600?q=pocket%20flint%20lighter'
  }

  // 4. Dichavadores
  if (lower.includes('dichavador') || lower.includes('grinder')) {
    if (lower.includes('metal')) {
      return 'https://img.usecurling.com/p/600/600?q=metal%20herb%20grinder'
    }
    if (
      lower.includes('plástico') ||
      lower.includes('plastico') ||
      lower.includes('acrílico') ||
      lower.includes('acrilico')
    ) {
      return 'https://img.usecurling.com/p/600/600?q=acrylic%20herb%20grinder'
    }
    return 'https://img.usecurling.com/p/600/600?q=novelty%20herb%20grinder'
  }

  // 5. Cuias
  if (lower.includes('cuia')) {
    if (lower.includes('mix')) {
      return 'https://img.usecurling.com/p/600/600?q=colorful%20silicone%20bowl'
    }
    return 'https://img.usecurling.com/p/600/600?q=silicone%20pinch%20bowl'
  }

  // 6. Tesouras
  if (lower.includes('tesoura')) {
    if (lower.includes('dobrável') || lower.includes('dobravel')) {
      return 'https://img.usecurling.com/p/600/600?q=folding%20compact%20scissors'
    }
    return 'https://img.usecurling.com/p/600/600?q=stainless%20herb%20scissors'
  }

  // 7. Cinzeiros
  if (lower.includes('cinzeiro')) {
    if (lower.includes('turn off') || lower.includes('extintor')) {
      return 'https://img.usecurling.com/p/600/600?q=snuffer%20car%20ashtray'
    }
    if (lower.includes('crystal') || lower.includes('cristal') || lower.includes('lapidado')) {
      return 'https://img.usecurling.com/p/600/600?q=crystal%20glass%20ashtray'
    }
    if (lower.includes('vidro')) {
      return 'https://img.usecurling.com/p/600/600?q=glass%20heavy%20ashtray'
    }
    if (lower.includes('quartzo')) {
      return 'https://img.usecurling.com/p/600/600?q=crystal%20quartz%20ashtray'
    }
    if (lower.includes('silicone')) {
      return 'https://img.usecurling.com/p/600/600?q=silicone%20cigar%20ashtray'
    }
    return 'https://img.usecurling.com/p/600/600?q=metal%20spinning%20ashtray'
  }

  // 8. Potes herméticos
  if (lower.includes('pote') || lower.includes('hermético') || lower.includes('hermetico')) {
    if (lower.includes('premium') || lower.includes('diferenciado') || lower.includes('uv')) {
      return 'https://img.usecurling.com/p/600/600?q=amber%20glass%20stash%20jar'
    }
    return 'https://img.usecurling.com/p/600/600?q=plastic%20airtight%20jar'
  }

  // 9. Pré-bolados / Cones / Prerolls
  if (
    lower.includes('pré-bolado') ||
    lower.includes('pre-bolado') ||
    lower.includes('preroll') ||
    lower.includes('blunt') ||
    lower.includes('cone')
  ) {
    if (lower.includes('blunt')) {
      return 'https://img.usecurling.com/p/600/600?q=blunt%20cone%20cigar'
    }
    return 'https://img.usecurling.com/p/600/600?q=pre%20rolled%20cones%20paper'
  }

  // 10. Porta Beck / Guarda Ocklinas / Mocó
  if (
    lower.includes('porta beck') ||
    lower.includes('guarda ocklinas') ||
    lower.includes('mocó') ||
    lower.includes('moco')
  ) {
    if (lower.includes('triplo')) {
      return 'https://img.usecurling.com/p/600/600?q=multi%20joint%20holder%20tube'
    }
    if (lower.includes('metal')) {
      return 'https://img.usecurling.com/p/600/600?q=metal%20joint%20container'
    }
    return 'https://img.usecurling.com/p/600/600?q=waterproof%20joint%20tube'
  }

  // 11. Slicks e Reservatórios de vidro
  if (lower.includes('slick') || lower.includes('reservatório') || lower.includes('reservatorio')) {
    if (lower.includes('vidro') || lower.includes('divisória') || lower.includes('divisoria')) {
      return 'https://img.usecurling.com/p/600/600?q=glass%20concentrate%20jar'
    }
    return 'https://img.usecurling.com/p/600/600?q=silicone%20wax%20container'
  }

  // 12. Bandejas e Rolling Trays
  if (lower.includes('bandeja') || lower.includes('rolling tray')) {
    if (lower.includes('vidro')) {
      return 'https://img.usecurling.com/p/600/600?q=glass%20rolling%20tray'
    }
    return 'https://img.usecurling.com/p/600/600?q=metal%20rolling%20tray%20black'
  }

  // 12.1 Ziplocks
  if (lower.includes('ziplock')) {
    return 'https://img.usecurling.com/p/600/600?q=mylar%20smell%20proof%20bag'
  }

  // 12.2 Dabs e Extrações (tapete, espátula, bicucena)
  if (lower.includes('tapete') || lower.includes('extração') || lower.includes('extracao')) {
    return 'https://img.usecurling.com/p/600/600?q=silicone%20dab%20mat'
  }
  if (lower.includes('espátula') || lower.includes('espatula') || lower.includes('dabber')) {
    return 'https://img.usecurling.com/p/600/600?q=stainless%20dab%20tool'
  }
  if (lower.includes('bicucena') || lower.includes('desentupidor')) {
    return 'https://img.usecurling.com/p/600/600?q=metal%20pipe%20cleaning%20tool'
  }

  // 13. Bongs e Water Pipes
  if (lower.includes('bong') || lower.includes('bubbler')) {
    if (lower.includes('silicone')) {
      return 'https://img.usecurling.com/p/600/600?q=silicone%20water%20pipe'
    }
    if (lower.includes('acrílico') || lower.includes('acrilico')) {
      return 'https://img.usecurling.com/p/600/600?q=acrylic%20water%20bong'
    }
    if (lower.includes('percolador') || lower.includes('matrix')) {
      return 'https://img.usecurling.com/p/600/600?q=glass%20percolator%20bong'
    }
    return 'https://img.usecurling.com/p/600/600?q=borosilicate%20glass%20bong'
  }

  // 14. Cases e Kits montados
  if (lower.includes('kit montado') || lower.includes('case')) {
    if (lower.includes('kit montado')) {
      return 'https://img.usecurling.com/p/600/600?q=smoker%20travel%20kit%20pouch'
    }
    return 'https://img.usecurling.com/p/600/600?q=padded%20hard%20case%20pouch'
  }

  // 15. Pipes em geral
  if (lower.includes('pipe') || lower.includes('one hitter')) {
    return 'https://img.usecurling.com/p/600/600?q=glass%20smoking%20pipe'
  }

  // 16. Vaporizadores legados
  if (lower.includes('vaporizador')) {
    return 'https://img.usecurling.com/p/600/600?q=vaporizer%20device%20black'
  }

  return getCategoryFallbackImage(categorySlug || '')
}
