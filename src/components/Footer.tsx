import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, ShieldCheck, Truck, Sparkles, Instagram, Facebook } from 'lucide-react'
import { getSeoSettings } from '@/services/seo'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export const Footer: React.FC = () => {
  const [phone, setPhone] = useState('5511999999999')

  useEffect(() => {
    getSeoSettings().then((settings) => {
      if (settings?.whatsapp_number) {
        setPhone(settings.whatsapp_number)
      }
    })
  }, [])

  return (
    <footer className="bg-[#0A0A0A] text-zinc-300 border-t border-zinc-800 pt-16 pb-12 mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-zinc-800/80">
          {/* Column 1: Brand & Desc */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center font-bold text-sm">
                ⚡
              </div>
              <span className="font-display font-bold text-lg text-white tracking-tight">
                HEADSHOP ENTREGA RÁPIDA
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Sua headshop completa com entrega ágil para todo o Brasil. Atendimento humanizado e
              pedidos finalizados direto no WhatsApp com total comodidade.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={buildWhatsAppUrl(
                  phone,
                  'Olá! Gostaria de falar com o atendimento da HeadShop.',
                )}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase">
              Navegação
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/produtos" className="hover:text-white transition-colors">
                  Todos os Produtos
                </Link>
              </li>
              <li>
                <Link to="/carrinho" className="hover:text-white transition-colors">
                  Carrinho e Frete
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">
                  Área do Lojista
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Process */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase">
              Como Funciona
            </h4>
            <div className="space-y-3 text-sm text-zinc-400">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span>Escolha seus produtos e selecione sua região para o frete fixo.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                <span>Clique em fechar pedido e envie a lista pronta para o WhatsApp da loja.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span>
                  Pagamento combinado diretamente com nosso atendente (PIX, cartão ou boleto).
                </span>
              </div>
            </div>
          </div>

          {/* Column 4: WhatsApp Payment badge */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase">
              Formas de Pagamento
            </h4>
            <div className="p-4 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-white font-medium text-sm">
                <Sparkles className="w-4 h-4 text-[#25D366]" />
                <span>Pagamento combinado via WhatsApp</span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                Você não insere dados financeiros no site. A negociação e a chave PIX ou link de
                pagamento são combinados de forma segura pelo chat.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
          <p>© {new Date().getFullYear()} HeadShop Entrega Rápida. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            <span>Material Monochrome Design System</span>
            <span>•</span>
            <span>Brasil</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
