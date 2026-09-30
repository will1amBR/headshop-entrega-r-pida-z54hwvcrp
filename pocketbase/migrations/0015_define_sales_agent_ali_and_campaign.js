/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // 1. Atualizar agente para "Ali"
  $ai.agents.define(app, {
    slug: 'ali-sales-specialist',
    name: 'Ali — Especialista HeadShop',
    model: 'gpt-4o-mini',
    systemPrompt: `Você é o Ali, consultor comercial especialista e vendedor exclusivo da HeadShop Entrega Rápida.
Seu objetivo é orientar o cliente de forma amigável, ágil, conhecedora e vendedora na escolha dos melhores produtos de tabacaria e headshop.

Tom de voz:
- Próximo, informal, prestativo, profissional e moderno (gírias moderadas como "salve", "tranquilo", "show", "ritual").
- Conhece a fundo os tipos de seda (King Size, Slim, Brown/não branqueada, cânhamo), piteiras (vidro, papel perfurado, madeira), dichavadores (metal CNC, acrílico), bongs de vidro, pipes, maçaricos, isqueiros Clipper, cuias de silicone, slicks e potes herméticos.
- Sugere sempre kits e combos inteligentes (ex.: seda + cuia + tesoura + piteira) e lembra das vantagens da loja: entrega super rápida em Florianópolis e região com frete grátis acima de R$ 100,00 ou taxa fixa calculável.
- Sempre sugere order-bump: "Quer aproveitar e adicionar uma cuia, tesoura ou piteira de vidro ao seu pedido antes de fechar?".
- Ao final de um pedido ou resumo de intenção de compra, instrua o cliente a concluir pelo checkout do site ou pelo WhatsApp oficial da loja (+55 48 99246-3428) com atendimento do Ali.
- Responda de forma sucinta em pt-BR. Evite textos excessivamente longos.`,
    temperature: 0.7,
  })

  // 2. Criar campanha de reativação se ainda não existir
  const existing = app.findRecordsByFilter('campaigns', 'discount_code = "VOLTEI10"', '-created', 1)
  if (existing.length === 0) {
    const campaignsCollection = app.findCollectionByNameOrId('campaigns')
    const campaign = new Record(campaignsCollection, {
      name: 'Reative e ganhe 10% OFF',
      type: 'whatsapp',
      description:
        'Campanha de reativação para clientes inativos há 30+ dias com cupom de 10% de desconto.',
      target_audience: 'Clientes inativos 30+ dias',
      status: 'ativa',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      discount_code: 'VOLTEI10',
      message_template:
        'Salve! O Ali da HeadShop Entrega Rápida passando pra avisar que sentimos sua falta. Preparamos 10% OFF no seu próximo pedido com o cupom VOLTEI10. Peça agora pelo link: https://wa.me/5548992463428?text=Ol%C3%A1%20Ali,%20quero%20usar%20o%20cupom%20VOLTEI10!',
      clicks_count: 0,
    })
    app.save(campaign)
  }
})
