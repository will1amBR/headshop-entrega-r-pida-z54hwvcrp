/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const products = app.findRecordsByFilter('products', 'active = true', '-created', 500)

  for (const p of products) {
    const name = (p.get('name') || '').toLowerCase()
    let description = p.get('description') || ''
    let price = Number(p.get('price')) || 0
    let costPrice = Number(p.get('cost_price')) || 0
    let stock = Number(p.get('stock')) || 0
    let minStock = Number(p.get('min_stock')) || 0

    // 1. Sedas Smoking / RAW / Genéricas
    if (
      name.includes('seda') &&
      !name.includes('porta') &&
      !name.includes('cone') &&
      !name.includes('isqueiro')
    ) {
      if (name.includes('raw')) {
        description =
          'Seda RAW Classic King Size Slim feita de fibras naturais não refinadas e goma vegetal pura. Proporciona queima ultralenta, fumaça suave e zero gosto residual.'
      } else if (name.includes('deluxe') || name.includes('smoking') || name.includes('master')) {
        description =
          'Seda Smoking Deluxe King Size ultrafina de queima lenta. Papel de alta gramatura com goma arábica natural, ideal para enrolar artesanalmente com perfeição.'
      } else {
        description =
          'Seda King Size Slim de alta performance e transparência. Papel premium com goma 100% natural, garantindo carburada uniforme e sem alterações no sabor.'
      }
      if (price < 3 || price > 15 || price === 0) price = 7.5
      costPrice = Number((price * 0.45).toFixed(2))
      stock = 85
      minStock = 20
    }
    // 2. Cones, Pré-bolados e Blunts
    else if (
      name.includes('cone') ||
      name.includes('pré-bolado') ||
      name.includes('pre-bolado') ||
      name.includes('preroll') ||
      name.includes('blunt') ||
      name.includes('wrap')
    ) {
      description =
        'Cones pré-enrolados prontos para rechear com piteira inclusa. Praticidade total e queima simétrica sem perda de conteúdo para seu ritual rápido.'
      if (price < 5 || price > 35 || price === 0) price = 14.9
      costPrice = Number((price * 0.48).toFixed(2))
      stock = 70
      minStock = 18
    }
    // 3. Piteiras de Vidro e Papel
    else if (name.includes('piteira') || name.includes('filtro')) {
      if (name.includes('vidro') || name.includes('borossilicato') || name.includes('print')) {
        description =
          'Piteira de vidro borossilicato de alta resistência térmica com travas de resfriamento. Reduz danos à garganta, não esquenta os lábios e é 100% lavável e reutilizável.'
        if (price < 10 || price > 35 || price === 0) price = 18.0
        costPrice = Number((price * 0.45).toFixed(2))
        stock = 45
        minStock = 12
      } else {
        description =
          'Piteiras de papel perfurado de fácil dobra em sanfona. Evitam o contato direto da brasa com a boca e garantem fluxo de ar perfeito e sem entupimentos.'
        if (price < 2 || price > 12 || price === 0) price = 5.0
        costPrice = Number((price * 0.4).toFixed(2))
        stock = 90
        minStock = 25
      }
    }
    // 4. Isqueiros Clipper e outros
    else if (name.includes('isqueiro') || name.includes('clipper')) {
      description =
        'Isqueiro Clipper original recarregável a gás isobutano com pilão removível para prensar. Chama estável, durabilidade lendária e formato icônico colecionável.'
      if (price < 8 || price > 25 || price === 0) price = 14.0
      costPrice = Number((price * 0.5).toFixed(2))
      stock = 75
      minStock = 20
    }
    // 5. Maçaricos
    else if (name.includes('maçarico') || name.includes('macarico') || name.includes('torch')) {
      description =
        'Maçarico portátil Jet Flame recarregável com chama azul de alta intensidade e trava contínua. Excelente resistência ao vento e precisão máxima para bongs e pipes.'
      if (price < 20 || price > 90 || price === 0) price = 39.9
      costPrice = Number((price * 0.5).toFixed(2))
      stock = 35
      minStock = 10
    }
    // 6. Dichavadores
    else if (
      name.includes('dichavador') ||
      name.includes('grinder') ||
      name.includes('desfiador')
    ) {
      description =
        'Dichavador usinado em metal CNC com 4 partes, dentes diamantados afiados e tela de retenção para kief com espátula inclusa. Desfia sem empastar nem travar.'
      if (price < 18 || price > 90 || price === 0) price = 42.0
      costPrice = Number((price * 0.48).toFixed(2))
      stock = 40
      minStock = 10
    }
    // 7. Cuias
    else if (name.includes('cuia')) {
      description =
        'Cuia de silicone curado platinum antiaderente com base reforçada. Perfeita para misturar e picar com tesoura sem grudar material nem absorver resíduos.'
      if (price < 8 || price > 30 || price === 0) price = 15.0
      costPrice = Number((price * 0.45).toFixed(2))
      stock = 65
      minStock = 15
    }
    // 8. Tesouras
    else if (name.includes('tesoura')) {
      description =
        'Tesoura de precisão em aço inoxidável com ponta fina e lâminas afiadas. Ideal para corte rápido em cuia sem mastigar as ervas e cabe em qualquer case.'
      if (price < 10 || price > 40 || price === 0) price = 19.9
      costPrice = Number((price * 0.45).toFixed(2))
      stock = 50
      minStock = 12
    }
    // 9. Slicks de silicone
    else if (
      name.includes('slick') ||
      name.includes('reservatório') ||
      name.includes('reservatorio')
    ) {
      description =
        'Pote Slick de silicone médico antiaderente com fechamento hermético de pressão. Conserva extrações puras sem contato com ar e facilita remoção de 100% da matéria.'
      if (price < 7 || price > 30 || price === 0) price = 12.5
      costPrice = Number((price * 0.4).toFixed(2))
      stock = 60
      minStock = 15
    }
    // 10. Bandejas
    else if (name.includes('bandeja') || name.includes('rolling tray')) {
      description =
        'Bandeja de enrolar em metal esmaltado com bordas curvas anti-desperdício. Superfície lisa e resistente que mantém sua mesa limpa e tudo organizado.'
      if (price < 25 || price > 90 || price === 0) price = 45.0
      costPrice = Number((price * 0.48).toFixed(2))
      stock = 32
      minStock = 8
    }
    // 11. Bongs
    else if (name.includes('bong') || name.includes('bubbler')) {
      description =
        'Bong em vidro borossilicato com base Beaker e travas para pedras de gelo. Filtragem líquida pura que resfria a fumaça e retém impurezas pesadas.'
      if (price < 60 || price > 350 || price === 0) price = 119.0
      costPrice = Number((price * 0.48).toFixed(2))
      stock = 14
      minStock = 4
    }
    // 12. Pipes
    else if (name.includes('pipe') || name.includes('one hitter')) {
      description =
        'Pipe de vidro borossilicato portátil com respiro de ar carb. Proporciona puxadas diretas e sabor autêntico sem queimar papéis em qualquer lugar.'
      if (price < 15 || price > 60 || price === 0) price = 26.0
      costPrice = Number((price * 0.45).toFixed(2))
      stock = 25
      minStock = 6
    }
    // 13. Potes Herméticos
    else if (name.includes('pote') || name.includes('hermético') || name.includes('hermetico')) {
      description =
        'Pote de vidro hermético com trava em aço e anel de silicone atóxico. Vedação total anti-odor e proteção contra umidade para curar e manter frescor prolongado.'
      if (price < 20 || price > 80 || price === 0) price = 38.0
      costPrice = Number((price * 0.45).toFixed(2))
      stock = 30
      minStock = 8
    }
    // 14. Mocós e porta-beck
    else if (
      name.includes('mocó') ||
      name.includes('moco') ||
      name.includes('porta') ||
      name.includes('ocklinas')
    ) {
      description =
        'Porta-beck mocó hermético com tampa squeeze pop-top. À prova de água e de odores, protege seu baseado de amassar no bolso durante qualquer rolê.'
      if (price < 5 || price > 25 || price === 0) price = 9.9
      costPrice = Number((price * 0.4).toFixed(2))
      stock = 80
      minStock = 20
    }
    // 15. Ziplocks
    else if (name.includes('ziplock')) {
      description =
        'Embalagem Ziplock metalizada com fecho trilho hermético e visor transparente. Bloqueia raios UV e odores indiscretos com segurança máxima.'
      if (price < 2 || price > 15 || price === 0) price = 4.5
      costPrice = Number((price * 0.35).toFixed(2))
      stock = 110
      minStock = 30
    }
    // 16. Cinzeiros
    else if (name.includes('cinzeiro')) {
      description =
        'Cinzeiro pesado com 4 cavidades de apoio para descanso. Material resistente a altas temperaturas com acabamento elegante para compor sua mesa.'
      if (price < 15 || price > 60 || price === 0) price = 24.9
      costPrice = Number((price * 0.45).toFixed(2))
      stock = 28
      minStock = 8
    }
    // 17. Tabacos e fumos
    else if (
      name.includes('tabaco') ||
      name.includes('fumo') ||
      name.includes('camomila') ||
      name.includes('kumbaya')
    ) {
      description =
        'Fumo desfiado fino e selecionado com umidade equilibrada e queima limpa. Sem aditivos químicos agressivos, ideal para compor seu blend favorito.'
      if (price < 12 || price > 45 || price === 0) price = 22.0
      costPrice = Number((price * 0.5).toFixed(2))
      stock = 55
      minStock = 15
    }
    // Fallback padrão
    else {
      if (!description) {
        description =
          'Acessório de alta qualidade selecionado pela curadoria HeadShop Entrega Rápida. Item indispensável para seu kit com envio imediato.'
      }
      if (price <= 0) price = 19.9
      costPrice = Number((price * 0.48).toFixed(2))
      stock = 30
      minStock = 8
    }

    p.set('description', description)
    p.set('price', price)
    p.set('cost_price', costPrice)
    p.set('stock', stock)
    p.set('min_stock', minStock)

    app.save(p)
  }
})
