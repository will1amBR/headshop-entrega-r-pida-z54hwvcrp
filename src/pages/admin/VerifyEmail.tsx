import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const { confirmVerification } = useAuth()
  const token = searchParams.get('token') || ''

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage('Token de verificação ausente na URL.')
      return
    }

    confirmVerification(token)
      .then(() => {
        setStatus('success')
      })
      .catch((err: unknown) => {
        console.error('Erro na verificação de e-mail', err)
        setStatus('error')
        setErrorMessage('Token inválido ou expirado.')
      })
  }, [token, confirmVerification])

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#0A0A0A] text-white px-4 py-12 relative">
      <Link
        to="/"
        className="absolute top-6 left-6 text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar à loja
      </Link>

      <div className="w-full max-w-md space-y-6 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl text-center">
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-zinc-700 border-t-white rounded-full animate-spin mx-auto" />
            <h1 className="font-display font-bold text-2xl tracking-tight text-white">
              Confirmando e-mail...
            </h1>
            <p className="text-xs text-zinc-400">Por favor, aguarde alguns instantes.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-950 border border-emerald-700 text-[#25D366] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h1 className="font-display font-bold text-2xl tracking-tight text-white">
              E-mail Confirmado!
            </h1>
            <p className="text-xs text-zinc-400">
              Sua conta foi verificada com sucesso. Agora você pode acessar o painel de lojista.
            </p>
            <Button
              asChild
              className="w-full bg-white hover:bg-zinc-200 text-black font-semibold h-10 text-xs"
            >
              <Link to="/admin/login">Ir para o Login</Link>
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-red-950/60 border border-red-800 text-red-400 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="font-display font-bold text-2xl tracking-tight text-white">
              Falha na Verificação
            </h1>
            <p className="text-xs text-red-300">{errorMessage}</p>
            <Button
              asChild
              variant="outline"
              className="w-full border-zinc-700 text-white hover:bg-zinc-800 h-10 text-xs"
            >
              <Link to="/admin/login">Voltar ao Login</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
