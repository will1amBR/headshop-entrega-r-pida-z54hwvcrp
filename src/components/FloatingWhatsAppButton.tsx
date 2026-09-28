import React, { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { getSeoSettings } from '@/services/seo'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export const FloatingWhatsAppButton: React.FC = () => {
  const [phone, setPhone] = useState('5511999999999')

  useEffect(() => {
    getSeoSettings().then((settings) => {
      if (settings?.whatsapp_number) {
        setPhone(settings.whatsapp_number)
      }
    })
  }, [])

  const handleClick = () => {
    const defaultMsg =
      'Olá! Gostaria de tirar dúvidas sobre os produtos da HeadShop Entrega Rápida.'
    window.open(buildWhatsAppUrl(phone, defaultMsg), '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Falar pelo WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] hover:bg-[#1EBE5A] text-white shadow-2xl transition-transform duration-200 hover:scale-105 active:scale-95 animate-pulse-ring group"
    >
      <MessageCircle className="w-8 h-8 sm:w-9 sm:h-9 fill-current" />
      <span className="sr-only">Chamar no WhatsApp</span>
      <span className="absolute right-full mr-3 hidden sm:group-hover:flex items-center bg-black/90 text-white text-xs font-medium py-1 px-2.5 rounded shadow-lg whitespace-nowrap pointer-events-none transition-opacity">
        Pedir pelo WhatsApp
      </span>
    </button>
  )
}
