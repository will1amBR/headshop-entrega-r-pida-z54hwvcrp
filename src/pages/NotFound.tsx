/* Página 404 — exibida quando o usuário acessa uma rota inexistente */
import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Home, ShoppingBag, MessageCircle, PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

const STORE_WHATSAPP = '5548992463428'

export default function NotFound() {
  const location = useLocation()

  useEffect(() => {
    console.error('404: usuário tentou acessar rota inexistente:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-white py-20">
      <div className="max-w-[560px] mx-auto px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400">
          <PackageSearch className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            Erro 404
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-zinc-950">
            Página não encontrada
          </h1>
          <p className="text-zinc-500 text-sm sm:text-base">
            O link que você acessou não existe ou foi movido. Confira o endereço ou navegue pelo
            nosso catálogo — a entrega rápida continua de pé. ⚡
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-[#0A0A0A] hover:bg-zinc-800 text-white font-medium gap-2"
          >
            <Link to="/">
              <Home className="w-4 h-4" />
              Voltar para o Início
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-zinc-300 hover:border-black font-medium gap-2"
          >
            <Link to="/produtos">
              <ShoppingBag className="w-4 h-4" />
              Ver Produtos
            </Link>
          </Button>
        </div>

        <a
          href={buildWhatsAppUrl(
            STORE_WHATSAPP,
            'Olá! Cheguei por um link quebrado do site e preciso de ajuda.',
          )}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
          Falar com o Ali no WhatsApp
        </a>
      </div>
    </div>
  )
}
