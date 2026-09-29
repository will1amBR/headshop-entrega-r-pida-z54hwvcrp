migrate(
  (app) => {
    // 1. Adicionar campo 'ncm' (text) na coleção products se ainda não existir
    const prodCol = app.findCollectionByNameOrId('products')
    if (!prodCol.fields.getByName('ncm')) {
      prodCol.fields.add(new TextField({ name: 'ncm', required: false }))
      app.save(prodCol)
    }

    // 2. Mapeamento de categorias
    const sedasCat = app.findFirstRecordByData('categories', 'slug', 'sedas').id
    const piteirasCat = app.findFirstRecordByData('categories', 'slug', 'piteiras').id
    const isqueirosCat = app.findFirstRecordByData('categories', 'slug', 'isqueiros-macaricos').id
    const dichavadoresCat = app.findFirstRecordByData('categories', 'slug', 'dichavadores').id
    const acessoriosCat = app.findFirstRecordByData('categories', 'slug', 'acessorios').id
    const bongsCat = app.findFirstRecordByData('categories', 'slug', 'bongs-pipes').id

    // Helper interno para upsert de produto com NCM
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
        if (item.ncm) rec.set('ncm', item.ncm)
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
        if (item.ncm) rec.set('ncm', item.ncm)
        app.save(rec)
      }
      return rec
    }

    // 3. Novos produtos transcritos das folhas do caderno
    const newProductsFromNotes = [
      // Linhas anotadas: Higher Manufacturing Hong Kong (Seda, Piteira, Dichavador, Prebolado)
      {
        name: 'Seda Colorida Higher Hong Kong',
        description:
          'Papel de seda colorido especial ultrafino. Linha Higher Manufacturing Hong Kong. Queima lenta uniforme sem sabor residual.',
        price: 9.0,
        stock: 50,
        featured: true,
        categoryId: sedasCat,
        ncm: '48131000',
      },
      {
        name: 'Seda Saborizada Higher Hong Kong',
        description:
          'Seda aromatizada de combustão suave com terpenos naturais e essências selecionadas. Linha Higher Manufacturing Hong Kong.',
        price: 11.0,
        stock: 50,
        featured: false,
        categoryId: sedasCat,
        ncm: '48131000',
      },
      {
        name: 'Seda Natural Higher Hong Kong',
        description:
          'Seda 100% natural sem branqueamento químico ou aditivos. Linha Higher Manufacturing Hong Kong em folhas selecionadas.',
        price: 8.5,
        stock: 50,
        featured: true,
        categoryId: sedasCat,
        ncm: '48131000',
      },
      {
        name: 'Seda Raw King Size Classic',
        description:
          'Seda Raw original não refinada King Size. NCM 48131000. Fibras puras naturais com marca d’água patenteada cruzada.',
        price: 9.5,
        stock: 60,
        featured: true,
        categoryId: sedasCat,
        ncm: '48131000',
      },
      {
        name: '02 Seda King Size',
        description: 'Pacote com 2 sedas King Size de queima uniforme e extra fina. NCM 48139000.',
        price: 12.0,
        stock: 40,
        featured: false,
        categoryId: sedasCat,
        ncm: '48139000',
      },
      {
        name: 'Seda Zomo King Size',
        description:
          'Papel de seda Zomo tradicional King Size com queima suave e lenta. NCM 48131000.',
        price: 7.0,
        stock: 50,
        featured: false,
        categoryId: sedasCat,
        ncm: '48131000',
      },

      // Piteiras novas das folhas
      {
        name: 'Piteira Slim Higher Hong Kong',
        description:
          'Piteira de papel formato Slim ultrafino para cigarros compactos. Linha Higher Manufacturing Hong Kong.',
        price: 5.5,
        stock: 50,
        featured: false,
        categoryId: piteirasCat,
        ncm: '48131000',
      },
      {
        name: 'Piteira de Carvão Ativado Higher',
        description:
          'Filtro e piteira com microesferas de carvão ativado para retenção de toxinas e resfriamento contínuo. Linha Higher Manufacturing Hong Kong.',
        price: 24.0,
        stock: 45,
        featured: true,
        categoryId: piteirasCat,
        ncm: '48131000',
      },
      {
        name: 'Piteira de Madeira Higher Hong Kong',
        description:
          'Piteira anatômica em madeira nobre lavável e reutilizável. Linha Higher Manufacturing Hong Kong.',
        price: 16.0,
        stock: 35,
        featured: false,
        categoryId: piteirasCat,
        ncm: '96140000',
      },
      {
        name: 'Piteira Yellow Finger Madeira',
        description:
          'Piteira artesanal Yellow Finger em madeira especial de reflorestamento. NCM 96140000. Redução de danos com fluxo impecável.',
        price: 18.0,
        stock: 40,
        featured: true,
        categoryId: piteirasCat,
        ncm: '96140000',
      },
      {
        name: 'Piteira Girls in Green Biodegradável',
        description:
          'Piteira ecológica e sustentável Girls in Green em algodão/fibras virgens. NCM 56012291.',
        price: 14.0,
        stock: 45,
        featured: true,
        categoryId: piteirasCat,
        ncm: '56012291',
      },
      {
        name: 'Piteira de Papel com Sabor Higher',
        description:
          'Livreto de piteiras perfuradas com leve aroma e sabor adocicado. Linha Higher Manufacturing Hong Kong.',
        price: 7.0,
        stock: 40,
        featured: false,
        categoryId: piteirasCat,
        ncm: '48131000',
      },
      {
        name: 'Piteiras Coloridas Higher Hong Kong',
        description:
          'Piteiras de papel perfurado em tons vibrantes sortidos. Linha Higher Manufacturing Hong Kong.',
        price: 6.5,
        stock: 45,
        featured: false,
        categoryId: piteirasCat,
        ncm: '48131000',
      },

      // Dichavadores novos
      {
        name: 'Dichavador Elétrico Higher Hong Kong',
        description:
          'Dichavador elétrico recarregável USB com lâminas afiadas de alta velocidade. Linha Higher Manufacturing Hong Kong. NCM 84781090.',
        price: 99.0,
        stock: 25,
        featured: true,
        categoryId: dichavadoresCat,
        ncm: '84781090',
      },
      {
        name: 'Dichavador Plástico Clássico Strain Hunters',
        description:
          'Dichavador de plástico resistente clássico Strain Hunters com dentes piramidais e fecho magnético. NCM 84781090.',
        price: 18.0,
        stock: 45,
        featured: true,
        categoryId: dichavadoresCat,
        ncm: '84781090',
      },
      {
        name: 'Dichavador de Zinco 4 Partes Higher',
        description:
          'Dichavador pesado em liga de zinco ultra resistente de 4 peças com tela coletora. Linha Higher Manufacturing Hong Kong. NCM 84781090.',
        price: 58.0,
        stock: 30,
        featured: true,
        categoryId: dichavadoresCat,
        ncm: '84781090',
      },
      {
        name: 'Desfiador Bem Bolado Manual',
        description: 'Desfiador / triturador prático Bem Bolado para tabaco e ervas. NCM 82100010.',
        price: 15.0,
        stock: 50,
        featured: false,
        categoryId: dichavadoresCat,
        ncm: '82100010',
      },
      {
        name: 'Grinder Metal 4 Partes Higher HK',
        description:
          'Grinder metálico CNC de 4 partes com tela de pólen e espátula raspadora. Linha Higher Manufacturing Hong Kong. NCM 84781090.',
        price: 69.0,
        stock: 35,
        featured: true,
        categoryId: dichavadoresCat,
        ncm: '84781090',
      },

      // Bandejas, Tin Cases e Acessórios Metal / Vidro
      {
        name: 'Bandeja Raw Metal de Enrolar',
        description:
          'Bandeja metálica clássica original Raw com bordas curvas anti-desperdício. NCM 83062900.',
        price: 45.0,
        stock: 30,
        featured: true,
        categoryId: acessoriosCat,
        ncm: '83062900',
      },
      {
        name: 'Raw Tin Case Caixa Metálica',
        description:
          'Lata organizadora / porta kit Raw Tin Box em folha de flandres para guardar sedas, piteiras e fumo. NCM 83062900.',
        price: 28.0,
        stock: 35,
        featured: true,
        categoryId: acessoriosCat,
        ncm: '83062900',
      },
      {
        name: 'Raw Cuia de Silicone Flexível',
        description:
          'Cuia original Raw com interior antiaderente e acabamento de alta precisão. NCM 39249000.',
        price: 26.0,
        stock: 35,
        featured: true,
        categoryId: acessoriosCat,
        ncm: '39249000',
      },
      {
        name: 'Raw Cinzeiro de Vidro Cristal',
        description:
          'Cinzeiro pesado original Raw em vidro temperado resistente ao calor com descansos integrados. NCM 70139900.',
        price: 55.0,
        stock: 25,
        featured: true,
        categoryId: acessoriosCat,
        ncm: '70139900',
      },
      {
        name: 'Raw Caneca de Cerâmica Coletora',
        description:
          'Caneca colecionável Raw em cerâmica esmaltada premium para café e sessão. NCM 69120000.',
        price: 49.0,
        stock: 25,
        featured: false,
        categoryId: acessoriosCat,
        ncm: '69120000',
      },
      {
        name: 'Beck Tube Mocó Alumínio Antiodor',
        description:
          'Tubo porta beck / mocó protetor usinado em alumínio aeronáutico com rosca e anel de vedação o-ring. NCM 83062900.',
        price: 25.0,
        stock: 45,
        featured: true,
        categoryId: acessoriosCat,
        ncm: '83062900',
      },
      {
        name: 'Isqueiro Raw Clipper Recarregável',
        description:
          'Isqueiro Clipper oficial Raw recarregável a gás butano com pilão removível para prensar cigarros. NCM 96132000.',
        price: 16.0,
        stock: 60,
        featured: true,
        categoryId: isqueirosCat,
        ncm: '96132000',
      },
      {
        name: 'Puff Case Estojo Antiodor Kit',
        description:
          'Estojo rígido estofado Puff Case com zíper selado antiodor e rede organizadora para kit completo. NCM 42022900.',
        price: 68.0,
        stock: 30,
        featured: true,
        categoryId: acessoriosCat,
        ncm: '42022900',
      },
      {
        name: 'Raw Tote Bag Sacola Ecológica',
        description:
          'Bolsa ecobag Raw Tote Bag confeccionada em algodão rústico reforçado para transporte de kits e insumos. NCM 42029200.',
        price: 39.0,
        stock: 25,
        featured: false,
        categoryId: acessoriosCat,
        ncm: '42029200',
      },
      {
        name: 'Raw Cone Inflável Promocional',
        description:
          'Cone gigante decorativo inflável Raw para eventos, vitrine e decoração temática. NCM 39249000.',
        price: 89.0,
        stock: 15,
        featured: false,
        categoryId: acessoriosCat,
        ncm: '39249000',
      },
      {
        name: 'Bandeja Lion Rolling Circus Metal',
        description:
          'Bandeja metálica Lion Rolling Circus estampada com acabamento esmaltado brilhante. NCM 73239900.',
        price: 42.0,
        stock: 30,
        featured: true,
        categoryId: acessoriosCat,
        ncm: '73239900',
      },
      {
        name: 'Bandeja Lion Vidro Borossilicato',
        description:
          'Bandeja de bancada Lion em vidro grosso lapidado de alta transparência e fácil higienização. NCM 70139900.',
        price: 78.0,
        stock: 20,
        featured: true,
        categoryId: acessoriosCat,
        ncm: '70139900',
      },
      {
        name: 'Cinzeiro Lion Metal',
        description:
          'Cinzeiro metálico oficial Lion Rolling Circus com descansos de cigarro. NCM 73239900.',
        price: 29.0,
        stock: 35,
        featured: false,
        categoryId: acessoriosCat,
        ncm: '73239900',
      },
      {
        name: 'Lion Hemp Wrap Terpeno',
        description:
          'Wrap de cânhamo sem tabaco infundido com terpenos aromáticos para queima extra lenta. NCM 48131000.',
        price: 18.0,
        stock: 45,
        featured: true,
        categoryId: acessoriosCat,
        ncm: '48131000',
      },
      {
        name: 'Filtro Lion Rolling Circus',
        description:
          'Filtro para enrolar Lion Rolling Circus de alta retenção e picotagem precisa. NCM 48131000.',
        price: 8.0,
        stock: 50,
        featured: false,
        categoryId: piteirasCat,
        ncm: '48131000',
      },
      {
        name: 'Isqueiro Seda para Bolado',
        description:
          'Isqueiro prático tipo pedra com bocal projetado para acendimento uniforme de sedas. NCM 48131000.',
        price: 6.0,
        stock: 50,
        featured: false,
        categoryId: isqueirosCat,
        ncm: '48131000',
      },
      {
        name: 'Maçarico com Mola Retrátil',
        description:
          'Maçarico compacto de chama jet flame com mola de retorno e acendimento piezoelétrico. NCM 96138000.',
        price: 26.0,
        stock: 40,
        featured: false,
        categoryId: isqueirosCat,
        ncm: '96138000',
      },
    ]

    for (let n = 0; n < newProductsFromNotes.length; n++) {
      upsertProduct(newProductsFromNotes[n])
    }

    // 4. Atribuir NCMs a TODOS os produtos existentes no banco conforme sua família
    // Regras gerais dos cadernos:
    // - Sedas: 48131000 (ou 48139000 para especificações 02 Seda King)
    // - Dichavadores/Grinders: 84781090 (ou 82100010 para desfiadores manuais)
    // - Cuias / Slicks (plástico/silicone): 39249000
    // - Bandejas Metal / Tin cases: 83062900 (ou 73239900 para Lion metal)
    // - Bandejas Vidro / Cinzeiros Vidro / Acessórios Vidro: 70139900
    // - Piteiras de papel / filtros: 48131000
    // - Piteiras de madeira: 96140000
    // - Piteiras de algodão/fibras: 56012291
    // - Piteiras de vidro: 70139900
    // - Isqueiros normais / Clipper: 96132000
    // - Maçaricos: 96138000
    // - Cases / Bolsas / Kits: 42022900 ou 42029200
    // - Bongs de vidro: 70139900
    // - Bongs acrílico / silicone: 39249000
    // - Potes plástico: 39249000; Potes UV Quartz: 70139900
    // - Tesouras e espátulas de inox: 82100010 ou 82130000

    const allProds = app.findRecordsByFilter('products', 'active = true', 'name', 300, 0)
    for (let p = 0; p < allProds.length; p++) {
      const prod = allProds[p]
      const name = prod.getString('name').toLowerCase()
      let ncm = prod.getString('ncm')

      if (!ncm) {
        if (name.includes('seda')) {
          if (name.includes('02 seda')) {
            ncm = '48139000'
          } else {
            ncm = '48131000'
          }
        } else if (name.includes('dichavador') || name.includes('grinder')) {
          ncm = '84781090'
        } else if (name.includes('desfiador')) {
          ncm = '82100010'
        } else if (name.includes('cuia') || name.includes('slick')) {
          if (name.includes('vidro')) {
            ncm = '70139900'
          } else {
            ncm = '39249000'
          }
        } else if (
          name.includes('bandeja') ||
          name.includes('rolling tray') ||
          name.includes('tin case') ||
          name.includes('tin box')
        ) {
          if (name.includes('vidro')) {
            ncm = '70139900'
          } else if (name.includes('lion')) {
            ncm = '73239900'
          } else {
            ncm = '83062900'
          }
        } else if (name.includes('cinzeiro')) {
          if (
            name.includes('vidro') ||
            name.includes('quartz') ||
            name.includes('crystal') ||
            name.includes('raw')
          ) {
            ncm = '70139900'
          } else if (name.includes('silicone')) {
            ncm = '39249000'
          } else if (name.includes('lion')) {
            ncm = '73239900'
          } else {
            ncm = '83062900'
          }
        } else if (name.includes('piteira') || name.includes('filtro') || name.includes('filter')) {
          if (name.includes('madeira') || name.includes('yellow finger')) {
            ncm = '96140000'
          } else if (name.includes('girls in green')) {
            ncm = '56012291'
          } else if (name.includes('vidro')) {
            ncm = '70139900'
          } else {
            ncm = '48131000'
          }
        } else if (
          name.includes('maçarico') ||
          name.includes('macarico') ||
          name.includes('mola')
        ) {
          ncm = '96138000'
        } else if (name.includes('isqueiro')) {
          if (name.includes('seda')) {
            ncm = '48131000'
          } else {
            ncm = '96132000'
          }
        } else if (
          name.includes('beck tube') ||
          name.includes('guarda ocklinas') ||
          name.includes('porta beck') ||
          name.includes('mocó') ||
          name.includes('moco')
        ) {
          if (name.includes('metal') || name.includes('alumínio') || name.includes('aluminio')) {
            ncm = '83062900'
          } else {
            ncm = '39249000'
          }
        } else if (
          name.includes('puff case') ||
          name.includes('case kit') ||
          name.includes('kit montado')
        ) {
          ncm = '42022900'
        } else if (name.includes('tote bag')) {
          ncm = '42029200'
        } else if (name.includes('caneca') || name.includes('ceneca')) {
          ncm = '69120000'
        } else if (name.includes('cone inflável') || name.includes('cone inflavel')) {
          ncm = '39249000'
        } else if (
          name.includes('hemp wrap') ||
          name.includes('blunt') ||
          name.includes('preroll') ||
          name.includes('pré-bolado') ||
          name.includes('pre-bolado')
        ) {
          ncm = '48131000'
        } else if (name.includes('bong') || name.includes('percobator')) {
          if (name.includes('silicone') || name.includes('acrílico') || name.includes('acrilico')) {
            ncm = '39249000'
          } else {
            ncm = '70139900'
          }
        } else if (name.includes('pote')) {
          if (name.includes('uv') || name.includes('quartz') || name.includes('vidro')) {
            ncm = '70139900'
          } else {
            ncm = '39249000'
          }
        } else if (
          name.includes('tesoura') ||
          name.includes('espátula') ||
          name.includes('espatula') ||
          name.includes('bicucena')
        ) {
          ncm = '82100010'
        } else if (name.includes('tapete')) {
          ncm = '39249000'
        } else {
          ncm = '83062900'
        }

        prod.set('ncm', ncm)
        app.save(prod)
      }
    }
  },
  (app) => {
    // down opcional
  },
)
