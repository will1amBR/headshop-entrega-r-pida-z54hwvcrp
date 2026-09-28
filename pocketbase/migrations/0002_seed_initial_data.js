migrate(
  (app) => {
    // 1. Seed admin user (idempotent)
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
    } catch (_) {
      const adminUser = new Record(users)
      adminUser.setEmail('william@korenambiental.com')
      adminUser.setPassword('Skip@Pass')
      adminUser.setVerified(true)
      adminUser.set('name', 'Administrador HeadShop')
      app.save(adminUser)
    }

    // 2. Seed seo_settings (idempotent)
    const seoCol = app.findCollectionByNameOrId('seo_settings')
    try {
      app.findFirstRecordByData('seo_settings', 'store_name', 'HeadShop Entrega Rápida')
    } catch (_) {
      const seoRecord = new Record(seoCol)
      seoRecord.set('store_name', 'HeadShop Entrega Rápida')
      seoRecord.set('whatsapp_number', '5511999999999')
      seoRecord.set(
        'announcement_text',
        '🚀 Entrega rápida para todo o Brasil | 💬 Pedidos pelo WhatsApp | 🔒 Pagamento combinado direto com a loja',
      )
      seoRecord.set('hero_title', 'Sua loja headshop com entrega rápida')
      seoRecord.set(
        'hero_subtitle',
        'Os melhores produtos de tabacaria e headshop direto na sua porta. Atendimento ágil e pedidos finalizados com total segurança pelo WhatsApp.',
      )
      app.save(seoRecord)
    }

    // 3. Seed categories (idempotent)
    const catCol = app.findCollectionByNameOrId('categories')
    const categoriesData = [
      { name: 'Vaporizadores', slug: 'vaporizadores' },
      { name: 'Seddas', slug: 'seddas' },
      { name: 'Acessórios', slug: 'acessorios' },
      { name: 'Pipes', slug: 'pipes' },
    ]

    const categoryMap = {}
    for (let i = 0; i < categoriesData.length; i++) {
      const c = categoriesData[i]
      let catRecord = null
      try {
        catRecord = app.findFirstRecordByData('categories', 'slug', c.slug)
      } catch (_) {
        catRecord = new Record(catCol)
        catRecord.set('name', c.name)
        catRecord.set('slug', c.slug)
        catRecord.set('image', null)
        app.save(catRecord)
      }
      categoryMap[c.slug] = catRecord.id
    }

    // 4. Seed realistic products (idempotent)
    const prodCol = app.findCollectionByNameOrId('products')
    const productsData = [
      {
        name: 'Vaporizador de Ervas HerbAir X Pro',
        description:
          'Vaporizador portátil com controle digital de temperatura (100°C a 240°C), câmara de cerâmica e bateria de longa duração. Aquecimento por condução ultra rápido em 25 segundos.',
        price: 389.9,
        stock: 14,
        featured: true,
        active: true,
        categorySlug: 'vaporizadores',
      },
      {
        name: 'Vaporizador Caneta Compact Slim',
        description:
          'Design ultrafino, bateria 650mAh recarregável USB-C e 3 níveis de voltagem predefinidos. Ideal para discrição e praticidade diária.',
        price: 159.0,
        stock: 22,
        featured: true,
        active: true,
        categorySlug: 'vaporizadores',
      },
      {
        name: 'Seda King Size Slim Organic Hemp (Caixa com 24)',
        description:
          'Papel de cânhamo 100% orgânico, queima ultra lenta e sem adição de cloro. Display fechado de fábrica com 24 livretos.',
        price: 94.9,
        stock: 35,
        featured: true,
        active: true,
        categorySlug: 'seddas',
      },
      {
        name: 'Seda Brown King Size Não Branqueada',
        description:
          'Papel de queima lenta extra fino em tom marrom natural. Acompanha piteiras de papel picotadas. Pacote unitário com 32 folhas.',
        price: 12.5,
        stock: 80,
        featured: false,
        active: true,
        categorySlug: 'seddas',
      },
      {
        name: 'Dichavador Metal 4 Partes CNC Grinder',
        description:
          'Dichavador em alumínio aeronáutico anodizado 50mm, 4 partes com tela de retenção de pólen, dentes em formato de diamante afiados e ímã de neodímio.',
        price: 79.9,
        stock: 28,
        featured: true,
        active: true,
        categorySlug: 'acessorios',
      },
      {
        name: 'Bandeja de Metal Urban Art Média',
        description:
          'Bandeja metálica com bordas curvadas antirrespingo, acabamento brilhante e arte urbana exclusiva. Dimensões: 27cm x 16cm.',
        price: 49.9,
        stock: 19,
        featured: false,
        active: true,
        categorySlug: 'acessorios',
      },
      {
        name: 'Pipe de Vidro Borossilicato Hand Pipe Spiral',
        description:
          'Pipe artesanal em vidro borossilicato de alta resistência térmica 4mm com espiral interna para resfriamento suave da fumaça.',
        price: 64.9,
        stock: 15,
        featured: true,
        active: true,
        categorySlug: 'pipes',
      },
      {
        name: 'Mini Bong de Vidro Honeycomb 18cm',
        description:
          'Water pipe compacto em vidro de alta espessura com percolador tipo colmeia (honeycomb) para excelente filtragem e suavidade.',
        price: 139.9,
        stock: 10,
        featured: false,
        active: true,
        categorySlug: 'pipes',
      },
    ]

    for (let j = 0; j < productsData.length; j++) {
      const p = productsData[j]
      try {
        app.findFirstRecordByData('products', 'name', p.name)
      } catch (_) {
        const pRecord = new Record(prodCol)
        pRecord.set('name', p.name)
        pRecord.set('description', p.description)
        pRecord.set('price', p.price)
        pRecord.set('image', null)
        pRecord.set('stock', p.stock)
        pRecord.set('featured', p.featured)
        pRecord.set('active', p.active)
        pRecord.set('category', categoryMap[p.categorySlug])
        app.save(pRecord)
      }
    }

    // 5. Seed one initial sample order for realistic admin dashboard metrics
    const orderCol = app.findCollectionByNameOrId('orders')
    try {
      app.findFirstRecordByData('orders', 'customer_name', 'Lucas Ferreira')
    } catch (_) {
      const oRecord = new Record(orderCol)
      oRecord.set('customer_name', 'Lucas Ferreira')
      oRecord.set('phone', '11988887777')
      oRecord.set('email', 'lucas.ferreira@exemplo.com')
      oRecord.set('address', 'Av. Paulista, 1000, Apto 42')
      oRecord.set('city', 'São Paulo')
      oRecord.set('state', 'SP')
      oRecord.set('cep', '01310-100')
      oRecord.set('region', 'Sudeste')
      oRecord.set('items', [
        { name: 'Vaporizador de Ervas HerbAir X Pro', quantity: 1, unit_price: 389.9 },
        { name: 'Dichavador Metal 4 Partes CNC Grinder', quantity: 1, unit_price: 79.9 },
      ])
      oRecord.set('subtotal', 469.8)
      oRecord.set('shipping', 0)
      oRecord.set('total', 469.8)
      oRecord.set('status', 'novo')
      app.save(oRecord)
    }
  },
  (app) => {
    // down logic is optional/idempotent
  },
)
