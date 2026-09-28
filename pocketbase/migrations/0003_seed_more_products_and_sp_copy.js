migrate(
  (app) => {
    // 1. Atualizar seo_settings existente para reforçar entrega rápida em São Paulo
    const seoCol = app.findCollectionByNameOrId('seo_settings')
    try {
      const seoRecord = app.findFirstRecordByData(
        'seo_settings',
        'store_name',
        'HeadShop Entrega Rápida',
      )
      seoRecord.set(
        'announcement_text',
        '🚀 Entrega rápida em São Paulo • Envio para todo o Brasil | 💬 Pedidos via WhatsApp | 🔒 Pagamento Seguro',
      )
      seoRecord.set('hero_title', 'Sua loja headshop com entrega rápida em São Paulo')
      seoRecord.set(
        'hero_subtitle',
        'Os melhores vaporizadores, sedas, acessórios e pipes com entrega expressa para toda a Grande São Paulo e envio seguro para todo o Brasil. Atendimento ágil pelo WhatsApp.',
      )
      app.save(seoRecord)
    } catch (_) {}

    // 2. Mapear categorias existentes
    const catCol = app.findCollectionByNameOrId('categories')
    const slugs = ['vaporizadores', 'seddas', 'acessorios', 'pipes']
    const categoryMap = {}
    for (let i = 0; i < slugs.length; i++) {
      const s = slugs[i]
      try {
        const catRec = app.findFirstRecordByData('categories', 'slug', s)
        categoryMap[s] = catRec.id
      } catch (_) {}
    }

    // 3. Cadastrar novos produtos realistas (idempotente por nome)
    const prodCol = app.findCollectionByNameOrId('products')
    const newProducts = [
      // Vaporizadores (mercado R$ 120 - 600)
      {
        name: 'Vaporizador de Ervas Black Mamba Condução Térmica',
        description:
          'Câmara em cerâmica em formato de gota, aquecimento uniforme em 20 segundos e 5 temperaturas pré-definidas (180°C a 220°C). Bocal em vidro com acabamento soft-touch discreto.',
        price: 349.9,
        stock: 12,
        featured: true,
        active: true,
        categorySlug: 'vaporizadores',
      },
      {
        name: 'Vaporizador de Concentrados Wax & Dabs Portátil',
        description:
          'Bobina de quartzo duplo para extrações e óleos densos. Bateria de 900mAh com voltagem variável e pré-aquecimento inteligente para maior pureza.',
        price: 219.0,
        stock: 18,
        featured: false,
        active: true,
        categorySlug: 'vaporizadores',
      },
      {
        name: 'Vaporizador Híbrido Convecção Storm Max 2.0',
        description:
          'Tecnologia de aquecimento por convecção híbrida, display OLED nítido, fluxo de ar isolado e bateria 18650 substituível via USB-C. Sabor puro e denso.',
        price: 549.0,
        stock: 8,
        featured: true,
        active: true,
        categorySlug: 'vaporizadores',
      },
      {
        name: 'Bocal de Vidro Reposição para Vaporizador Portátil',
        description:
          'Bocal substituto original em vidro de borossilicato de grau médico. Fácil higienização com álcool isopropílico e encaixe magnético preciso.',
        price: 49.9,
        stock: 30,
        featured: false,
        active: true,
        categorySlug: 'vaporizadores',
      },

      // Seddas (mercado R$ 10 - 80)
      {
        name: 'Seda de Vidro Borossilicato Reutilizável 75mm',
        description:
          'Seda de vidro com tubo deslizante regulável para fácil limpeza e economia. Reduz danos à garganta e elimina o consumo de papel e cinzas.',
        price: 29.9,
        stock: 45,
        featured: true,
        active: true,
        categorySlug: 'seddas',
      },
      {
        name: 'Piteira de Vidro Murano Artesanal 6mm com Pontas',
        description:
          'Piteira lavável em vidro borossilicato alemão 6mm com 3 travas internas de retenção. Resfria a fumaça e evita queimações nos dedos e lábios.',
        price: 19.9,
        stock: 60,
        featured: true,
        active: true,
        categorySlug: 'seddas',
      },
      {
        name: 'Seda King Size Slim Alfalfa Green Organics (Display c/ 20)',
        description:
          'Papel natural verde clarinho à base de alfafa orgânica, queima ultra lenta sem aditivos químicos. Display de fábrica lacrado com 20 livretos.',
        price: 78.0,
        stock: 25,
        featured: false,
        active: true,
        categorySlug: 'seddas',
      },
      {
        name: 'Livreto Seda King Size + Piteiras Perfuradas Eco Brown',
        description:
          'Combo prático 2 em 1: 32 folhas king size marrons não branqueadas acompanhadas de 32 piteiras perfuradas de papel Kraft virgem.',
        price: 14.9,
        stock: 90,
        featured: false,
        active: true,
        categorySlug: 'seddas',
      },

      // Acessórios (mercado R$ 20 - 150)
      {
        name: 'Maçarico Recarregável Honest Torch Chama Tripla',
        description:
          'Maçarico ergonômico com 3 chamas tipo jet flame resistentes a vento, trava de segurança, visor de nível de gás butano e acabamento metálico gunmetal.',
        price: 89.9,
        stock: 20,
        featured: true,
        active: true,
        categorySlug: 'acessorios',
      },
      {
        name: 'Kit Dabber de Inox 5 Peças com Case Metálico',
        description:
          'Conjunto de ferramentas profissionais em aço cirúrgico com pontas variadas (espátula, colher, agulha e corte) para manipulação precisa de ceras e essências.',
        price: 59.9,
        stock: 26,
        featured: false,
        active: true,
        categorySlug: 'acessorios',
      },
      {
        name: 'Pote Hermético Antiodor UV Glass 150ml',
        description:
          'Vidro violeta ultravioleta com bloqueio fotossensível total contra raios solares nocivos, tampa de rosca com vedação a vácuo à prova de odores.',
        price: 68.0,
        stock: 32,
        featured: false,
        active: true,
        categorySlug: 'acessorios',
      },
      {
        name: 'Tapete de Silicone Antiaderente Dab Mat 20x15cm',
        description:
          'Silicone alimentício platinum de alta espessura com resistência térmica até 230°C. Superfície 100% antiaderente para descanso de peças e acessórios.',
        price: 32.0,
        stock: 40,
        featured: false,
        active: true,
        categorySlug: 'acessorios',
      },

      // Pipes (mercado R$ 35 - 320)
      {
        name: 'Bong de Vidro Beaker Clássico Ice Bong 26cm',
        description:
          'Bong modelo beaker (tubo largo de base estável) com trava de gelo tripla (ice pinch) para tragadas ultra geladas, downstem com fendas difusoras e bowl macho 14mm.',
        price: 189.9,
        stock: 14,
        featured: true,
        active: true,
        categorySlug: 'pipes',
      },
      {
        name: 'Pipe One Hitter de Cerâmica e Madeira Nobre',
        description:
          'Dugout compacto one hitter com corpo de madeira tratada à mão e tubo em cerâmica esmaltada. Máxima discrição para carregar no bolso ou chaveiro.',
        price: 45.0,
        stock: 38,
        featured: false,
        active: true,
        categorySlug: 'pipes',
      },
      {
        name: 'Bong Bubbler Vidro Curvo com Percolador Matrix',
        description:
          'Water pipe bubbler artesanal em vidro 5mm com sistema de filtragem de percolador Matrix de 360 graus, borbulhas contínuas e bocal ergonômico curvo.',
        price: 249.0,
        stock: 9,
        featured: true,
        active: true,
        categorySlug: 'pipes',
      },
      {
        name: 'Pipe de Silicone Curado com Bowl de Vidro Removível',
        description:
          'Indestrutível e flexível para viagens e rolês: corpo em silicone de grau médico que não quebra, bowl em vidro borossilicato lavável e tampa protetora integrada.',
        price: 54.9,
        stock: 33,
        featured: false,
        active: true,
        categorySlug: 'pipes',
      },
    ]

    for (let j = 0; j < newProducts.length; j++) {
      const p = newProducts[j]
      try {
        app.findFirstRecordByData('products', 'name', p.name)
        // Já existe, pula (idempotente)
      } catch (_) {
        const catId = categoryMap[p.categorySlug]
        if (!catId) continue

        const pRecord = new Record(prodCol)
        pRecord.set('name', p.name)
        pRecord.set('description', p.description)
        pRecord.set('price', p.price)
        pRecord.set('image', null)
        pRecord.set('stock', p.stock)
        pRecord.set('featured', p.featured)
        pRecord.set('active', p.active)
        pRecord.set('category', catId)
        app.save(pRecord)
      }
    }
  },
  (app) => {
    // down logic opcional
  },
)
