routerAdd('POST', '/backend/v1/agent/chat', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const message = (body.message || '').trim()
    if (!message) {
      return e.badRequestError('Mensagem é obrigatória')
    }

    // Resolve usuário: se autenticado usa o próprio, senão usa o usuário de serviço dedicado
    let userId = e.auth?.id
    if (!userId) {
      try {
        const serviceUser = $app.findAuthRecordByEmail(
          '_pb_users_auth_',
          'vendedor-ali@headshop.local',
        )
        userId = serviceUser.id
      } catch (_) {
        try {
          const legacyUser = $app.findAuthRecordByEmail(
            '_pb_users_auth_',
            'vendedor-will@headshop.local',
          )
          userId = legacyUser.id
        } catch (_) {
          // Fallback para admin caso o usuário de serviço não seja localizado
          const fallbackUser = $app.findAuthRecordByEmail(
            '_pb_users_auth_',
            'william@korenambiental.com',
          )
          userId = fallbackUser.id
        }
      }
    }

    const conversationId = body.conversation_id || null
    let agentHandle
    try {
      agentHandle = $ai.agent('ali-sales-specialist')
    } catch (_) {
      try {
        agentHandle = $ai.agent('will-vendedor')
      } catch (e) {
        throw e
      }
    }

    const result = agentHandle.chat({
      user_id: userId,
      conversation_id: conversationId,
      message: message,
    })

    return e.json(200, {
      conversation_id: result.conversation_id,
      content: result.content,
      citations: result.citations,
      message_id: result.message_id,
      tool_calls: result.tool_calls,
    })
  } catch (err) {
    if (err instanceof SkipAiConfigError) {
      return e.json(503, { error: 'Serviço de IA temporariamente indisponível' })
    }
    if (err instanceof SkipAiAgentsError) {
      const status = err.status || 500
      return e.json(status, {
        error: status >= 500 ? 'Falha na resposta do assistente' : err.message,
      })
    }
    if (err instanceof SkipAiError) {
      const status = err.status || 502
      return e.json(status, {
        error: status >= 500 ? 'Assistente temporariamente indisponível' : err.message,
      })
    }
    return e.json(500, { error: err.message || 'Erro interno no chat' })
  }
})
