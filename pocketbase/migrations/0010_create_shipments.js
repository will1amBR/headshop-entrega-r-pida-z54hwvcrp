migrate(
  (app) => {
    // 1. Obter ID da coleção orders para a relation
    const ordersCol = app.findCollectionByNameOrId('orders')

    // 2. Criar coleção shipments
    const shipments = new Collection({
      name: 'shipments',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'order',
          type: 'relation',
          required: true,
          collectionId: ordersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'tracking_code', type: 'text', required: false },
        { name: 'carrier', type: 'text', required: false },
        {
          name: 'shipping_status',
          type: 'select',
          required: true,
          values: [
            'separacao',
            'pronto_envio',
            'enviado',
            'em_transito',
            'entregue',
            'devolvido',
            'devolucao_recebida',
          ],
          maxSelect: 1,
        },
        { name: 'return_reason', type: 'text', required: false },
        { name: 'refund_amount', type: 'number', required: false, min: 0 },
        { name: 'shipped_at', type: 'text', required: false },
        { name: 'delivered_at', type: 'text', required: false },
        { name: 'returned_at', type: 'text', required: false },
        { name: 'notes', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_shipments_order ON shipments (order)',
        'CREATE INDEX idx_shipments_status ON shipments (shipping_status)',
        'CREATE INDEX idx_shipments_created ON shipments (created)',
      ],
    })
    app.save(shipments)

    // 3. Semeando registros de exemplo vinculados aos pedidos existentes
    try {
      const shipCol = app.findCollectionByNameOrId('shipments')
      const count = app.countRecords('shipments')

      if (count === 0) {
        // Encontrar pedidos existentes para vincular
        // Pedido 1: Rodrigo Medeiros (enviado)
        let orderEnviado = null
        try {
          orderEnviado = app.findFirstRecordByData('orders', 'customer_name', 'Rodrigo Medeiros')
        } catch (_) {}

        // Pedido 2: Camila Albuquerque (entregue)
        let orderEntregue = null
        try {
          orderEntregue = app.findFirstRecordByData('orders', 'customer_name', 'Camila Albuquerque')
        } catch (_) {}

        // Pedido 3: Mariana Silveira (em preparo)
        let orderPreparo = null
        try {
          orderPreparo = app.findFirstRecordByData('orders', 'customer_name', 'Mariana Silveira')
        } catch (_) {}

        // Pedido 4: Lucas Ferreira (entregue / devolução de exemplo)
        let orderDevolvido = null
        try {
          orderDevolvido = app.findFirstRecordByData('orders', 'customer_name', 'Lucas Ferreira')
        } catch (_) {}

        // Inserir shipment 1: Rodrigo (enviado / em trânsito)
        if (orderEnviado) {
          const rec1 = new Record(shipCol)
          rec1.set('order', orderEnviado.id)
          rec1.set('tracking_code', 'HD489924SC88BR')
          rec1.set('carrier', 'Sedex Express / Correios')
          rec1.set('shipping_status', 'em_transito')
          rec1.set('shipped_at', '2026-09-29 08:30:00')
          rec1.set(
            'notes',
            'Despachado na agência central de Florianópolis. Previsão de entrega 24-48h.',
          )
          app.save(rec1)
        }

        // Inserir shipment 2: Camila (entregue)
        if (orderEntregue) {
          const rec2 = new Record(shipCol)
          rec2.set('order', orderEntregue.id)
          rec2.set('tracking_code', 'LOGGI-RJ-992144')
          rec2.set('carrier', 'Loggi Express RJ')
          rec2.set('shipping_status', 'entregue')
          rec2.set('shipped_at', '2026-09-27 10:15:00')
          rec2.set('delivered_at', '2026-09-28 16:40:00')
          rec2.set('notes', 'Entrega finalizada com sucesso. Recebido pelo porteiro Sr. Carlos.')
          app.save(rec2)
        }

        // Inserir shipment 3: Mariana (pronto para envio / separação finalizada)
        if (orderPreparo) {
          const rec3 = new Record(shipCol)
          rec3.set('order', orderPreparo.id)
          rec3.set('tracking_code', 'MOTO-SP-11029')
          rec3.set('carrier', 'Motoboy Entrega Rápida SP')
          rec3.set('shipping_status', 'pronto_envio')
          rec3.set(
            'notes',
            'Conferido com plástico bolha e fita inviolável. Aguardando retirada pelo motoboy às 14h.',
          )
          app.save(rec3)
        }

        // Inserir shipment 4: Exemplo de devolução em andamento (Lucas Ferreira)
        if (orderDevolvido) {
          const rec4 = new Record(shipCol)
          rec4.set('order', orderDevolvido.id)
          rec4.set('tracking_code', 'REV-CORREIOS-7721BR')
          rec4.set('carrier', 'Logística Reversa Correios')
          rec4.set('shipping_status', 'devolucao_recebida')
          rec4.set(
            'return_reason',
            'Cliente comprou tamanho/modelo incorreto e solicitou troca por outro item',
          )
          rec4.set('refund_amount', 145.9)
          rec4.set('shipped_at', '2026-09-25 11:00:00')
          rec4.set('delivered_at', '2026-09-27 14:00:00')
          rec4.set('returned_at', '2026-09-29 09:15:00')
          rec4.set(
            'notes',
            'Pacote devolvido recebido na central de expedição. Produtos lacrados conferidos. Crédito/troca liberado.',
          )
          app.save(rec4)
        }
      }
    } catch (e) {
      console.log('Erro ao semear shipments de exemplo:', e)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('shipments'))
    } catch (_) {}
  },
)
