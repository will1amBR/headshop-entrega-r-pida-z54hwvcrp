import React, { useState, useEffect } from 'react'

const ANNOUNCEMENTS = [
  '🚀 Entrega rápida em São Paulo • Envio para todo o Brasil',
  '⚡ Entregas expressas na Grande São Paulo',
  '💬 Pedidos pelo WhatsApp com atendimento ágil',
  '🔒 Pagamento combinado direto com a loja',
]

export const AnnouncementBar: React.FC = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-[#0A0A0A] text-zinc-300 text-xs sm:text-sm py-2 px-4 text-center font-medium border-b border-zinc-900 overflow-hidden relative">
      <div
        key={index}
        className="animate-fade-in inline-flex items-center justify-center gap-2 tracking-wide font-mono uppercase"
      >
        {ANNOUNCEMENTS[index]}
      </div>
    </div>
  )
}
