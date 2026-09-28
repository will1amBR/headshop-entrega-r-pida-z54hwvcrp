migrate(
  (app) => {
    // 1. categories collection
    const categories = new Collection({
      name: 'categories',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
        {
          name: 'image',
          type: 'file',
          maxSelect: 1,
          maxSize: 2097152,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_categories_slug ON categories (slug)'],
    })
    app.save(categories)

    const categoriesCol = app.findCollectionByNameOrId('categories')

    // 2. products collection
    const products = new Collection({
      name: 'products',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        { name: 'price', type: 'number', required: true, min: 0 },
        {
          name: 'image',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'stock', type: 'number', min: 0 },
        { name: 'featured', type: 'bool' },
        { name: 'active', type: 'bool' },
        {
          name: 'category',
          type: 'relation',
          required: true,
          collectionId: categoriesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_products_category ON products (category)',
        'CREATE INDEX idx_products_active ON products (active)',
        'CREATE INDEX idx_products_price ON products (price)',
        'CREATE INDEX idx_products_created ON products (created)',
      ],
    })
    app.save(products)

    // 3. orders collection
    // Leitura/atualização/deleção para superuser/admin; criação permitida publicamente ("") para o checkout da loja
    const orders = new Collection({
      name: 'orders',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: '',
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'customer_name', type: 'text', required: true },
        { name: 'phone', type: 'text', required: true },
        { name: 'email', type: 'text' },
        { name: 'address', type: 'text', required: true },
        { name: 'city', type: 'text', required: true },
        { name: 'state', type: 'text', required: true },
        { name: 'cep', type: 'text' },
        { name: 'region', type: 'text', required: true },
        { name: 'items', type: 'json', required: true },
        { name: 'subtotal', type: 'number', required: false, min: 0 },
        { name: 'shipping', type: 'number', required: false, min: 0 },
        { name: 'total', type: 'number', required: false, min: 0 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['novo', 'em preparo', 'enviado', 'entregue', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_orders_status ON orders (status)',
        'CREATE INDEX idx_orders_created ON orders (created)',
        'CREATE INDEX idx_orders_region ON orders (region)',
      ],
    })
    app.save(orders)

    // 4. seo_settings collection
    const seoSettings = new Collection({
      name: 'seo_settings',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'store_name', type: 'text', required: true },
        { name: 'whatsapp_number', type: 'text', required: true },
        { name: 'announcement_text', type: 'text' },
        { name: 'hero_title', type: 'text' },
        { name: 'hero_subtitle', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(seoSettings)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('seo_settings'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('orders'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('products'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('categories'))
    } catch (_) {}
  },
)
