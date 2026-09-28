import React, { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { confirmPasswordReset } = useAuth()

  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Token de redefinição não fornecido ou inválido na URL.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (password !== passwordConfirm) {
      setError('As senhas não coincidem.')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      await confirmPasswordReset(token, password, passwordConfirm)
      setSuccess(true)
      setTimeout(() => {
        navigate('/admin/login')
      }, 3000)
    } catch (err: unknown) {
      console.error('Erro ao redefinir senha', err)
      setError('Token expirado ou inválido. Solicite uma nova recuperação de senha.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#0A0A0A] text-white px-4 py-12 relative">
      <Link
        to="/admin/login"
        className="absolute top-6 left-6 text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Login
      </Link>

      <div className="w-full max-w-md space-y-6 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="font-display font-bold text-2xl tracking-tight text-white">
            Redefinir Nova Senha
          </h1>
          <p className="text-xs text-zinc-400">
            Crie uma senha forte de pelo menos 8 dígitos para seu acesso administrativo.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-950 border border-emerald-700 text-[#25D366] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-zinc-300">
              Sua senha foi redefinida com sucesso! Redirecionando para a tela de login...
            </p>
            <Button
              asChild
              className="w-full bg-white hover:bg-zinc-200 text-black font-semibold h-10 text-xs"
            >
              <Link to="/admin/login">Entrar Agora</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">
                Nova Senha (mín. 8 caracteres)
              </label>
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-white text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white hover:bg-zinc-200 text-[#0A0A0A] font-semibold h-11 text-sm"
            >
              {isLoading ? 'Redefinindo...' : 'Salvar Nova Senha'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
