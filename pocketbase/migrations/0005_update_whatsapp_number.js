migrate(
  (app) => {
    // Atualizar o número de WhatsApp em todos os registros de seo_settings de forma idempotente
    try {
      const records = app.findRecordsByFilter('seo_settings', '', '', 100, 0)
      for (let i = 0; i < records.length; i++) {
        const rec = records[i]
        rec.set('whatsapp_number', '5548992463428')
        app.save(rec)
      }
    } catch (_) {
      // Fallback via SQL direto caso a lista por filter falhe
      app
        .db()
        .newQuery('UPDATE seo_settings SET whatsapp_number = {:phone}')
        .bind({ phone: '5548992463428' })
        .execute()
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter('seo_settings', '', '', 100, 0)
      for (let i = 0; i < records.length; i++) {
        const rec = records[i]
        rec.set('whatsapp_number', '5511999999999')
        app.save(rec)
      }
    } catch (_) {
      app
        .db()
        .newQuery('UPDATE seo_settings SET whatsapp_number = {:phone}')
        .bind({ phone: '5511999999999' })
        .execute()
    }
  },
)
