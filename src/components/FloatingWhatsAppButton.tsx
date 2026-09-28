import React, { useState, useEffect, useRef } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'
import { getSeoSettings } from '@/services/seo'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { formatBRL } from '@/lib/formatters'
import { Button } from '@/components/ui/button'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created: Date
  checkoutData?: {
    items: Array<{ name: string; quantity: number; price?: number }>
    subtotal?: number
  } | null
}

interface ParsedCheckout {
  items: Array<{ name: string; quantity: number; price?: number }>
  subtotal?: number
}

function extractCheckoutBlock(text: string): {
  cleanText: string
  checkout: ParsedCheckout | null
} {
  const match = text.match(/```checkout\s*([\s\S]*?)\s*```/i)
  if (!match) return { cleanText: text, checkout: null }

  try {
    const jsonStr = match[1].trim()
    const parsed = JSON.parse(jsonStr) as ParsedCheckout
    const cleanText = text.replace(/```checkout[\s\S]*?```/i, '').trim()
    return { cleanText, checkout: parsed }
  } catch (e) {
    console.error('Falha ao parsear checkout JSON da mensagem', e)
    return { cleanText: text, checkout: null }
  }
}

export const FloatingWhatsAppButton: React.FC = () => {
  const [phone, setPhone] = useState('5511999999999')
  const [storeName, setStoreName] = useState('HeadShop Entrega Rápida')
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [hasUnread, setHasUnread] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getSeoSettings().then((settings) => {
      if (settings?.whatsapp_number) {
        setPhone(settings.whatsapp_number)
      }
      if (settings?.store_name) {
        setStoreName(settings.store_name)
      }
    })
  }, [])

  // Inicializa com saudação simpática do Will
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText =
        'E aí! Sou o Will, atendente e consultor da HeadShop Entrega Rápida aqui em SP 🚀\n\nPosso te ajudar a escolher o vaporizador ideal, sedas, dichavadores ou tirar dúvidas sobre entrega rápida. O que você procura hoje?'
      setMessages([
        {
          id: 'welcome-1',
          role: 'assistant',
          content: welcomeText,
          created: new Date(),
          checkoutData: null,
        },
      ])
    }
  }, [messages.length])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setHasUnread(false)
    }
  }, [messages, isOpen])

  // Foco no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleOpenDirectWhatsApp = () => {
    const defaultMsg =
      'Olá! Gostaria de tirar dúvidas sobre os produtos da HeadShop Entrega Rápida.'
    window.open(buildWhatsAppUrl(phone, defaultMsg), '_blank', 'noopener,noreferrer')
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim()
    if (!text || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      created: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const backendUrl = import.meta.env.VITE_POCKETBASE_URL || ''
      const res = await fetch(`${backendUrl}/backend/v1/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Falha ao conversar com o Will')
      }

      const data = await res.json()
      if (data.conversation_id) {
        setConversationId(data.conversation_id)
      }

      const { cleanText, checkout } = extractCheckoutBlock(data.content || '')

      const assistantMessage: ChatMessage = {
        id: data.message_id || `bot-${Date.now()}`,
        role: 'assistant',
        content: cleanText || data.content,
        created: new Date(),
        checkoutData: checkout,
      }

      setMessages((prev) => [...prev, assistantMessage])
      if (!isOpen) {
        setHasUnread(true)
      }
    } catch (err: unknown) {
      console.error('Erro no chat com Will:', err)
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          'Opa, tive uma pequena oscilação na conexão! Você pode tentar novamente ou chamar direto nosso WhatsApp para atendimento imediato.',
        created: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckoutHandoff = (checkout: ParsedCheckout) => {
    // Monta a mensagem de checkout pro WhatsApp
    const itemsLines = checkout.items
      .map((it) => {
        const priceText = it.price ? ` — ${formatBRL(it.price * (it.quantity || 1))}` : ''
        return `${it.quantity || 1}x ${it.name}${priceText}`
      })
      .join('\n')

    const subtotalLine = checkout.subtotal
      ? `\n*Subtotal dos itens:* ${formatBRL(checkout.subtotal)}`
      : ''

    const message = [
      `*PEDIDO VIA ASSISTENTE WILL — ${storeName.toUpperCase()}*`,
      ``,
      `*Itens selecionados no chat:*`,
      itemsLines,
      subtotalLine,
      ``,
      `*Tipo:* Atendimento consultivo / Finalização rápida`,
      `Olá, montei esse pedido com o Will no chat do site e quero finalizar com entrega rápida!`,
    ].join('\n')

    window.open(buildWhatsAppUrl(phone, message), '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      {/* Botão Flutuante (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2">
        {/* Balão de chamada quando fechado */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-[#0A0A0A] text-white border border-zinc-800 text-xs font-medium py-2 px-3 rounded-full shadow-2xl hover:bg-zinc-900 transition-all cursor-pointer group"
          >
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            <span>Falar com o Will (Vendedor IA)</span>
          </button>
        )}

        {/* Botão Principal */}
        <div className="relative">
          {hasUnread && !isOpen && (
            <span className="absolute -top-1 -right-1 z-10 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-bounce">
              1
            </span>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Fechar chat' : 'Abrir chat com atendente Will'}
            className={`flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              isOpen
                ? 'bg-zinc-900 text-white rotate-90 border border-zinc-700'
                : 'bg-[#25D366] hover:bg-[#1EBE5A] text-white animate-pulse-ring'
            }`}
          >
            {isOpen ? (
              <X className="w-7 h-7" />
            ) : (
              <MessageCircle className="w-8 h-8 fill-current" />
            )}
          </button>
        </div>
      </div>

      {/* Painel do Chat Flutuante Responsivo */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Atendimento com Will - Consultor da HeadShop"
          className="fixed inset-x-2 bottom-20 top-auto sm:inset-auto sm:bottom-24 sm:right-6 z-50 w-auto sm:w-[420px] max-w-[calc(100vw-1rem)] h-[580px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header do Chat */}
          <div className="bg-[#0A0A0A] text-white px-4 py-3.5 flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
                  <Bot className="w-5 h-5 text-[#25D366]" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-[#0A0A0A] rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display font-bold text-sm text-white">Will — Vendedor</h3>
                  <span className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono px-1.5 py-0.2 rounded uppercase">
                    IA HeadShop
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-sans flex items-center gap-1">
                  <span>Entrega rápida em SP • Atendimento 24h</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleOpenDirectWhatsApp}
                title="Abrir WhatsApp direto da loja"
                aria-label="Abrir WhatsApp oficial da loja"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-[#25D366]" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimizar chat"
                aria-label="Minimizar chat"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader com aviso de frete e garantia */}
          <div className="bg-zinc-100 border-b border-zinc-200 px-3.5 py-1.5 text-[11px] text-zinc-600 flex items-center justify-between font-mono">
            <span>📦 Frete Grátis acima de R$ 299</span>
            <span className="text-[#1EBE5A] font-semibold">SP Express</span>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50/70 text-sm">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant'
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                      isAssistant
                        ? 'bg-white text-zinc-900 border border-zinc-200 rounded-tl-sm'
                        : 'bg-[#0A0A0A] text-white rounded-tr-sm'
                    }`}
                  >
                    {msg.content}

                    {/* Bloco Interativo de Checkout Handoff */}
                    {msg.checkoutData && (
                      <div className="mt-3 pt-3 border-t border-zinc-200/80 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-800 uppercase tracking-wide">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#25D366]" />
                          <span>Resumo do Pedido Pronto</span>
                        </div>

                        <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-200 text-xs space-y-1.5">
                          {msg.checkoutData.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-zinc-700"
                            >
                              <span className="font-medium">
                                {item.quantity || 1}x {item.name}
                              </span>
                              {item.price && (
                                <span className="font-mono text-zinc-900 font-semibold">
                                  {formatBRL(item.price * (item.quantity || 1))}
                                </span>
                              )}
                            </div>
                          ))}
                          {msg.checkoutData.subtotal && (
                            <div className="pt-1.5 border-t border-zinc-200 flex justify-between font-bold text-zinc-950">
                              <span>Subtotal:</span>
                              <span className="font-mono">
                                {formatBRL(msg.checkoutData.subtotal)}
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleCheckoutHandoff(msg.checkoutData!)}
                          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5A] text-white py-2.5 px-3 rounded-lg font-semibold text-xs shadow-md transition-all active:scale-98"
                        >
                          <MessageCircle className="w-4 h-4 fill-current" />
                          Finalizar Pedido no WhatsApp
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 px-1 font-mono">
                    {msg.created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}

            {/* Indicador de Digitação */}
            {isLoading && (
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono py-1">
                <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-zinc-600 animate-pulse" />
                </div>
                <div className="flex items-center gap-1 bg-white border border-zinc-200 px-3 py-2 rounded-2xl rounded-tl-sm shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                  <span className="ml-1 text-[11px] text-zinc-400">
                    Will consultando o catálogo...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões rápidas de início */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-zinc-100 border-t border-zinc-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
              <button
                onClick={() => handleSendMessage('Qual vaporizador você me recomenda?')}
                className="bg-white hover:bg-zinc-200 border border-zinc-300 rounded-full px-2.5 py-1 whitespace-nowrap text-zinc-700 transition-colors"
              >
                Qual vaporizador recomenda?
              </button>
              <button
                onClick={() => handleSendMessage('Quais sedas e piteiras vocês têm?')}
                className="bg-white hover:bg-zinc-200 border border-zinc-300 rounded-full px-2.5 py-1 whitespace-nowrap text-zinc-700 transition-colors"
              >
                Sedas e piteiras
              </button>
              <button
                onClick={() => handleSendMessage('Como funciona a entrega rápida em SP?')}
                className="bg-white hover:bg-zinc-200 border border-zinc-300 rounded-full px-2.5 py-1 whitespace-nowrap text-zinc-700 transition-colors"
              >
                Entrega em SP
              </button>
            </div>
          )}

          {/* Form de Input */}
          <div className="p-3 bg-white border-t border-zinc-200">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Fale com o Will sobre produtos..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-1 h-10 px-3.5 text-sm bg-zinc-50 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                aria-label="Enviar mensagem"
                className="w-10 h-10 rounded-xl bg-[#0A0A0A] hover:bg-zinc-800 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#25D366]" />
                Atendente nativo Skip Cloud
              </span>
              <button
                onClick={handleOpenDirectWhatsApp}
                className="hover:text-zinc-600 underline font-mono"
              >
                Falar direto no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
