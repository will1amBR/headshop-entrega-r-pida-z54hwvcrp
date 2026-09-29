migrate(
  (app) => {
    const suppliersCol = app.findCollectionByNameOrId('suppliers')

    if (!app.hasTable('stock_entries')) {
      const stockEntries = new Collection({
        name: 'stock_entries',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'invoice_number', type: 'text', required: false },
          { name: 'series', type: 'text', required: false },
          { name: 'access_key', type: 'text', required: false },
          {
            name: 'supplier',
            type: 'relation',
            required: false,
            collectionId: suppliersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'supplier_name', type: 'text', required: false },
          { name: 'supplier_cnpj', type: 'text', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['rascunho', 'em_conferencia', 'concluida', 'cancelada'],
            maxSelect: 1,
          },
          { name: 'total_amount', type: 'number', required: false, min: 0 },
          { name: 'items_count', type: 'number', required: false, min: 0 },
          { name: 'notes', type: 'text', required: false },
          { name: 'divergences_summary', type: 'text', required: false },
          { name: 'items', type: 'json', required: true },
          {
            name: 'invoice_photo',
            type: 'file',
            maxSelect: 1,
            maxSize: 10485760, // 10MB
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
          },
          {
            name: 'verification_photos',
            type: 'file',
            maxSelect: 20,
            maxSize: 10485760, // 10MB
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_stock_entries_status ON stock_entries (status)',
          'CREATE INDEX idx_stock_entries_created ON stock_entries (created)',
          'CREATE INDEX idx_stock_entries_supplier ON stock_entries (supplier)',
        ],
      })
      app.save(stockEntries)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('stock_entries'))
    } catch (_) {}
  },
)
