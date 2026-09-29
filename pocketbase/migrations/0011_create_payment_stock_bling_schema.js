migrate(
  (app) => {
    // 1. Atualizar a coleção products com min_stock e cost_price
    const productsCol = app.findCollectionByNameOrId('products')
    if (!productsCol.fields.getByName('min_stock')) {
      productsCol.fields.add(
        new NumberField({
          name: 'min_stock',
          required: false,
          min: 0,
          onlyInt: true,
        }),
      )
    }
    if (!productsCol.fields.getByName('cost_price')) {
      productsCol.fields.add(
        new NumberField({
          name: 'cost_price',
          required: false,
          min: 0,
        }),
      )
    }
    app.save(productsCol)

    const ordersCol = app.findCollectionByNameOrId('orders')

    // 2. Coleção payments (order, gateway, method, amount, status, txid, qr_code, payload)
    if (!app.hasTable('payments')) {
      const payments = new Collection({
        name: 'payments',
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
          { name: 'gateway', type: 'text', required: true },
          {
            name: 'method',
            type: 'select',
            required: true,
            values: ['pix', 'cartao', 'outro'],
            maxSelect: 1,
          },
          { name: 'amount', type: 'number', required: true, min: 0 },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['pendente', 'pago', 'expirado', 'cancelado'],
            maxSelect: 1,
          },
          { name: 'txid', type: 'text', required: false },
          { name: 'qr_code', type: 'text', required: false },
          { name: 'payload', type: 'json', required: false },
          { name: 'paid_at', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_payments_order ON payments (order)',
          'CREATE INDEX idx_payments_status ON payments (status)',
          'CREATE INDEX idx_payments_created ON payments (created)',
        ],
      })
      app.save(payments)
    }

    // 3. Coleção invoices (order, invoice_number, series, status, xml_url, danfe_url, key, protocol)
    if (!app.hasTable('invoices')) {
      const invoices = new Collection({
        name: 'invoices',
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
          { name: 'invoice_number', type: 'text', required: false },
          { name: 'series', type: 'text', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['pendente', 'emitida', 'cancelada', 'erro'],
            maxSelect: 1,
          },
          { name: 'xml_url', type: 'text', required: false },
          { name: 'danfe_url', type: 'text', required: false },
          { name: 'access_key', type: 'text', required: false },
          { name: 'protocol', type: 'text', required: false },
          { name: 'issued_at', type: 'text', required: false },
          { name: 'error_message', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_invoices_order ON invoices (order)',
          'CREATE INDEX idx_invoices_status ON invoices (status)',
          'CREATE INDEX idx_invoices_created ON invoices (created)',
        ],
      })
      app.save(invoices)
    }

    // 4. Coleção suppliers (name, contact_person, phone, email, cnpj, supplied_products, notes)
    if (!app.hasTable('suppliers')) {
      const suppliers = new Collection({
        name: 'suppliers',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'contact_person', type: 'text', required: false },
          { name: 'phone', type: 'text', required: false },
          { name: 'email', type: 'text', required: false },
          { name: 'cnpj', type: 'text', required: false },
          { name: 'supplied_products', type: 'text', required: false },
          { name: 'notes', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_suppliers_name ON suppliers (name)'],
      })
      app.save(suppliers)
    }

    // 5. Coleção stock_movements (product, type: entrada/saida/ajuste, quantity, reason, supplier, movement_date)
    const suppliersCol = app.findCollectionByNameOrId('suppliers')
    if (!app.hasTable('stock_movements')) {
      const stockMovements = new Collection({
        name: 'stock_movements',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          {
            name: 'product',
            type: 'relation',
            required: true,
            collectionId: productsCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'type',
            type: 'select',
            required: true,
            values: ['entrada', 'saida', 'ajuste'],
            maxSelect: 1,
          },
          { name: 'quantity', type: 'number', required: true },
          { name: 'reason', type: 'text', required: true },
          {
            name: 'supplier',
            type: 'relation',
            required: false,
            collectionId: suppliersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'movement_date', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_stock_movements_product ON stock_movements (product)',
          'CREATE INDEX idx_stock_movements_type ON stock_movements (type)',
          'CREATE INDEX idx_stock_movements_created ON stock_movements (created)',
        ],
      })
      app.save(stockMovements)
    }

    // 6. Coleção purchase_orders (supplier, items, status, total, expected_date, notes)
    if (!app.hasTable('purchase_orders')) {
      const purchaseOrders = new Collection({
        name: 'purchase_orders',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          {
            name: 'supplier',
            type: 'relation',
            required: true,
            collectionId: suppliersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'items', type: 'json', required: true },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['rascunho', 'enviado', 'confirmado', 'recebido', 'cancelado'],
            maxSelect: 1,
          },
          { name: 'total', type: 'number', required: false, min: 0 },
          { name: 'expected_date', type: 'text', required: false },
          { name: 'received_at', type: 'text', required: false },
          { name: 'notes', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_purchase_orders_supplier ON purchase_orders (supplier)',
          'CREATE INDEX idx_purchase_orders_status ON purchase_orders (status)',
          'CREATE INDEX idx_purchase_orders_created ON purchase_orders (created)',
        ],
      })
      app.save(purchaseOrders)
    }

    // 7. Coleção integration_settings para guardar credenciais/chaves com segurança e flags de estado
    if (!app.hasTable('integration_settings')) {
      const integrationSettings = new Collection({
        name: 'integration_settings',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'key', type: 'text', required: true },
          { name: 'value', type: 'text', required: false },
          { name: 'environment', type: 'text', required: false },
          { name: 'status', type: 'text', required: false },
          { name: 'last_sync', type: 'text', required: false },
          { name: 'details', type: 'json', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_integration_settings_key ON integration_settings (key)'],
      })
      app.save(integrationSettings)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('integration_settings'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('purchase_orders'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('stock_movements'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('suppliers'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('invoices'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('payments'))
    } catch (_) {}
  },
)
