migrate(
  (app) => {
    const prodCol = app.findCollectionByNameOrId('products')

    // Mapeamento de categorias existentes
    const sedasCat = app.findFirstRecordByData('categories', 'slug', 'sedas').id
    const piteirasCat = app.findFirstRecordByData('categories', 'slug', 'piteiras').id
    const isqueirosCat = app.findFirstRecordByData('categories', 'slug', 'isqueiros-macaricos').id
    const dichavadoresCat = app.findFirstRecordByData('categories', 'slug', 'dichavadores').id
    const acessoriosCat = app.findFirstRecordByData('categories', 'slug', 'acessorios').id
    const bongsCat = app.findFirstRecordByData('categories', 'slug', 'bongs-pipes').id

    // Helper interno para criar ou atualizar produtos de forma idempotente
    function upsertProduct(item) {
      let rec = null
      try {
        rec = app.findFirstRecordByData('products', 'name', item.name)
        rec.set('description', item.description)
        rec.set('price', item.price)
        rec.set('stock', item.stock || 40)
        rec.set('featured', !!item.featured)
        rec.set('active', true)
        rec.set('category', item.categoryId)
        app.save(rec)
      } catch (_) {
        rec = new Record(prodCol)
        rec.set('name', item.name)
        rec.set('description', item.description)
        rec.set('price', item.price)
        rec.set('image', null)
        rec.set('stock', item.stock || 40)
        rec.set('featured', !!item.featured)
        rec.set('active', true)
        rec.set('category', item.categoryId)
        app.save(rec)
      }
      return rec
    }

    // Helper interno para renomear produto existente preservando ID e links
    function renameProduct(oldName, newName, updates = {}) {
      try {
        const rec = app.findFirstRecordByData('products', 'name', oldName)
        rec.set('name', newName)
        if (updates.description) rec.set('description', updates.description)
        if (updates.price !== undefined) rec.set('price', updates.price)
        if (updates.featured !== undefined) rec.set('featured', updates.featured)
        if (updates.categoryId) rec.set('category', updates.categoryId)
        rec.set('active', true)
        app.save(rec)
      } catch (_) {
        // Se já foi renomeado ou não encontrado com o nome antigo, garante com upsert
        upsertProduct({
          name: newName,
          description: updates.description || newName,
          price: updates.price || 25.0,
          stock: 40,
          featured: !!updates.featured,
          categoryId: updates.categoryId || acessoriosCat,
        })
      }
    }

    // ==========================================
    // 1. AJUSTES / RECONCILIAÇÃO DE ITENS EXISTENTES
    // ==========================================

    // Pote Hermético Plástico: ajustar 50ml -> 5ml, 100ml -> 10ml, 250ml -> 15ml conforme anotação "Plástico - 5ml, - 10ml, - 15ml"
    renameProduct('Pote Hermético Plástico 50ml', 'Pote Hermético Plástico 5ml', {
      description:
        'Pote hermético de plástico compacto 5ml com trava e vedação hermética contra odor e umidade.',
      price: 6.0,
      categoryId: acessoriosCat,
    })
    renameProduct('Pote Hermético Plástico 100ml', 'Pote Hermético Plástico 10ml', {
      description:
        'Pote hermético de plástico 10ml com fechamento antiodor e trava segura para transporte diário.',
      price: 8.0,
      categoryId: acessoriosCat,
    })
    renameProduct('Pote Hermético Plástico 250ml', 'Pote Hermético Plástico 15ml', {
      description:
        'Pote hermético de plástico 15ml com fecho de alta pressão que preserva a cura e o aroma.',
      price: 11.0,
      categoryId: acessoriosCat,
    })

    // Pote Hermético Premium Diferenciado -> Pote Hermético UV Quartz 50ml
    renameProduct('Pote Hermético Premium Diferenciado', 'Pote Hermético UV Quartz 50ml', {
      description:
        'Vidro quartzo ultravioleta fotoprotetor 50ml com vedação a vácuo contra luz e oxidação.',
      price: 38.0,
      featured: true,
      categoryId: acessoriosCat,
    })

    // Porta Beck / Guarda Ocklinas (cases de beck)
    renameProduct('Porta Beck King Size Básico', 'Guarda Ocklinas King Size Plástico', {
      description:
        'Case protetor / mocó porta beck king size em plástico durável com tampa hermética antiodor.',
      price: 10.0,
      categoryId: acessoriosCat,
    })
    renameProduct('Porta Beck Longa para Seda Longa', 'Guarda Ocklinas Longo Plástico', {
      description:
        'Case protetor porta beck estendido para sedas longas em plástico resistente antiodor.',
      price: 14.0,
      categoryId: acessoriosCat,
    })
    renameProduct('Porta Beck Triplo', 'Guarda Ocklinas Triplo Plástico', {
      description:
        'Case organizador porta beck triplo em plástico com compartimentos individuais herméticos.',
      price: 22.0,
      categoryId: acessoriosCat,
    })

    // Pré-bolados (Preroll 3 e 6 hemp)
    renameProduct('Pré-Bolado Seda King Size', 'Preroll Hemp King Size 3 Unidades', {
      description:
        'Pack com 3 cones pré-enrolados de cânhamo (hemp) 100% natural com piteiras inclusas.',
      price: 14.0,
      categoryId: acessoriosCat,
    })
    renameProduct('Pré-Bolado Seda Longa', 'Preroll Hemp King Size 6 Unidades', {
      description:
        'Pack econômico com 6 cones pré-enrolados de hemp de queima suave e combustão uniforme.',
      price: 24.0,
      featured: true,
      categoryId: acessoriosCat,
    })

    // Maçarico GTI Type
    renameProduct('Isqueiro Maçarico Cano', 'Isqueiro Maçarico GTI Type', {
      description:
        'Maçarico estilo pistola / cano GTI Type recarregável de chama jet flame concentrada e trava contínua.',
      price: 45.0,
      featured: true,
      categoryId: isqueirosCat,
    })
    // Ajustar maçaricos P e G
    renameProduct('Isqueiro Maçarico Barato', 'Isqueiro Maçarico P', {
      description:
        'Maçarico de bolso compacto tamanho P, recarregável a gás butano de chama regulável potente.',
      price: 18.0,
      categoryId: isqueirosCat,
    })
    renameProduct('Isqueiro Maçarico Grande', 'Isqueiro Maçarico G', {
      description:
        'Maçarico profissional tamanho G de alta capacidade com base estável, chama dupla e trava.',
      price: 65.0,
      featured: true,
      categoryId: isqueirosCat,
    })

    // Bongs da Folha 1: Micro Bong e Percobator (percolador)
    renameProduct('Bong de Vidro Micro', 'Micro Bong de Vidro Borossilicato', {
      description:
        'Micro bong compacto portátil em vidro borossilicato com downstem e bowl inclusos.',
      price: 85.0,
      categoryId: bongsCat,
    })
    renameProduct('Bong de Vidro Percolador', 'Bong de Vidro Percobator', {
      description:
        'Bong de vidro borossilicato de alto desempenho com sistema de filtragem e resfriamento Percobator.',
      price: 279.0,
      featured: true,
      categoryId: bongsCat,
    })

    // Piteiras: Longo, Super Longo, Bala Classic (RAW Classic)
    renameProduct('Piteira de Papel Ultra', 'Piteira de Papel Super Longo', {
      description:
        'Piteira de papel perfurada formato super longo para máxima redução de danos e resfriamento.',
      price: 8.0,
      featured: true,
      categoryId: piteirasCat,
    })
    renameProduct('Piteira de Papel Large', 'Piteira de Papel Longo', {
      description: 'Piteira de papel extra longa com picote firme que facilita o enrolamento.',
      price: 6.5,
      categoryId: piteirasCat,
    })

    // Dichavadores de plástico da Folha 2
    renameProduct('Dichavador Plástico P', 'Dichavador Plástico Pequeno 2 Partes', {
      description:
        'Dichavador de policarbonato resistente tamanho pequeno em 2 partes com dentes piramidais afiados.',
      price: 12.0,
      categoryId: dichavadoresCat,
    })
    renameProduct('Dichavador Plástico M', 'Dichavador Plástico Medium 3 Partes', {
      description:
        'Dichavador plástico tamanho médio com 3 partes e reservatório integrado para trituração uniforme.',
      price: 18.0,
      categoryId: dichavadoresCat,
    })
    renameProduct('Dichavador Plástico G', 'Dichavador Plástico Grande 3 Partes', {
      description: 'Dichavador plástico reforçado tamanho grande em 3 partes de alta capacidade.',
      price: 24.0,
      categoryId: dichavadoresCat,
    })

    // Cinzeiro Silicone Anti-Impacto -> Cinzeiro Silicone Redondo 3 Cores
    renameProduct('Cinzeiro Silicone Anti-Impacto', 'Cinzeiro Silicone Redondo 3 Cores', {
      description:
        'Cinzeiro de silicone anti-impacto redondo disponível nas cores Verde, Roxo e Preto com suportes integrados.',
      price: 28.0,
      featured: true,
      categoryId: acessoriosCat,
    })

    // ==========================================
    // 2. NOVOS PRODUTOS A CRIAR CONFORME AS ANOTAÇÕES
    // ==========================================

    const newProductsToCreate = [
      // --- FOLHA 1 ---
      // Potes UV Quartz restantes: 150ml, 250ml, 500ml, 1000ml (o 50ml já foi renomeado acima)
      {
        name: 'Pote Hermético UV Quartz 150ml',
        description:
          'Pote hermético em vidro violeta UV Quartz 150ml com proteção fotossensível total contra luz e raios solares.',
        price: 54.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Pote Hermético UV Quartz 250ml',
        description:
          'Vidro UV Quartz 250ml para cura prolongada e estocagem com tampa hermética de rosca a vácuo.',
        price: 72.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Pote Hermético UV Quartz 500ml',
        description:
          'Pote de alta capacidade 500ml em quartzo UV antiodor para armazenamento seguro e conservação de terpenos.',
        price: 98.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Pote Hermético UV Quartz 1000ml',
        description:
          'Grande capacidade 1 Litro (1000ml) em vidro ultravioleta com anel de silicone para vedação profissional absoluta.',
        price: 145.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      // Guarda Ocklinas king size metal com gasket (cristal)
      {
        name: 'Guarda Ocklinas King Size Metal com Gasket',
        description:
          'Case de metal rígido king size com vedação gasket de silicone hermética e interior anti-impacto (linha cristal).',
        price: 36.0,
        featured: true,
        categoryId: acessoriosCat,
      },
      // Piteira RAW / Bala Classic
      {
        name: 'Piteira de Papel Bala Classic',
        description:
          'Livreto de piteiras de papel natural não branqueado estilo Classic com picote tradicional para piteiras perfeitas.',
        price: 6.0,
        featured: true,
        categoryId: piteirasCat,
      },

      // --- FOLHA 2 ---
      // Rolling Tray P, M, G (2 desenhos/tamanhos)
      {
        name: 'Rolling Tray Metal P 2 Desenhos',
        description:
          'Bandeja rolling tray de metal tamanho P (pequena) com bordas arredondadas e 2 opções de estampas exclusivas.',
        price: 26.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Rolling Tray Metal M 2 Desenhos',
        description:
          'Bandeja rolling tray de metal tamanho M (média) com acabamento esmaltado liso e artes exclusivas.',
        price: 38.0,
        featured: true,
        categoryId: acessoriosCat,
      },
      {
        name: 'Rolling Tray Metal G 2 Desenhos',
        description:
          'Bandeja rolling tray de metal tamanho G (grande) para bancada com ampla área e estampas marcantes.',
        price: 52.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      // Ziplock matte (fullprint com janela, 100-120 micras)
      {
        name: 'Ziplock Matte Pequeno 3.5g Fullprint com Janela',
        description:
          'Embalagem ziplock matte hermética premium 100-120 micras para até 3,5g, fullprint antiodor com visor transparente.',
        price: 4.5,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Ziplock Matte Medium 7g Fullprint com Janela',
        description:
          'Embalagem ziplock matte resistente 100-120 micras para 7g, estampa fullprint com janela e fechamento hermético.',
        price: 6.0,
        featured: true,
        categoryId: acessoriosCat,
      },
      {
        name: 'Ziplock Matte Grande 14g Fullprint com Janela',
        description:
          'Saco ziplock matte barreira total de 14g com acabamento aveludado, visor frontal e solda reforçada.',
        price: 8.5,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Ziplock Matte Grande 28g Fullprint com Janela',
        description:
          'Ziplock antiodor tamanho 1 onça (28g) acabamento matte com visor para estocagem e cura impecável.',
        price: 11.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      // Mocó Tubo–Cone plástico durável
      {
        name: 'Mocó Tubo-Cone de Plástico Durável',
        description:
          'Porta beck / mocó rígido formato tubo cônico em polímero resistente a impactos com tampa sob pressão hermética.',
        price: 9.0,
        featured: true,
        categoryId: acessoriosCat,
      },

      // --- FOLHA 3 ---
      // Cinzeiro Silicone Quadrado 3 cores
      {
        name: 'Cinzeiro Silicone Quadrado 3 Cores',
        description:
          'Cinzeiro de silicone formato quadrado inquebrável nas cores Verde, Roxo e Preto com encaixes de apoio laterais.',
        price: 29.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      // Cinzeiro Turn Off (3 cores: Verde, Roxo, Preto)
      {
        name: 'Cinzeiro Turn Off Extintor 3 Cores',
        description:
          'Cinzeiro portátil Turn Off com orifício extintor instantâneo que apaga a brasa na hora sem espalhar fumaça. Cores: Verde, Roxo, Preto.',
        price: 35.0,
        featured: true,
        categoryId: acessoriosCat,
      },
      // Cinzeiro de Vidro 2 modelos (Mix Granado e Budzão)
      {
        name: 'Cinzeiro de Vidro Mix Granado',
        description:
          'Cinzeiro pesado em vidro espesso com arte estilizada Mix Granado e ranhuras profundas de descanso.',
        price: 36.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Cinzeiro de Vidro Budzão',
        description:
          'Cinzeiro robusto em vidro borossilicato com estampa temática Budzão e acabamento brilhante fácil de limpar.',
        price: 38.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      // Cinzeiro da Crystal
      {
        name: 'Cinzeiro Crystal Lapidado',
        description:
          'Cinzeiro clássico de cristal lapidado de alta transparência com peso estável e design refinado.',
        price: 49.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      // Tapete de Extração Small e Medium (cor única)
      {
        name: 'Tapete de Extração Silicone Small',
        description:
          'Tapete dab mat antiaderente de silicone platinum tamanho Small (pequeno) em cor única para manuseio limpo de ceras e óleos.',
        price: 25.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Tapete de Extração Silicone Medium',
        description:
          'Tapete dab mat de silicone culinário grau médico tamanho Medium (médio) para bancada de dabs e manipulação.',
        price: 38.0,
        featured: true,
        categoryId: acessoriosCat,
      },
      // Espátula Básico
      {
        name: 'Espátula Básica para Extração em Inox',
        description:
          'Ferramenta dabber básica em aço inoxidável com ponta de precisão para manipulação de concentrados sem desperdício.',
        price: 16.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      // Reservatório de Vidro: sem divisória e com divisória - redondo e quadrado
      {
        name: 'Reservatório de Vidro Redondo Sem Divisória',
        description:
          'Pote reservatório de vidro borossilicato formato redondo liso com tampa de vedação hermética.',
        price: 22.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Reservatório de Vidro Redondo Com Divisória',
        description:
          'Reservatório de vidro redondo com partição central para separar duas variedades na mesma embalagem.',
        price: 27.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Reservatório de Vidro Quadrado Sem Divisória',
        description: 'Pote reservatório em vidro geométrico quadrado com tampa hermética selada.',
        price: 24.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Reservatório de Vidro Quadrado Com Divisória',
        description:
          'Pote quadrado em vidro grosso com divisória interna dupla para organização prática.',
        price: 29.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      // Anti Rato
      {
        name: 'Anti Rato / Trava Antiodor e Acesso',
        description:
          'Dispositivo protetor / trava de segurança tipo anti-rato para armazenar insumos e kits com vedação impenetrável.',
        price: 19.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      // Escova Limpa Piteira
      {
        name: 'Escova Limpa Piteira e Tubos',
        description:
          'Escova fina com cerdas de nylon e arame flexível em inox, essencial para higienizar piteiras de vidro e bicos com álcool 70%.',
        price: 8.5,
        featured: true,
        categoryId: acessoriosCat,
      },
      // Bicucena / Bilha / Bico Limpador
      {
        name: 'Bicucena Desentupidora de Piteiras',
        description:
          'Haste metálica de precisão / bicucena com bico afilado para raspagem e desobstrução rápida de piteiras e pipes.',
        price: 12.0,
        featured: false,
        categoryId: acessoriosCat,
      },

      // --- FOLHA 4: LISTA COMPLETA ---
      // Grinders da lista completa
      {
        name: 'Grinder de Metal 5 Peças',
        description:
          'Triturador de alta performance em liga metálica 5 partes com compartimento extra de filtragem e espátula raspadora.',
        price: 85.0,
        featured: true,
        categoryId: dichavadoresCat,
      },
      {
        name: 'Grinder de Plástico Acrílico',
        description:
          'Dichavador grinder em acrílico resistente com fechamento magnético e dentes triangulares afiados.',
        price: 15.0,
        featured: false,
        categoryId: dichavadoresCat,
      },
      {
        name: 'Grinder de Plástico Eco Biodegradável',
        description:
          'Dichavador sustentável feito em fibra vegetal eco-friendly reciclável com trituração homogênea.',
        price: 18.0,
        featured: false,
        categoryId: dichavadoresCat,
      },
      // Cuias da Folha 4
      {
        name: 'Cuia de Silicone Mini',
        description:
          'Cuia em silicone platinum tamanho mini super maleável, perfeita para sessões individuais e transporte discreto.',
        price: 8.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Cuia de Silicone Estampada',
        description:
          'Cuia antiaderente flexível com ilustrações exclusivas em alta definição resistente ao calor e lavável.',
        price: 22.0,
        featured: true,
        categoryId: acessoriosCat,
      },
      {
        name: 'Cuia Mexer para Mistura e Picote',
        description:
          'Cuia ergonômica com fundo arredondado e bordas altas projetada especificamente para homogeneizar o tabaco ou flores.',
        price: 25.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      // Tesouras da Folha 4
      {
        name: 'Tesoura Trims para Poda e Manicure',
        description:
          'Tesoura tipo tesourinha de mola / trims com retorno automático e ponta afiada para corte rápido de caules e folhas.',
        price: 28.0,
        featured: true,
        categoryId: acessoriosCat,
      },
      // Filtros
      {
        name: 'Filtro Tradicional para Tabaco',
        description:
          'Pacote com filtros biodegradáveis tradicionais para enrolar cigarros com excelente retenção de alcatrão.',
        price: 9.0,
        featured: false,
        categoryId: piteirasCat,
      },
      {
        name: 'Filtro Carvão Ativado em Pó',
        description:
          'Filtro com microgrânulos de carvão ativado em pó que neutralizam impurezas e amenizam a temperatura da fumaça.',
        price: 19.0,
        featured: false,
        categoryId: piteirasCat,
      },
      {
        name: 'Filtro Carvão Ativado Longo',
        description:
          'Filtro extra longo com miolo duplo de carvão ativado para máxima pureza, fluxo desimpedido e sabor intacto.',
        price: 22.0,
        featured: true,
        categoryId: piteirasCat,
      },
      // Cinzeiros Folha 4: metal bala, smoking P e G, vidro redondo
      {
        name: 'Cinzeiro Metal Bala',
        description:
          'Cinzeiro metálico colecionável em formato estilizado de projétil / bala com tampa e cavidades de apoio.',
        price: 32.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Cinzeiro Smoking P',
        description: 'Cinzeiro metálico oficial tamanho P com estampa clássica da marca Smoking.',
        price: 24.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Cinzeiro Smoking G',
        description:
          'Cinzeiro de mesa metálico tamanho G com bordas fundas da linha original Smoking.',
        price: 36.0,
        featured: false,
        categoryId: acessoriosCat,
      },
      {
        name: 'Cinzeiro Vidro Redondo Clássico',
        description:
          'Cinzeiro espesso de vidro transparente com 4 descansos de cigarro de perfil redondo.',
        price: 25.0,
        featured: false,
        categoryId: acessoriosCat,
      },
    ]

    for (let j = 0; j < newProductsToCreate.length; j++) {
      upsertProduct(newProductsToCreate[j])
    }
  },
  (app) => {
    // down opcional
  },
)
