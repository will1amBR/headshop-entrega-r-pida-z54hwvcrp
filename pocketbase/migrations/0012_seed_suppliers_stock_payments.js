migrate(
  (app) => {
    const productsCol = app.findCollectionByNameOrId('products')
    const suppliersCol = app.findCollectionByNameOrId('suppliers')
    const stockMovementsCol = app.findCollectionByNameOrId('stock_movements')
    const purchaseOrdersCol = app.findCollectionByNameOrId('purchase_orders')
    const paymentsCol = app.findCollectionByNameOrId('payments')
    const ordersCol = app.findCollectionByNameOrId('orders')
    const settingsCol = app.findCollectionByNameOrId('integration_settings')

    // 1. Cadastrar Fornecedor Seed: Higher Manufacturing Hong Kong
    let higherSupplier = null
    try {
      higherSupplier = app.findFirstRecordByData(
        'suppliers',
        'name',
        'Higher Manufacturing Hong Kong',
      )
    } catch (_) {
      const sup = new Record(suppliersCol)
      sup.set('name', 'Higher Manufacturing Hong Kong')
      sup.set('contact_person', 'Mr. Chen Wei / Export Dept.')
      sup.set('phone', '+852 9123 4567')
      sup.set('email', 'export@higher-mfg.hk')
      sup.set('cnpj', 'HK-8829104-X')
      sup.set('supplied_products', 'Vaporizadores de Ervas, Sedas de Cânhamo, Acessórios e Peças')
      sup.set(
        'notes',
        'Fornecedor principal OEM da Ásia. Prazo de fabricação e despacho: 15 a 25 dias via frete aéreo ou marítimo.',
      )
      app.save(sup)
      higherSupplier = sup
    }

    // 2. Cadastrar Fornecedor Local Nacional: Distribuidora Nacional Head & Hookah
    let localSupplier = null
    try {
      localSupplier = app.findFirstRecordByData(
        'suppliers',
        'name',
        'Distribuidora Nacional Smoke & Glass',
      )
    } catch (_) {
      const sup2 = new Record(suppliersCol)
      sup2.set('name', 'Distribuidora Nacional Smoke & Glass')
      sup2.set('contact_person', 'Mariana Bastos')
      sup2.set('phone', '+55 11 98877-6655')
      sup2.set('email', 'vendas@smokeglassdist.com.br')
      sup2.set('cnpj', '23.456.789/0001-90')
      sup2.set('supplied_products', 'Bongs de Vidro, Pipes, Dichavadores CNC, Sedas Nacionais')
      sup2.set('notes', 'Distribuidor nacional com pronta-entrega em São Paulo e despacho em 24h.')
      app.save(sup2)
      localSupplier = sup2
    }

    // 3. Atualizar produtos com min_stock e cost_price representativos (e alguns com estoque baixo)
    try {
      const prods = app.findRecordsByFilter('products', 'active = true', 'name', 20, 0)
      for (let i = 0; i < prods.length; i++) {
        const p = prods[i]
        const currentPrice = p.get('price') || 50
        // Custo aproximado entre 35% e 45% do preço de venda
        const cost = Math.round(currentPrice * 0.4 * 100) / 100
        p.set('cost_price', cost)

        // Definir estoque mínimo padrão
        const minStock = 15
        p.set('min_stock', minStock)

        // Deixar os dois primeiros com estoque abaixo do mínimo para testar a sugestão automática de recompra
        if (i === 0) {
          p.set('stock', 4) // Abaixo de 15 -> Necessita recompra
        } else if (i === 1) {
          p.set('stock', 6) // Abaixo de 15 -> Necessita recompra
        } else if (!p.get('stock') || p.get('stock') <= 0) {
          p.set('stock', 25)
        }
        app.save(p)
      }
    } catch (e) {
      console.log('Erro ao atualizar custo e min_stock dos produtos:', e)
    }

    // 4. Se não houver movimentações de estoque, criar entradas de exemplo
    try {
      const moveCount = app.countRecords('stock_movements')
      if (moveCount === 0) {
        const sampleProds = app.findRecordsByFilter('products', 'active = true', '-created', 3, 0)
        if (sampleProds.length > 0 && higherSupplier) {
          const m1 = new Record(stockMovementsCol)
          m1.set('product', sampleProds[0].id)
          m1.set('type', 'entrada')
          m1.set('quantity', 50)
          m1.set('reason', 'Recebimento de Lote de Importação #HK-2026-08')
          m1.set('supplier', higherSupplier.id)
          m1.set('movement_date', '2026-09-20 14:00:00')
          app.save(m1)

          const m2 = new Record(stockMovementsCol)
          m2.set('product', sampleProds[1].id)
          m2.set('type', 'entrada')
          m2.set('quantity', 30)
          m2.set('reason', 'Compra de reposição emergencial')
          m2.set('supplier', localSupplier ? localSupplier.id : higherSupplier.id)
          m2.set('movement_date', '2026-09-24 10:30:00')
          app.save(m2)

          const m3 = new Record(stockMovementsCol)
          m3.set('product', sampleProds[0].id)
          m3.set('type', 'saida')
          m3.set('quantity', 2)
          m3.set('reason', 'Venda realizada e faturada')
          m3.set('movement_date', '2026-09-28 16:15:00')
          app.save(m3)
        }
      }
    } catch (e) {
      console.log('Erro ao criar movimentações seed:', e)
    }

    // 5. Se não houver pedido de recompra, criar um pedido de exemplo
    try {
      const poCount = app.countRecords('purchase_orders')
      if (poCount === 0 && higherSupplier) {
        const sampleProds = app.findRecordsByFilter('products', 'active = true', 'name', 2, 0)
        const items = sampleProds.map((p) => ({
          product_id: p.id,
          name: p.get('name'),
          quantity: 26,
          unit_cost: p.get('cost_price') || 25,
          subtotal: Math.round(26 * (p.get('cost_price') || 25) * 100) / 100,
        }))
        const total = items.reduce((s, it) => s + it.subtotal, 0)

        const po = new Record(purchaseOrdersCol)
        po.set('supplier', higherSupplier.id)
        po.set('items', items)
        po.set('status', 'enviado')
        po.set('total', total)
        po.set('expected_date', '2026-10-15')
        po.set(
          'notes',
          'Pedido gerado automaticamente pela baixa de estoque mínimo. Aguardando confirmação do frete aéreo.',
        )
        app.save(po)
      }
    } catch (e) {
      console.log('Erro ao criar purchase_order seed:', e)
    }

    // 6. Criar pagamentos de exemplo vinculados a pedidos existentes para popular a tela do Financeiro
    try {
      const payCount = app.countRecords('payments')
      if (payCount === 0) {
        const sampleOrders = app.findRecordsByFilter(
          'orders',
          'status != "cancelado"',
          '-created',
          3,
          0,
        )
        if (sampleOrders.length > 0) {
          // Pagamento 1: Pix Pago
          const p1 = new Record(paymentsCol)
          p1.set('order', sampleOrders[0].id)
          p1.set('gateway', 'mercadopago')
          p1.set('method', 'pix')
          p1.set('amount', sampleOrders[0].get('total') || 149.9)
          p1.set('status', 'pago')
          p1.set('txid', 'MP-PIX-982736192')
          p1.set(
            'qr_code',
            '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865802BR5925HEADSHOP ENTREGA RAPIDA6012FLORIANOPOLIS62070503***6304E2CA',
          )
          p1.set('paid_at', '2026-09-29 11:20:00')
          app.save(p1)

          // Pagamento 2: Cartão Pago (se houver segundo pedido)
          if (sampleOrders.length > 1) {
            const p2 = new Record(paymentsCol)
            p2.set('order', sampleOrders[1].id)
            p2.set('gateway', 'mercadopago')
            p2.set('method', 'cartao')
            p2.set('amount', sampleOrders[1].get('total') || 229.0)
            p2.set('status', 'pago')
            p2.set('txid', 'MP-CARD-11928374')
            p2.set('paid_at', '2026-09-28 17:45:00')
            app.save(p2)
          }

          // Pagamento 3: Pix Pendente (se houver terceiro pedido)
          if (sampleOrders.length > 2) {
            const p3 = new Record(paymentsCol)
            p3.set('order', sampleOrders[2].id)
            p3.set('gateway', 'mercadopago')
            p3.set('method', 'pix')
            p3.set('amount', sampleOrders[2].get('total') || 89.9)
            p3.set('status', 'pendente')
            p3.set('txid', 'MP-PIX-33019284')
            p3.set(
              'qr_code',
              '00020126580014br.gov.bcb.pix0136test-headshop-qrcode-pix-copia-cola-exemplo5204000053039865802BR5925HEADSHOP6012FLORIANOPOLIS62070503***6304B1A2',
            )
            app.save(p3)
          }
        }
      }
    } catch (e) {
      console.log('Erro ao criar pagamentos seed:', e)
    }

    // 7. Configurações de integração padrão (status inicial)
    try {
      const mpRecord = new Record(settingsCol)
      mpRecord.set('key', 'mercadopago')
      mpRecord.set('status', 'pendente_configuracao')
      mpRecord.set('details', {
        provider: 'Mercado Pago',
        supports: ['pix', 'cartao'],
        environment: 'production',
        notes:
          'Chave de acesso MERCADO_PAGO_ACCESS_TOKEN pode ser informada pelo painel ou como variável de ambiente.',
      })
      app.save(mpRecord)

      const blingRecord = new Record(settingsCol)
      blingRecord.set('key', 'bling')
      blingRecord.set('status', 'pendente_configuracao')
      blingRecord.set('details', {
        provider: 'Bling ERP v3',
        supports: ['produtos', 'pedidos', 'nfe', 'transportadoras'],
        environment: 'production',
        notes: 'API v3 com Bearer Token e sincronização de catálogo e emissão de notas fiscais.',
      })
      app.save(blingRecord)
    } catch (_) {}
  },
  (app) => {
    // Reversão
  },
)
