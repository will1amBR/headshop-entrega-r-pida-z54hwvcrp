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

  // 1. Sedas e papéis de enrolar (estilo Smoking e RAW reais de catálogo)
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
    if (lower.includes('smoking')) {
      return 'https://img.usecurling.com/p/600/600?q=smoking%20deluxe%20rolling%20paper'
    }
    if (lower.includes('raw')) {
      return 'https://img.usecurling.com/p/600/600?q=raw%20rolling%20paper%20booklet'
    }
    if (lower.includes('zomo')) {
      return 'https://img.usecurling.com/p/600/600?q=zomo%20rolling%20paper%20pack'
    }
    if (lower.includes('colorida') || lower.includes('color')) {
      return 'https://img.usecurling.com/p/600/600?q=colored%20rolling%20paper%20pink'
    }
    if (lower.includes('saborizada') || lower.includes('sabor')) {
      return 'https://img.usecurling.com/p/600/600?q=flavored%20rolling%20paper%20pack'
    }
    if (lower.includes('marrom') || lower.includes('brown') || lower.includes('natural')) {
      return 'https://img.usecurling.com/p/600/600?q=unbleached%20brown%20rolling%20paper%20pack'
    }
    if (lower.includes('longa')) {
      return 'https://img.usecurling.com/p/600/600?q=king%20size%20rolling%20paper%20booklet'
    }
    if (lower.includes('slim')) {
      return 'https://img.usecurling.com/p/600/600?q=slim%20rolling%20paper%20pack'
    }
    return 'https://img.usecurling.com/p/600/600?q=smoking%20paper%20booklet%20pack'
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
    if (lower.includes('hemp') || lower.includes('terpeno') || lower.includes('lion')) {
      return 'https://img.usecurling.com/p/600/600?q=terpene%20hemp%20wrap%20pack'
    }
    if (lower.includes('blunt')) {
      return 'https://img.usecurling.com/p/600/600?q=blunt%20cone%20cigar%20tube'
    }
    return 'https://img.usecurling.com/p/600/600?q=pre%20rolled%20cones%20box'
  }

  // 3. Piteiras e Filtros
  if (lower.includes('piteira') || lower.includes('filtro') || lower.includes('filter')) {
    if (lower.includes('limpa') || lower.includes('escova')) {
      return 'https://img.usecurling.com/p/600/600?q=pipe%20cleaning%20brush%20wire'
    }
    if (lower.includes('yellow finger')) {
      return 'https://img.usecurling.com/p/600/600?q=wooden%20filter%20tips%20pack'
    }
    if (lower.includes('girls in green')) {
      return 'https://img.usecurling.com/p/600/600?q=biodegradable%20filter%20tips%20pack'
    }
    if (lower.includes('madeira') || lower.includes('wood')) {
      return 'https://img.usecurling.com/p/600/600?q=wooden%20cigarette%20holder%20tip'
    }
    if (lower.includes('carvão') || lower.includes('carvao') || lower.includes('carbon')) {
      return 'https://img.usecurling.com/p/600/600?q=actitube%20activated%20carbon%20filters'
    }
    if (
      lower.includes('vidro') ||
      lower.includes('print') ||
      lower.includes('artística') ||
      lower.includes('artistica')
    ) {
      if (
        lower.includes('full print') ||
        lower.includes('artística') ||
        lower.includes('artistica')
      ) {
        return 'https://img.usecurling.com/p/600/600?q=printed%20glass%20filter%20tip'
      }
      return 'https://img.usecurling.com/p/600/600?q=clear%20glass%20filter%20tip'
    }
    if (lower.includes('sabor')) {
      return 'https://img.usecurling.com/p/600/600?q=flavored%20filter%20tips%20pack'
    }
    if (lower.includes('colorida')) {
      return 'https://img.usecurling.com/p/600/600?q=colored%20rolling%20filter%20tips'
    }
    if (lower.includes('slim')) {
      return 'https://img.usecurling.com/p/600/600?q=slim%20rolling%20filter%20tips'
    }
    return 'https://img.usecurling.com/p/600/600?q=raw%20perforated%20filter%20tips%20booklet'
  }

  // 4. Dichavadores & Grinders
  if (lower.includes('dichavador') || lower.includes('grinder') || lower.includes('desfiador')) {
    if (lower.includes('elétrico') || lower.includes('eletrico')) {
      return 'https://img.usecurling.com/p/600/600?q=electric%20herb%20grinder%20usb'
    }
    if (lower.includes('zinco') || lower.includes('zinc')) {
      return 'https://img.usecurling.com/p/600/600?q=zinc%20alloy%20herb%20grinder'
    }
    if (lower.includes('strain hunters') || lower.includes('bobado') || lower.includes('tubo')) {
      return 'https://img.usecurling.com/p/600/600?q=strain%20hunters%20acrylic%20grinder'
    }
    if (
      lower.includes('plástico') ||
      lower.includes('plastico') ||
      lower.includes('acrílico') ||
      lower.includes('acrilico') ||
      lower.includes('eco')
    ) {
      return 'https://img.usecurling.com/p/600/600?q=acrylic%20herb%20grinder%20clear'
    }
    if (lower.includes('5 peças') || lower.includes('5 pecas')) {
      return 'https://img.usecurling.com/p/600/600?q=black%20aluminum%20herb%20grinder'
    }
    return 'https://img.usecurling.com/p/600/600?q=metal%20herb%20grinder%204%20piece'
  }

  // 5. Isqueiros, Maçaricos e Acessórios de chama
  if (
    lower.includes('maçarico') ||
    lower.includes('macarico') ||
    lower.includes('maçanico') ||
    lower.includes('macanico') ||
    lower.includes('torch')
  ) {
    if (lower.includes('gti') || lower.includes('cano') || lower.includes('pistola')) {
      return 'https://img.usecurling.com/p/600/600?q=jet%20torch%20lighter%20gun'
    }
    if (lower.includes('grande') || lower.includes(' g')) {
      return 'https://img.usecurling.com/p/600/600?q=heavy%20duty%20butane%20torch'
    }
    return 'https://img.usecurling.com/p/600/600?q=butane%20torch%20flame%20lighter'
  }
  if (lower.includes('isqueiro')) {
    if (lower.includes('clipper')) {
      return 'https://img.usecurling.com/p/600/600?q=clipper%20lighter%20classic'
    }
    if (lower.includes('raw')) {
      return 'https://img.usecurling.com/p/600/600?q=raw%20clipper%20lighter'
    }
    return 'https://img.usecurling.com/p/600/600?q=pocket%20flint%20lighter%20black'
  }

  // 6. Cuias e Slicks
  if (lower.includes('cuia')) {
    if (lower.includes('raw')) {
      return 'https://img.usecurling.com/p/600/600?q=raw%20silicone%20bowl'
    }
    if (lower.includes('mix') || lower.includes('estampada') || lower.includes('cores')) {
      return 'https://img.usecurling.com/p/600/600?q=camo%20silicone%20pinch%20bowl'
    }
    return 'https://img.usecurling.com/p/600/600?q=black%20silicone%20mixing%20bowl'
  }

  if (lower.includes('slick') || lower.includes('reservatório') || lower.includes('reservatorio')) {
    if (lower.includes('vidro') || lower.includes('divisória') || lower.includes('divisoria')) {
      return 'https://img.usecurling.com/p/600/600?q=glass%20dab%20jar%20concentrate'
    }
    return 'https://img.usecurling.com/p/600/600?q=silicone%20wax%20slick%20jar'
  }

  // 7. Potes Herméticos
  if (lower.includes('pote') || lower.includes('hermético') || lower.includes('hermetico')) {
    if (
      lower.includes('uv') ||
      lower.includes('quartz') ||
      lower.includes('quartzo') ||
      lower.includes('premium')
    ) {
      return 'https://img.usecurling.com/p/600/600?q=violet%20glass%20stash%20jar'
    }
    return 'https://img.usecurling.com/p/600/600?q=tightvac%20airtight%20container'
  }

  // 8. Porta Beck / Guarda Ocklinas / Mocó / Beck Tube
  if (
    lower.includes('porta beck') ||
    lower.includes('guarda ocklinas') ||
    lower.includes('mocó') ||
    lower.includes('moco') ||
    lower.includes('beck tube')
  ) {
    if (lower.includes('alumínio') || lower.includes('aluminio') || lower.includes('metal')) {
      return 'https://img.usecurling.com/p/600/600?q=aluminum%20joint%20holder%20tube'
    }
    return 'https://img.usecurling.com/p/600/600?q=plastic%20joint%20tube%20waterproof'
  }

  // 9. Bandejas e Rolling Trays
  if (
    lower.includes('bandeja') ||
    lower.includes('rolling tray') ||
    lower.includes('tin case') ||
    lower.includes('tin box')
  ) {
    if (lower.includes('raw')) {
      return 'https://img.usecurling.com/p/600/600?q=raw%20metal%20rolling%20tray'
    }
    if (lower.includes('lion')) {
      if (lower.includes('vidro')) {
        return 'https://img.usecurling.com/p/600/600?q=glass%20rolling%20tray%20lion'
      }
      return 'https://img.usecurling.com/p/600/600?q=metal%20rolling%20tray%20lion'
    }
    if (lower.includes('vidro')) {
      return 'https://img.usecurling.com/p/600/600?q=tempered%20glass%20rolling%20tray'
    }
    if (lower.includes('tampa')) {
      return 'https://img.usecurling.com/p/600/600?q=metal%20rolling%20tray%20magnetic%20lid'
    }
    return 'https://img.usecurling.com/p/600/600?q=black%20metal%20rolling%20tray'
  }

  // 10. Cinzeiros
  if (lower.includes('cinzeiro')) {
    if (lower.includes('raw')) {
      return 'https://img.usecurling.com/p/600/600?q=raw%20glass%20ashtray'
    }
    if (lower.includes('lion')) {
      return 'https://img.usecurling.com/p/600/600?q=metal%20lion%20ashtray'
    }
    if (lower.includes('smoking')) {
      return 'https://img.usecurling.com/p/600/600?q=smoking%20brand%20metal%20ashtray'
    }
    if (lower.includes('turn off') || lower.includes('extintor')) {
      return 'https://img.usecurling.com/p/600/600?q=car%20cup%20snuffer%20ashtray'
    }
    if (lower.includes('crystal') || lower.includes('cristal') || lower.includes('lapidado')) {
      return 'https://img.usecurling.com/p/600/600?q=cut%20crystal%20glass%20ashtray'
    }
    if (lower.includes('vidro')) {
      return 'https://img.usecurling.com/p/600/600?q=heavy%20glass%20ashtray%20square'
    }
    if (lower.includes('quartzo')) {
      return 'https://img.usecurling.com/p/600/600?q=natural%20stone%20quartz%20ashtray'
    }
    if (lower.includes('silicone')) {
      return 'https://img.usecurling.com/p/600/600?q=silicone%20heat%20resistant%20ashtray'
    }
    return 'https://img.usecurling.com/p/600/600?q=round%20metal%20ashtray'
  }

  // 11. Bongs & Pipes
  if (lower.includes('bong') || lower.includes('percobator') || lower.includes('bubbler')) {
    if (lower.includes('silicone')) {
      return 'https://img.usecurling.com/p/600/600?q=silicone%20water%20pipe%20beaker'
    }
    if (lower.includes('acrílico') || lower.includes('acrilico')) {
      return 'https://img.usecurling.com/p/600/600?q=acrylic%20water%20pipe%20bong'
    }
    if (lower.includes('percolador') || lower.includes('percobator')) {
      return 'https://img.usecurling.com/p/600/600?q=glass%20percolator%20ice%20bong'
    }
    return 'https://img.usecurling.com/p/600/600?q=borosilicate%20glass%20beaker%20bong'
  }

  if (lower.includes('pipe') || lower.includes('one hitter')) {
    return 'https://img.usecurling.com/p/600/600?q=glass%20spoon%20smoking%20pipe'
  }

  // 12. Cases, Bolsas, Canecas e Promocionais
  if (
    lower.includes('puff case') ||
    lower.includes('case kit') ||
    lower.includes('kit montado') ||
    lower.includes('kit moco') ||
    lower.includes('kit mocó')
  ) {
    return 'https://img.usecurling.com/p/600/600?q=smell%20proof%20hard%20case%20bag'
  }
  if (lower.includes('tote bag')) {
    return 'https://img.usecurling.com/p/600/600?q=canvas%20tote%20bag%20black'
  }
  if (lower.includes('caneca') || lower.includes('ceneca')) {
    return 'https://img.usecurling.com/p/600/600?q=ceramic%20coffee%20mug%20black'
  }
  if (lower.includes('inflável') || lower.includes('inflavel')) {
    return 'https://img.usecurling.com/p/600/600?q=inflatable%20advertising%20cone'
  }

  // 13. Ziplocks & Embalagens
  if (lower.includes('ziplock')) {
    return 'https://img.usecurling.com/p/600/600?q=matte%20black%20mylar%20bag%20window'
  }

  // 14. Ferramentas e Tesouras
  if (lower.includes('tesoura')) {
    if (lower.includes('dobrável') || lower.includes('dobravel')) {
      return 'https://img.usecurling.com/p/600/600?q=folding%20pocket%20scissors%20metal'
    }
    return 'https://img.usecurling.com/p/600/600?q=precision%20herb%20trimming%20scissors'
  }
  if (lower.includes('espátula') || lower.includes('espatula') || lower.includes('dabber')) {
    return 'https://img.usecurling.com/p/600/600?q=stainless%20steel%20dab%20tool'
  }
  if (lower.includes('bicucena') || lower.includes('desentupidor')) {
    return 'https://img.usecurling.com/p/600/600?q=metal%20pipe%20cleaning%20tool%20wire'
  }
  if (lower.includes('tapete') || lower.includes('extração') || lower.includes('extracao')) {
    return 'https://img.usecurling.com/p/600/600?q=silicone%20dab%20mat%20black'
  }
  if (lower.includes('anti rato') || lower.includes('antiodor')) {
    return 'https://img.usecurling.com/p/600/600?q=smell%20proof%20lock%20box'
  }

  // 15. Vaporizadores
  if (lower.includes('vaporizador')) {
    return 'https://img.usecurling.com/p/600/600?q=dry%20herb%20vaporizer%20pen'
  }

  return getCategoryFallbackImage(categorySlug || '')
}
