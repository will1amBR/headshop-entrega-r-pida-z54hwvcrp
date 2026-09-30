/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // Garantir criação ou atualização do atendente Ali e desativação de referências antigas a "Will"
  try {
    const aliUser = app.findAuthRecordByEmail('_pb_users_auth_', 'vendedor-ali@headshop.local')
    aliUser.set('name', 'Atendente Ali')
    app.save(aliUser)
  } catch (_) {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const rec = new Record(usersCol)
      rec.setEmail('vendedor-ali@headshop.local')
      rec.setPassword('Skip@Pass123')
      rec.setVerified(true)
      rec.set('name', 'Atendente Ali')
      app.save(rec)
    } catch (_) {}
  }

  // Renomear usuário legado se existir
  try {
    const legacy = app.findAuthRecordByEmail('_pb_users_auth_', 'vendedor-will@headshop.local')
    legacy.set('name', 'Atendente Ali (Anterior)')
    app.save(legacy)
  } catch (_) {}
})
