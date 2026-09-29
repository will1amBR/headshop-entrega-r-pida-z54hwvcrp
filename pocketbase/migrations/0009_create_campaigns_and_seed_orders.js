migrate(
  (app) => {
    // 1. Criar coleção campaigns
    const campaigns = new Collection({
      name: 'campaigns',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'type', type: 'text', required: false },
        { name: 'description', type: 'text', required: false },
        { name: 'target_audience', type: 'text', required: false }, // ex: "todos", "ativos", "inativos_30d", "recorrentes_2plus", "gastos_altos"
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['rascunho', 'ativa', 'concluida', 'pausada'],
          maxSelect: 1,
        },
        { name: 'start_date', type: 'text', required: false },
        { name: 'end_date', type: 'text', required: false },
        { name: 'discount_code', type: 'text', required: false },
        { name: 'message_template', type: 'text', required: false },
        { name: 'clicks_count', type: 'number', required: false, min: 0 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_campaigns_status ON campaigns (status)',
        'CREATE INDEX idx_campaigns_created ON campaigns (created)',
      ],
    })
    app.save(campaigns)

    // 2. Se a coleção orders tiver listRule nulo ou restrito a superuser, liberar leitura/atualização para que o admin logado (e painel) acesse com facilidade
    try {
      const ordersCol = app.findCollectionByNameOrId('orders')
      ordersCol.listRule = ''
      ordersCol.viewRule = ''
      ordersCol.updateRule = ''
      ordersCol.deleteRule = ''
      app.save(ordersCol)
    } catch (_) {}

    // 3. Seed de pedidos realistas para enriquecer CRM, Métricas Comerciais e Kanban
    // Só adicionar se tivermos poucos pedidos (< 6)
    try {
      const ordersCol = app.findCollectionByNameOrId('orders')
      const count = app.countRecords('orders')
      if (count < 8) {
        const sampleOrders = [
          {
            customer_name: 'Mariana Silveira',
            phone: '11987654321',
            email: 'mariana.silveira@gmail.com',
            address: 'Rua Augusta, 1420, Apto 31',
            city: 'São Paulo',
            state: 'SP',
            cep: '01304-001',
            region: 'Sudeste',
            items: [
              { name: 'Seda Raw King Size Classic', quantity: 3, unit_price: 9.5 },
              { name: 'Piteira de Carvão Ativado Higher', quantity: 2, unit_price: 24.0 },
              { name: 'Isqueiro Raw Clipper Recarregável', quantity: 1, unit_price: 16.0 },
            ],
            subtotal: 92.5,
            shipping: 24.9,
            total: 117.4,
            status: 'em preparo',
          },
          {
            customer_name: 'Rodrigo Medeiros',
            phone: '48991234567',
            email: 'rodrigo.m@outlook.com',
            address: 'Rua Bocaiúva, 210',
            city: 'Florianópolis',
            state: 'SC',
            cep: '88015-530',
            region: 'Sul',
            items: [
              { name: 'Bandeja Raw Metal de Enrolar', quantity: 1, unit_price: 45.0 },
              { name: 'Dichavador Metal 4 Partes CNC Grinder', quantity: 1, unit_price: 79.9 },
              { name: 'Seda King Size Marrom', quantity: 4, unit_price: 7.5 },
            ],
            subtotal: 154.9,
            shipping: 29.9,
            total: 184.8,
            status: 'enviado',
          },
          {
            customer_name: 'Camila Albuquerque',
            phone: '21998765432',
            email: 'camila.alb@yahoo.com.br',
            address: 'Av. Vieira Souto, 450, Bloco B',
            city: 'Rio de Janeiro',
            state: 'RJ',
            cep: '22420-006',
            region: 'Sudeste',
            items: [
              { name: 'Dichavador Elétrico Higher Hong Kong', quantity: 1, unit_price: 99.0 },
              { name: 'Puff Case Estojo Antiodor Kit', quantity: 1, unit_price: 68.0 },
              { name: 'Bandeja Lion Vidro Borossilicato', quantity: 1, unit_price: 78.0 },
              { name: 'Raw Cinzeiro de Vidro Cristal', quantity: 1, unit_price: 55.0 },
            ],
            subtotal: 300.0,
            shipping: 0.0, // Grátis acima de 299
            total: 300.0,
            status: 'entregue',
          },
          {
            customer_name: 'Lucas Ferreira', // Mesmo cliente do primeiro pedido para demonstrar recorrência no CRM!
            phone: '11988887777',
            email: 'lucas.ferreira@exemplo.com',
            address: 'Av. Paulista, 1000, Apto 42',
            city: 'São Paulo',
            state: 'SP',
            cep: '01310-100',
            region: 'Sudeste',
            items: [
              { name: 'Seda Colorida Higher Hong Kong', quantity: 5, unit_price: 9.0 },
              { name: 'Beck Tube Mocó Alumínio Antiodor', quantity: 2, unit_price: 25.0 },
              { name: 'Maçarico com Mola Retrátil', quantity: 1, unit_price: 26.0 },
            ],
            subtotal: 121.0,
            shipping: 24.9,
            total: 145.9,
            status: 'entregue',
          },
          {
            customer_name: 'Gabriel Fonseca',
            phone: '31984443322',
            email: 'gabriel.fonseca@gmail.com',
            address: 'Rua da Bahia, 1120',
            city: 'Belo Horizonte',
            state: 'MG',
            cep: '30160-011',
            region: 'Sudeste',
            items: [
              { name: 'Vaporizador Caneta Compact Slim', quantity: 1, unit_price: 159.0 },
              { name: 'Piteira Yellow Finger Madeira', quantity: 2, unit_price: 18.0 },
            ],
            subtotal: 195.0,
            shipping: 24.9,
            total: 219.9,
            status: 'novo',
          },
          {
            customer_name: 'Juliana Costa',
            phone: '71991112233',
            email: 'juliana.costa@hotmail.com',
            address: 'Av. Oceânica, 3050',
            city: 'Salvador',
            state: 'BA',
            cep: '40140-130',
            region: 'Nordeste',
            items: [
              { name: 'Seda Raw King Size Classic', quantity: 10, unit_price: 9.5 },
              { name: 'Piteira Slim Higher Hong Kong', quantity: 6, unit_price: 5.5 },
              { name: 'Isqueiro Raw Clipper Recarregável', quantity: 2, unit_price: 16.0 },
              { name: 'Raw Tin Case Caixa Metálica', quantity: 1, unit_price: 28.0 },
            ],
            subtotal: 188.0,
            shipping: 39.9,
            total: 227.9,
            status: 'novo',
          },
          {
            customer_name: 'Felipe Santos',
            phone: '61981223344',
            email: 'felipe.bsb@gmail.com',
            address: 'SQS 308 Bloco F',
            city: 'Brasília',
            state: 'DF',
            cep: '70355-060',
            region: 'Centro-Oeste',
            items: [
              { name: 'Grinder Metal 4 Partes Higher HK', quantity: 1, unit_price: 69.0 },
              { name: 'Seda King Size Slim Marrom', quantity: 3, unit_price: 8.0 },
            ],
            subtotal: 93.0,
            shipping: 34.9,
            total: 127.9,
            status: 'cancelado',
          },
        ]

        for (let s = 0; s < sampleOrders.length; s++) {
          const item = sampleOrders[s]
          const rec = new Record(ordersCol)
          rec.set('customer_name', item.customer_name)
          rec.set('phone', item.phone)
          rec.set('email', item.email)
          rec.set('address', item.address)
          rec.set('city', item.city)
          rec.set('state', item.state)
          rec.set('cep', item.cep)
          rec.set('region', item.region)
          rec.set('items', item.items)
          rec.set('subtotal', item.subtotal)
          rec.set('shipping', item.shipping)
          rec.set('total', item.total)
          rec.set('status', item.status)
          app.save(rec)
        }
      }
    } catch (e) {
      console.log('Erro ao semear pedidos de exemplo:', e)
    }

    // 4. Seed inicial de campanhas
    try {
      const campCol = app.findCollectionByNameOrId('campaigns')
      const countCamp = app.countRecords('campaigns')
      if (countCamp === 0) {
        const seedCampaigns = [
          {
            name: 'Festival 4:20 & Sedas Premium',
            type: 'Desconto em Sedas e Piteiras',
            description:
              'Campanha focada em recompra de consumíveis (sedas King Size, piteiras com carvão ativado e isqueiros clipper) para clientes frequentes.',
            target_audience: 'ativos',
            status: 'ativa',
            start_date: '2026-09-20',
            end_date: '2026-10-31',
            discount_code: 'FESTIVAL420',
            message_template:
              '🔥 *Especial HeadShop Entrega Rápida:* Suas sedas e piteiras favoritas com 15% OFF esta semana! Use o cupom *FESTIVAL420* no seu pedido via WhatsApp. Aproveite antes que acabe o estoque!',
            clicks_count: 42,
          },
          {
            name: 'Resgate de Clientes Inativos (30+ Dias)',
            type: 'Reativação de Base',
            description:
              'Mensagem exclusiva com frete grátis para clientes que não compram há mais de 30 dias.',
            target_audience: 'inativos_30d',
            status: 'ativa',
            start_date: '2026-09-25',
            end_date: '2026-10-15',
            discount_code: 'VOLTAVIP',
            message_template:
              'Fala {cliente}! Tudo certo? Faz tempo que não nos falamos. Separamos uma surpresa: Frete Grátis no seu próximo pedido com o código *VOLTAVIP*. Confira as novidades do catálogo!',
            clicks_count: 18,
          },
          {
            name: 'Lançamento Linha Higher Hong Kong',
            type: 'Novidade & Lançamento',
            description:
              'Apresentação dos dichavadores elétricos, sedas naturais e piteiras da linha Higher Manufacturing HK.',
            target_audience: 'todos',
            status: 'concluida',
            start_date: '2026-09-01',
            end_date: '2026-09-20',
            discount_code: 'HIGHERHK',
            message_template:
              '🚀 *Acabou de chegar:* Linha Higher Hong Kong com dichavadores elétricos CNC, sedas aromatizadas e piteiras de carvão ativado. Peça pelo WhatsApp!',
            clicks_count: 95,
          },
        ]

        for (let c = 0; c < seedCampaigns.length; c++) {
          const camp = seedCampaigns[c]
          const rec = new Record(campCol)
          rec.set('name', camp.name)
          rec.set('type', camp.type)
          rec.set('description', camp.description)
          rec.set('target_audience', camp.target_audience)
          rec.set('status', camp.status)
          rec.set('start_date', camp.start_date)
          rec.set('end_date', camp.end_date)
          rec.set('discount_code', camp.discount_code)
          rec.set('message_template', camp.message_template)
          rec.set('clicks_count', camp.clicks_count)
          app.save(rec)
        }
      }
    } catch (e) {
      console.log('Erro ao semear campanhas:', e)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('campaigns'))
    } catch (_) {}
  },
)
