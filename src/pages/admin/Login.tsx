import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login, isAdmin } = useAuth()

  const [email, setEmail] = useState('william@korenambiental.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // If already logged in, redirect to /admin
  React.useEffect(() => {
    if (isAdmin) {
      navigate('/admin')
    }
  }, [isAdmin, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email.trim(), password)
      navigate('/admin')
    } catch (err: unknown) {
      console.error('Erro no login admin', err)
      // Exato erro exigido pela PRD: "E-mail ou senha incorretos"
      setError('E-mail ou senha incorretos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#0A0A0A] text-white px-4 py-12 relative">
      <Link
        to="/"
        className="absolute top-6 left-6 text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar à loja
      </Link>

      <div className="w-full max-w-md space-y-8 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center font-bold text-xl mx-auto">
            ⚡
          </div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-white">
            Painel do Lojista
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Acesso administrativo — HeadShop Entrega Rápida
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">E-mail de Acesso</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="pl-9 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 block">Senha</label>
              <Link
                to="/admin/forgot-password"
                className="text-[11px] text-zinc-400 hover:text-white underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-white text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white hover:bg-zinc-200 text-[#0A0A0A] font-semibold h-11 text-sm transition-all"
          >
            {isLoading ? 'Autenticando...' : 'Entrar no Painel'}
          </Button>
        </form>

        <div className="pt-4 border-t border-zinc-800/80 text-center">
          <p className="text-[11px] text-zinc-500 font-mono">
            Apenas operadores e administradores autorizados.
          </p>
        </div>
      </div>
    </div>
  )
}
