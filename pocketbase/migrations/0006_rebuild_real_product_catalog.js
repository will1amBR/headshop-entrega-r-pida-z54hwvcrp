migrate(
  (app) => {
    const catCol = app.findCollectionByNameOrId('categories')
    const prodCol = app.findCollectionByNameOrId('products')

    // 1. Criar ou atualizar categorias para refletir a nova estrutura
    // Categorias desejadas:
    // - Sedas (slug: sedas) - atualiza ou cria
    // - Piteiras (slug: piteiras)
    // - Isqueiros & Maçaricos (slug: isqueiros-macaricos)
    // - Dichavadores (slug: dichavadores)
    // - Acessórios (slug: acessorios)
    // - Bongs & Pipes (slug: bongs-pipes ou pipes)
    // - Vaporizadores (slug: vaporizadores) - mantida

    const categoriesToEnsure = [
      { name: 'Sedas', slug: 'sedas' },
      { name: 'Piteiras', slug: 'piteiras' },
      { name: 'Isqueiros & Maçaricos', slug: 'isqueiros-macaricos' },
      { name: 'Dichavadores', slug: 'dichavadores' },
      { name: 'Acessórios', slug: 'acessorios' },
      { name: 'Bongs & Pipes', slug: 'bongs-pipes' },
      { name: 'Vaporizadores', slug: 'vaporizadores' },
    ]

    // Se já existia 'seddas', vamos renomear ou manter o mapeamento
    try {
      const oldSeddas = app.findFirstRecordByData('categories', 'slug', 'seddas')
      oldSeddas.set('name', 'Sedas')
      oldSeddas.set('slug', 'sedas')
      app.save(oldSeddas)
    } catch (_) {}

    // Se já existia 'pipes', vamos renomear para 'Bongs & Pipes' com slug 'bongs-pipes'
    try {
      const oldPipes = app.findFirstRecordByData('categories', 'slug', 'pipes')
      oldPipes.set('name', 'Bongs & Pipes')
      oldPipes.set('slug', 'bongs-pipes')
      app.save(oldPipes)
    } catch (_) {}

    const catMap = {}
    for (let i = 0; i < categoriesToEnsure.length; i++) {
      const c = categoriesToEnsure[i]
      let rec = null
      try {
        rec = app.findFirstRecordByData('categories', 'slug', c.slug)
        rec.set('name', c.name)
        app.save(rec)
      } catch (_) {
        rec = new Record(catCol)
        rec.set('name', c.name)
        rec.set('slug', c.slug)
        rec.set('image', null)
        app.save(rec)
      }
      catMap[c.slug] = rec.id
    }

    // 2. Desativar com segurança os produtos legados do seed inicial (24 produtos antigos)
    const oldProductNames = [
      'Vaporizador de Ervas HerbAir X Pro',
      'Vaporizador Caneta Compact Slim',
      'Seda King Size Slim Organic Hemp (Caixa com 24)',
      'Seda Brown King Size Não Branqueada',
      'Dichavador Metal 4 Partes CNC Grinder',
      'Bandeja de Metal Urban Art Média',
      'Pipe de Vidro Borossilicato Hand Pipe Spiral',
      'Mini Bong de Vidro Honeycomb 18cm',
      'Vaporizador de Ervas Black Mamba Condução Térmica',
      'Vaporizador de Concentrados Wax & Dabs Portátil',
      'Vaporizador Híbrido Convecção Storm Max 2.0',
      'Bocal de Vidro Reposição para Vaporizador Portátil',
      'Seda de Vidro Borossilicato Reutilizável 75mm',
      'Piteira de Vidro Murano Artesanal 6mm com Pontas',
      'Seda King Size Slim Alfalfa Green Organics (Display c/ 20)',
      'Livreto Seda King Size + Piteiras Perfuradas Eco Brown',
      'Maçarico Recarregável Honest Torch Chama Tripla',
      'Kit Dabber de Inox 5 Peças com Case Metálico',
      'Pote Hermético Antiodor UV Glass 150ml',
      'Tapete de Silicone Antiaderente Dab Mat 20x15cm',
      'Bong de Vidro Beaker Clássico Ice Bong 26cm',
      'Pipe One Hitter de Cerâmica e Madeira Nobre',
      'Bong Bubbler Vidro Curvo com Percolador Matrix',
      'Pipe de Silicone Curado com Bowl de Vidro Removível',
    ]

    for (let o = 0; o < oldProductNames.length; o++) {
      try {
        const oldRec = app.findFirstRecordByData('products', 'name', oldProductNames[o])
        oldRec.set('active', false)
        oldRec.set('featured', false)
        app.save(oldRec)
      } catch (_) {}
    }

    // 3. Lista completa dos ~85 produtos reais transcritos fielmente do caderno
    const realProducts = [
      // === FOLHA 1: SEDAS (8 produtos) ===
      {
        name: 'Seda King Size Marrom',
        description: 'Papel marrom natural não branqueado, queima lenta e sabor preservado.',
        price: 7.5,
        stock: 50,
        featured: true,
        categorySlug: 'sedas',
      },
      {
        name: 'Seda King Size Branca',
        description: 'Papel branco de queima lenta clássico tamanho King Size.',
        price: 6.5,
        stock: 50,
        featured: false,
        categorySlug: 'sedas',
      },
      {
        name: 'Seda King Size Slim Marrom',
        description: 'Papel ultrafino marrom não refinado, padrão King Size Slim.',
        price: 8.0,
        stock: 50,
        featured: true,
        categorySlug: 'sedas',
      },
      {
        name: 'Seda King Size Slim Branca',
        description: 'Papel ultrafino branco de queima uniforme King Size Slim.',
        price: 7.0,
        stock: 50,
        featured: false,
        categorySlug: 'sedas',
      },
      {
        name: 'Seda King Size Longa Marrom',
        description: 'Papel marrom extra longo para sessões prolongadas.',
        price: 9.0,
        stock: 45,
        featured: false,
        categorySlug: 'sedas',
      },
      {
        name: 'Seda King Size Longa Branca',
        description: 'Papel branco de formato alongado com queima limpa e suave.',
        price: 8.0,
        stock: 45,
        featured: false,
        categorySlug: 'sedas',
      },
      {
        name: 'Seda King Size Slim Longa Marrom',
        description: 'Formato especial longo e estreito em papel marrom virgem.',
        price: 9.5,
        stock: 40,
        featured: false,
        categorySlug: 'sedas',
      },
      {
        name: 'Seda King Size Slim Longa Branca',
        description: 'Seda longa e slim com combustão lenta e sem cloro.',
        price: 8.5,
        stock: 40,
        featured: false,
        categorySlug: 'sedas',
      },

      // === FOLHA 1: PITEIRAS DE PAPEL (5 produtos) ===
      {
        name: 'Piteira de Papel Super',
        description: 'Piteira de papel perfurada em tamanho Super para resfriamento eficaz.',
        price: 5.0,
        stock: 60,
        featured: false,
        categorySlug: 'piteiras',
      },
      {
        name: 'Piteira de Papel Mega',
        description: 'Bloco de piteiras tamanho Mega com picote firme para enrolar fácil.',
        price: 6.0,
        stock: 60,
        featured: false,
        categorySlug: 'piteiras',
      },
      {
        name: 'Piteira de Papel Hiper',
        description: 'Piteira de espessura Hiper para redução de danos e sustentação.',
        price: 6.5,
        stock: 60,
        featured: false,
        categorySlug: 'piteiras',
      },
      {
        name: 'Piteira de Papel Ultra',
        description: 'Piteira formato Ultra longo para máxima suavidade na tragada.',
        price: 7.5,
        stock: 60,
        featured: true,
        categorySlug: 'piteiras',
      },
      {
        name: 'Piteira de Papel Large',
        description: 'Piteira larga de alta retenção térmica e excelente firmeza.',
        price: 7.0,
        stock: 60,
        featured: false,
        categorySlug: 'piteiras',
      },

      // === FOLHA 1: ISQUEIROS & MAÇARICOS (8 produtos) ===
      {
        name: 'Isqueiro Maçarico Barato',
        description: 'Maçarico compacto de chama potente com excelente custo-benefício.',
        price: 18.0,
        stock: 40,
        featured: false,
        categorySlug: 'isqueiros-macaricos',
      },
      {
        name: 'Isqueiro Maçarico Medium',
        description: 'Maçarico intermediário recarregável com trava de chama contínua.',
        price: 32.0,
        stock: 35,
        featured: true,
        categorySlug: 'isqueiros-macaricos',
      },
      {
        name: 'Isqueiro Maçarico Cano',
        description: 'Design de cano alongado para acendimento seguro e sem queimar os dedos.',
        price: 39.0,
        stock: 30,
        featured: false,
        categorySlug: 'isqueiros-macaricos',
      },
      {
        name: 'Isqueiro Maçarico Grande',
        description: 'Maçarico de alta potência com tanque grande e chama regulável.',
        price: 65.0,
        stock: 25,
        featured: true,
        categorySlug: 'isqueiros-macaricos',
      },
      {
        name: 'Isqueiro com Pedra Barato',
        description: 'Isqueiro clássico com sistema de faísca por pedra tradicional.',
        price: 5.0,
        stock: 80,
        featured: false,
        categorySlug: 'isqueiros-macaricos',
      },
      {
        name: 'Isqueiro Clipper com Pedra',
        description: 'Isqueiro Clipper recarregável original com pilão removível integrado.',
        price: 14.0,
        stock: 70,
        featured: true,
        categorySlug: 'isqueiros-macaricos',
      },
      {
        name: 'Isqueiro sem Pedra Barato',
        description: 'Isqueiro eletrônico piezoelétrico de acendimento rápido e econômico.',
        price: 6.0,
        stock: 60,
        featured: false,
        categorySlug: 'isqueiros-macaricos',
      },
      {
        name: 'Isqueiro sem Pedra Boa Qualidade',
        description: 'Isqueiro piezoelétrico premium recarregável com chama suave.',
        price: 16.0,
        stock: 45,
        featured: false,
        categorySlug: 'isqueiros-macaricos',
      },

      // === FOLHA 2: DICHAVADORES (9 produtos) ===
      {
        name: 'Dichavador Metal 2 Peças',
        description: 'Dichavador de metal resistente e compacto com dentes afiados em 2 partes.',
        price: 35.0,
        stock: 30,
        featured: false,
        categorySlug: 'dichavadores',
      },
      {
        name: 'Dichavador Metal 3 Peças',
        description: 'Dichavador em liga metálica com 3 partes e reservatório intermediário.',
        price: 49.0,
        stock: 30,
        featured: true,
        categorySlug: 'dichavadores',
      },
      {
        name: 'Dichavador Metal 4 Peças',
        description: 'Dichavador 4 partes com tela de retenção de pólen e espátula coletora.',
        price: 69.0,
        stock: 30,
        featured: true,
        categorySlug: 'dichavadores',
      },
      {
        name: 'Dichavador Plástico P',
        description: 'Dichavador de policarbonato leve tamanho Pequeno para transporte.',
        price: 12.0,
        stock: 50,
        featured: false,
        categorySlug: 'dichavadores',
      },
      {
        name: 'Dichavador Plástico M',
        description: 'Tamanho Médio tradicional com dentes resistentes e fechamento magnético.',
        price: 16.0,
        stock: 50,
        featured: false,
        categorySlug: 'dichavadores',
      },
      {
        name: 'Dichavador Plástico G',
        description: 'Tamanho Grande com alta capacidade para trituração rápida.',
        price: 22.0,
        stock: 40,
        featured: false,
        categorySlug: 'dichavadores',
      },
      {
        name: 'Dichavador Acrílico com Desenho',
        description: 'Acrílico colorido de alto impacto com estampa exclusiva na tampa.',
        price: 26.0,
        stock: 35,
        featured: false,
        categorySlug: 'dichavadores',
      },
      {
        name: 'Dichavador Diferenciado Formato Brinquedo',
        description: 'Dichavador colecionável e criativo com visual lúdico camuflado.',
        price: 42.0,
        stock: 25,
        featured: false,
        categorySlug: 'dichavadores',
      },
      {
        name: 'Dichavador Diferenciado Acessórios Nicho',
        description: 'Modelo estilizado em formato anatômico para colecionadores exigentes.',
        price: 48.0,
        stock: 25,
        featured: false,
        categorySlug: 'dichavadores',
      },

      // === FOLHA 2: CUIAS (6 produtos) ===
      {
        name: 'Cuia de Silicone Barata Mix de Cores',
        description: 'Cuia flexível e antiaderente com cores mescladas vibrantes.',
        price: 12.0,
        stock: 50,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Cuia de Silicone Barata Monocolor',
        description: 'Cuia de silicone dobrável em tom sólido clássico.',
        price: 10.0,
        stock: 50,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Cuia de Qualidade Tipo 1 Acabamento Fosco',
        description: 'Silicone platinum de alta densidade com textura aveludada premium.',
        price: 24.0,
        stock: 35,
        featured: true,
        categorySlug: 'acessorios',
      },
      {
        name: 'Cuia de Qualidade Tipo 2 Bordas Reforçadas',
        description: 'Estrutura firme com bordas espessas que facilitam a picotagem.',
        price: 26.0,
        stock: 35,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Cuia de Qualidade Tipo 3 Silicone Curado Especial',
        description: 'Silicone de grau médico com resistência térmica ultra alta.',
        price: 29.0,
        stock: 30,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Cuia Pequena de Silicone',
        description: 'Tamanho mini ultra portátil para picotar onde quer que você esteja.',
        price: 9.0,
        stock: 50,
        featured: false,
        categorySlug: 'acessorios',
      },

      // === FOLHA 2: TESOURAS (5 produtos) ===
      {
        name: 'Tesoura Sem Ponta de Metal',
        description: 'Tesoura com ponta arredondada de segurança para picotar direto na cuia.',
        price: 19.0,
        stock: 45,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Tesoura Com Ponta de Metal',
        description: 'Lâminas afiadas e pontiagudas em aço inoxidável para corte de precisão.',
        price: 21.0,
        stock: 45,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Tesoura Dobrável de Plástico',
        description: 'Tesoura retrátil leve e econômica com corpo articulável.',
        price: 12.0,
        stock: 50,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Tesoura Dobrável de Metal Barata',
        description: 'Design retrátil em aço prático e compacto para levar no bolso.',
        price: 19.0,
        stock: 40,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Tesoura Dobrável de Metal Premium',
        description: 'Acabamento refinado de corte cirúrgico com trava de segurança firme.',
        price: 34.0,
        stock: 30,
        featured: true,
        categorySlug: 'acessorios',
      },

      // === FOLHA 2: CINZEIROS (10 produtos) ===
      {
        name: 'Cinzeiro Metal Modelo 1',
        description: 'Cinzeiro metálico com pintura clássica e cavidades de descanso.',
        price: 25.0,
        stock: 30,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Cinzeiro Metal Modelo 2',
        description: 'Modelo moderno com tampa giratória corta-fumaça.',
        price: 32.0,
        stock: 30,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Cinzeiro Metal Modelo 3',
        description: 'Acabamento industrial anodizado resistente a quedas.',
        price: 38.0,
        stock: 25,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Cinzeiro Vidro Modelo 1',
        description: 'Vidro transparente espesso com design geométrico limpo.',
        price: 28.0,
        stock: 35,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Cinzeiro Vidro Modelo 2',
        description: 'Vidro lapidado com relevo elegante e ranhuras profundas.',
        price: 36.0,
        stock: 30,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Cinzeiro Vidro Modelo 3',
        description: 'Vidro fumê escuro de alta durabilidade e estilo minimalista.',
        price: 44.0,
        stock: 25,
        featured: true,
        categorySlug: 'acessorios',
      },
      {
        name: 'Cinzeiro Quartzo Modelo 1',
        description: 'Pedra de quartzo natural esculpida com visual rústico sofisticado.',
        price: 75.0,
        stock: 15,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Cinzeiro Quartzo Modelo 2',
        description: 'Quartzo polido de alto peso com bordas lapidadas à mão.',
        price: 89.0,
        stock: 15,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Cinzeiro Silicone Anti-Impacto',
        description: 'Silicone inquebrável, resistente ao calor com ranhuras multifunções.',
        price: 29.0,
        stock: 40,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Cinzeiro Cerâmica Artesanal',
        description: 'Cerâmica vitrificada com pintura resistente e fácil higienização.',
        price: 45.0,
        stock: 25,
        featured: false,
        categorySlug: 'acessorios',
      },

      // === FOLHA 2: POTES HERMÉTICOS (6 produtos) ===
      {
        name: 'Pote Hermético Plástico 50ml',
        description: 'Vedação em borracha com trava lateral para conservar até 50ml.',
        price: 12.0,
        stock: 50,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Pote Hermético Plástico 100ml',
        description: 'Mantém o aroma e a umidade natural do fumo com fechamento a vácuo.',
        price: 16.0,
        stock: 50,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Pote Hermético Plástico 250ml',
        description: 'Tamanho intermediário para armazenamento seguro sem passagem de odores.',
        price: 22.0,
        stock: 40,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Pote Hermético Plástico 500ml',
        description: 'Capacidade ampliada de 500ml com trava reforçada e vedação total.',
        price: 28.0,
        stock: 35,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Pote Hermético Plástico 750ml',
        description: 'Armazenamento de grande volume com proteção antiodor completa.',
        price: 36.0,
        stock: 30,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Pote Hermético Premium Diferenciado',
        description: 'Modelo especial com vidro UV fotoprotetor e medidor de umidade acoplado.',
        price: 68.0,
        stock: 20,
        featured: true,
        categorySlug: 'acessorios',
      },

      // === FOLHA 2: PRÉ-BOLADOS (4 produtos) ===
      {
        name: 'Pré-Bolado Blunt Sem Sabor',
        description: 'Cone pré-enrolado de folha blunt natural sem aromatizantes artificiais.',
        price: 15.0,
        stock: 45,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Pré-Bolado Blunt Com Sabor',
        description: 'Cone pré-bolado blunt com infusão aromática suave para maior paladar.',
        price: 18.0,
        stock: 45,
        featured: true,
        categorySlug: 'acessorios',
      },
      {
        name: 'Pré-Bolado Seda King Size',
        description: 'Cone pronto de seda ultrafina King Size com piteira instalada.',
        price: 12.0,
        stock: 55,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Pré-Bolado Seda Longa',
        description: 'Cone longo pronto para preencher com queima lenta e homogênea.',
        price: 14.0,
        stock: 50,
        featured: false,
        categorySlug: 'acessorios',
      },

      // === FOLHA 3: PORTA BECK (5 produtos) ===
      {
        name: 'Porta Beck Triplo',
        description: 'Tubo antiodor com 3 compartimentos individuais com vedação hermética.',
        price: 22.0,
        stock: 40,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Porta Beck King Size Silicone',
        description: 'Case emborrachado flexível e impermeável para cigarros King Size.',
        price: 18.0,
        stock: 40,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Porta Beck King Size Básico',
        description: 'Porta beck rígido com tampa hermética protetora contra amassados.',
        price: 12.0,
        stock: 60,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Porta Beck King Size Cerâmica',
        description: 'Tubo térmico de acabamento cerâmico que evita qualquer cheiro externo.',
        price: 32.0,
        stock: 25,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Porta Beck Longa para Seda Longa',
        description: 'Formato especial estendido compatível com sedas longas.',
        price: 16.0,
        stock: 45,
        featured: false,
        categorySlug: 'acessorios',
      },

      // === FOLHA 3: SLICKS (8 produtos) ===
      {
        name: 'Slick Silicone 2ml',
        description: 'Mini pote de silicone platinum antiaderente de 2ml para extrações.',
        price: 8.0,
        stock: 60,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Slick Silicone 5ml',
        description: 'Pote antiaderente de silicone puro 5ml com fechamento perfeito.',
        price: 12.0,
        stock: 60,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Slick Silicone 7ml',
        description: 'Capacidade de 7ml para armazenamento seguro e sem desperdício.',
        price: 15.0,
        stock: 50,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Slick Silicone 9ml',
        description: 'Tamanho médio de 9ml com corpo emborrachado de alta aderência.',
        price: 18.0,
        stock: 45,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Slick Silicone 15ml',
        description: 'Grande capacidade de 15ml com resistência térmica e química.',
        price: 25.0,
        stock: 40,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Slick de Vidro Sem Divisória',
        description: 'Pote em vidro borossilicato com tampa hermética lisa interna.',
        price: 22.0,
        stock: 35,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Slick de Vidro Com 2 Divisórias',
        description: 'Compartimento duplo interno em vidro para guardar 2 tipos diferentes.',
        price: 28.0,
        stock: 35,
        featured: true,
        categorySlug: 'acessorios',
      },
      {
        name: 'Slick de Vidro Com 3 Divisórias',
        description: 'Organizador em vidro borossilicato com 3 divisões internas e tampa silicone.',
        price: 34.0,
        stock: 30,
        featured: false,
        categorySlug: 'acessorios',
      },

      // === FOLHA 3: PITEIRAS DE VIDRO (8 produtos) ===
      {
        name: 'Piteira de Vidro Full Print 5mm',
        description: 'Vidro borossilicato com estampa full print colorida de 5mm de diâmetro.',
        price: 22.0,
        stock: 40,
        featured: false,
        categorySlug: 'piteiras',
      },
      {
        name: 'Piteira de Vidro Full Print 6mm',
        description: 'Estampa contínua estilizada de 6mm lavável e reutilizável.',
        price: 24.0,
        stock: 40,
        featured: true,
        categorySlug: 'piteiras',
      },
      {
        name: 'Piteira de Vidro Full Print 7mm',
        description: 'Vidro grosso estampado com 7mm e travas internas para fluxo suave.',
        price: 26.0,
        stock: 35,
        featured: false,
        categorySlug: 'piteiras',
      },
      {
        name: 'Piteira de Vidro Básica 5mm',
        description: 'Piteira de vidro cristal fino 5mm que resfria a fumaça de forma limpa.',
        price: 12.0,
        stock: 50,
        featured: false,
        categorySlug: 'piteiras',
      },
      {
        name: 'Piteira de Vidro Básica 6mm',
        description: 'Diâmetro padrão 6mm com bocal ergonômico e encaixe perfeito.',
        price: 14.0,
        stock: 50,
        featured: false,
        categorySlug: 'piteiras',
      },
      {
        name: 'Piteira de Vidro Básica 7mm',
        description: 'Formato mais encorpado de 7mm em borossilicato transparente.',
        price: 16.0,
        stock: 45,
        featured: false,
        categorySlug: 'piteiras',
      },
      {
        name: 'Piteira de Vidro Básica 8mm',
        description: 'Super fluxo 8mm para quem prefere resfriamento máximo na sessão.',
        price: 18.0,
        stock: 40,
        featured: false,
        categorySlug: 'piteiras',
      },
      {
        name: 'Piteira de Vidro Artística Especial',
        description: 'Trabalho artesanal em vidro Murano com detalhes coloridos exclusivos.',
        price: 36.0,
        stock: 25,
        featured: true,
        categorySlug: 'piteiras',
      },

      // === FOLHA 3: BANDEJAS (9 produtos) ===
      {
        name: 'Bandeja de Metal P Sem Tampa',
        description: 'Bandeja metálica compacta com bordas curvas anti-desperdício.',
        price: 25.0,
        stock: 35,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Bandeja de Metal P Com Tampa',
        description: 'Tamanho Pequeno acompanhada de tampa magnética protetora.',
        price: 38.0,
        stock: 30,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Bandeja de Metal M Sem Tampa',
        description: 'Área ideal para preparo diário com acabamento brilhante liso.',
        price: 35.0,
        stock: 40,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Bandeja de Metal M Com Tampa',
        description: 'Tamanho Médio com tampa snap magnética para fechar o kit após o uso.',
        price: 52.0,
        stock: 30,
        featured: true,
        categorySlug: 'acessorios',
      },
      {
        name: 'Bandeja de Metal G Sem Tampa',
        description: 'Bandeja ampla para organizar todos os acessórios na mesa com conforto.',
        price: 49.0,
        stock: 25,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Bandeja de Metal G Com Tampa',
        description: 'Bandeja Grande completa com tampa seladora e estampas marcantes.',
        price: 69.0,
        stock: 20,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Bandeja de Vidro Borossilicato P',
        description: 'Vidro temperado espesso fácil de limpar e livre de ranhuras.',
        price: 55.0,
        stock: 20,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Bandeja de Vidro Borossilicato M',
        description: 'Vidro borossilicato pesado e elegante com base antiderrapante.',
        price: 79.0,
        stock: 20,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Bandeja de Vidro Borossilicato G',
        description: 'Modelo master em vidro resistente ao calor para sessões completas.',
        price: 110.0,
        stock: 15,
        featured: false,
        categorySlug: 'acessorios',
      },

      // === FOLHA 3: BONGS (8 produtos) ===
      {
        name: 'Bong de Vidro Micro',
        description: 'Bong portátil de vidro borossilicato 15cm ideal para viagens.',
        price: 85.0,
        stock: 20,
        featured: false,
        categorySlug: 'bongs-pipes',
      },
      {
        name: 'Bong de Vidro Regular',
        description: 'Bong tradicional em vidro de 25cm com câmara ampla de água.',
        price: 145.0,
        stock: 20,
        featured: true,
        categorySlug: 'bongs-pipes',
      },
      {
        name: 'Bong de Vidro Grande',
        description: 'Vidraria premium de 35cm com trava de gelo tripla e base espessa.',
        price: 220.0,
        stock: 15,
        featured: false,
        categorySlug: 'bongs-pipes',
      },
      {
        name: 'Bong de Vidro Percolador',
        description: 'Sistema avançado de percolador que multiplica borbulhas e resfria a fumaça.',
        price: 279.0,
        stock: 12,
        featured: true,
        categorySlug: 'bongs-pipes',
      },
      {
        name: 'Bong de Acrílico Regular',
        description: 'Estrutura em acrílico resistente a quedas com base removível para limpeza.',
        price: 55.0,
        stock: 30,
        featured: false,
        categorySlug: 'bongs-pipes',
      },
      {
        name: 'Bong de Acrílico Grande',
        description: 'Bong longo de acrílico durável com cores fluorescentes vivas.',
        price: 75.0,
        stock: 25,
        featured: false,
        categorySlug: 'bongs-pipes',
      },
      {
        name: 'Bong de Silicone Regular',
        description: 'Corpo flexível em silicone cirúrgico com bowl de vidro embutido.',
        price: 89.0,
        stock: 25,
        featured: false,
        categorySlug: 'bongs-pipes',
      },
      {
        name: 'Bong de Silicone Grande',
        description: 'Inquebrável e desmontável em 2 partes, ideal para levar a qualquer lugar.',
        price: 129.0,
        stock: 20,
        featured: false,
        categorySlug: 'bongs-pipes',
      },

      // === FOLHA 3: CASES & KITS (10 produtos) ===
      {
        name: 'Case Kit Vazio P Sem Tampa',
        description: 'Estojo estofado organizador compacto para transporte de peças pequenas.',
        price: 28.0,
        stock: 35,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Case Kit Vazio P Com Tampa',
        description: 'Case rígido com zíper e tampa com rede protetora interna tamanho P.',
        price: 36.0,
        stock: 30,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Case Kit Vazio M Sem Tampa',
        description: 'Organizador médio de compartimento único para kit básico diário.',
        price: 38.0,
        stock: 35,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Case Kit Vazio M Com Tampa',
        description: 'Case hermético antiodor médio com fechamento por trava e estofamento.',
        price: 49.0,
        stock: 30,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Case Kit Vazio G Sem Tampa',
        description: 'Bolsa organizadora ampla de abertura total para bancada.',
        price: 52.0,
        stock: 25,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Case Kit Vazio G Com Tampa',
        description: 'Maleta case rígida grande com divisórias modulares ajustáveis.',
        price: 75.0,
        stock: 20,
        featured: false,
        categorySlug: 'acessorios',
      },
      {
        name: 'Kit Montado Básico',
        description: 'Kit pronto com case, seda, piteira de papel, cuia e isqueiro.',
        price: 59.0,
        stock: 25,
        featured: true,
        categorySlug: 'acessorios',
      },
      {
        name: 'Kit Montado Medium',
        description: 'Kit completo com case, seda king size, piteira de vidro, dichavador e cuia.',
        price: 99.0,
        stock: 20,
        featured: true,
        categorySlug: 'acessorios',
      },
      {
        name: 'Kit Montado Premium',
        description:
          'Combo master com case rígido, dichavador metal, piteira artística, maçarico e slick.',
        price: 189.0,
        stock: 15,
        featured: true,
        categorySlug: 'acessorios',
      },
      {
        name: 'Kit Montado Compacto',
        description: 'Estojo ultra slim de bolso com mini cuia, tesoura dobrável e livreto.',
        price: 49.0,
        stock: 30,
        featured: false,
        categorySlug: 'acessorios',
      },
    ]

    // 4. Salvar produtos reais no banco (idempotente por nome)
    for (let k = 0; k < realProducts.length; k++) {
      const item = realProducts[k]
      const catId = catMap[item.categorySlug]
      if (!catId) continue

      let pRec = null
      try {
        pRec = app.findFirstRecordByData('products', 'name', item.name)
        pRec.set('description', item.description)
        pRec.set('price', item.price)
        pRec.set('stock', item.stock)
        pRec.set('featured', item.featured)
        pRec.set('active', true)
        pRec.set('category', catId)
        app.save(pRec)
      } catch (_) {
        pRec = new Record(prodCol)
        pRec.set('name', item.name)
        pRec.set('description', item.description)
        pRec.set('price', item.price)
        pRec.set('image', null)
        pRec.set('stock', item.stock)
        pRec.set('featured', item.featured)
        pRec.set('active', true)
        pRec.set('category', catId)
        app.save(pRec)
      }
    }
  },
  (app) => {
    // down logic opcional
  },
)
