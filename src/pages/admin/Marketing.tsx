import React, { useEffect, useState, useMemo } from 'react'
import {
  Megaphone,
  Plus,
  Search,
  MessageCircle,
  Copy,
  Check,
  Edit,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  Users,
  Tag,
  Calendar,
  Sparkles,
  Send,
} from 'lucide-react'
import { Campaign, CampaignStatus, Order, Product, CustomerProfile } from '@/types/ecommerce'
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  incrementCampaignClicks,
} from '@/services/campaigns'
import { getOrders } from '@/services/orders'
import { getAllProductsAdmin } from '@/services/products'
import { buildCustomerProfilesFromOrders, segmentCustomers } from '@/services/crm'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { formatDate } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRealtime } from '@/hooks/use-realtime'

export default function AdminMarketing() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')

  // Modal de Criar / Editar Campanha
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: '',
    type: 'Desconto & Oferta',
    description: '',
    target_audience: 'todos',
    status: 'ativa',
    discount_code: '',
    message_template: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  })

  // Gerador de Mensagens Promocionais
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [selectedCampaignForGen, setSelectedCampaignForGen] = useState<Campaign | null>(null)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [targetAudienceKey, setTargetAudienceKey] = useState('todos')
  const [customDiscountText, setCustomDiscountText] = useState('15% OFF')
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const STORE_WHATSAPP = '5548992463428'

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [camps, ords, prods] = await Promise.all([
        getCampaigns(),
        getOrders(),
        getAllProductsAdmin(),
      ])
      setCampaigns(camps)
      setOrders(ords)
      setProducts(prods)
    } catch (e) {
      console.error('Erro ao buscar dados de marketing:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('campaigns', () => {
    getCampaigns().then(setCampaigns)
  })

  // Perfis de CRM para segmentação
  const customerProfiles = useMemo(() => {
    return buildCustomerProfilesFromOrders(orders)
  }, [orders])

  const audienceStats = useMemo(() => {
    return {
      todos: customerProfiles.length,
      ativos: segmentCustomers(customerProfiles, 'ativos').count,
      inativos_30d: segmentCustomers(customerProfiles, 'inativos_30d').count,
      recorrentes_2plus: segmentCustomers(customerProfiles, 'recorrentes_2plus').count,
      gastos_altos: segmentCustomers(customerProfiles, 'gastos_altos').count,
      sudeste: segmentCustomers(customerProfiles, 'sudeste').count,
    }
  }, [customerProfiles])

  // Filtragem
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.type?.toLowerCase().includes(search.toLowerCase()) ||
        c.discount_code?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'todos' || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [campaigns, search, statusFilter])

  // Handlers CRUD
  const handleOpenCreate = () => {
    setEditingCampaign(null)
    setFormData({
      name: '',
      type: 'Desconto & Oferta',
      description: '',
      target_audience: 'todos',
      status: 'ativa',
      discount_code: '',
      message_template:
        '🔥 *Especial HeadShop Entrega Rápida:* Garanta suas sedas, piteiras e acessórios com desconto exclusivo! Envie uma mensagem e aproveite a entrega expressa.',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (camp: Campaign) => {
    setEditingCampaign(camp)
    setFormData({
      name: camp.name,
      type: camp.type,
      description: camp.description,
      target_audience: camp.target_audience,
      status: camp.status,
      discount_code: camp.discount_code,
      message_template: camp.message_template,
      start_date: camp.start_date,
      end_date: camp.end_date,
    })
    setDialogOpen(true)
  }

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name?.trim()) return

    try {
      if (editingCampaign) {
        const updated = await updateCampaign(editingCampaign.id, formData)
        setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      } else {
        const created = await createCampaign(formData)
        setCampaigns((prev) => [created, ...prev])
      }
      setDialogOpen(false)
    } catch (err) {
      console.error('Erro ao salvar campanha:', err)
      alert('Erro ao salvar campanha.')
    }
  }

  const handleToggleStatus = async (camp: Campaign) => {
    const newStatus: CampaignStatus = camp.status === 'ativa' ? 'pausada' : 'ativa'
    try {
      const updated = await updateCampaign(camp.id, { status: newStatus })
      setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    } catch (err) {
      console.error('Erro ao alterar status:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta campanha?')) return
    try {
      await deleteCampaign(id)
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Erro ao deletar campanha:', err)
    }
  }

  // Abrir o gerador de mensagem personalizada
  const handleOpenGenerator = (camp: Campaign) => {
    setSelectedCampaignForGen(camp)
    setTargetAudienceKey(camp.target_audience || 'todos')
    setCustomDiscountText(camp.discount_code ? `cupom *${camp.discount_code}*` : '15% OFF')
    setSelectedProductIds([])

    // Mensagem inicial
    const baseMsg =
      camp.message_template ||
      `🔥 *Novidade na HeadShop Entrega Rápida:* Temos uma condição especial para você! Use o cupom ${camp.discount_code || 'HEADSHOP10'} e aproveite envio expresso.`
    setGeneratedMessage(baseMsg)
    setGeneratorOpen(true)
  }

  // Recalcular texto da mensagem com os produtos e público selecionados
  const regenerateMessage = () => {
    const selectedProds = products.filter((p) => selectedProductIds.includes(p.id))
    const audienceInfo = segmentCustomers(customerProfiles, targetAudienceKey)

    let text = `🔥 *Especial HeadShop Entrega Rápida*\n\n`

    if (targetAudienceKey === 'inativos_30d') {
      text += `Fala, tudo bem? Sentimos sua falta por aqui! Preparamos uma condição exclusiva para o seu retorno:\n`
    } else if (targetAudienceKey === 'recorrentes_2plus') {
      text += `Como você é um cliente VIP frequente da casa, liberamos acesso antecipado às nossas melhores ofertas:\n`
    } else {
      text += `Chegaram novidades no nosso catálogo de sedas, piteiras e acessórios!\n`
    }

    if (customDiscountText) {
      text += `👉 *Benefício:* ${customDiscountText}\n\n`
    }

    if (selectedProds.length > 0) {
      text += `*Destaques selecionados para você:*\n`
      selectedProds.forEach((p) => {
        text += `• ${p.name} - R$ ${p.price.toFixed(2).replace('.', ',')}\n`
      })
      text += `\n`
    }

    text += `📦 Entregamos rápido em São Paulo e enviamos para todo o Brasil (Frete Grátis acima de R$ 299).\n`
    text += `Basta responder esta mensagem para garantir o seu pedido!`

    setGeneratedMessage(text)
  }

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generatedMessage)
    setCopied(true)
    if (selectedCampaignForGen) {
      incrementCampaignClicks(selectedCampaignForGen.id)
    }
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5 text-zinc-800" />
            Marketing & Engajamento
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Campanhas de Marketing
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Crie campanhas segmentadas por público do CRM, gere mensagens promocionais e dispare via
            WhatsApp.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          size="sm"
          className="bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs gap-1.5 h-9 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Segment Stats Bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-zinc-700" />
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-700">
            Públicos Disponíveis no CRM
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <span className="text-zinc-500 text-[11px] block">Toda a Base</span>
            <strong className="text-sm font-mono text-zinc-950">
              {audienceStats.todos} clientes
            </strong>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <span className="text-zinc-500 text-[11px] block">Ativos (últ. 30d)</span>
            <strong className="text-sm font-mono text-emerald-600">
              {audienceStats.ativos} clientes
            </strong>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <span className="text-zinc-500 text-[11px] block">Inativos (30d+)</span>
            <strong className="text-sm font-mono text-amber-600">
              {audienceStats.inativos_30d} clientes
            </strong>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <span className="text-zinc-500 text-[11px] block">Recorrentes (2+)</span>
            <strong className="text-sm font-mono text-purple-600">
              {audienceStats.recorrentes_2plus} clientes
            </strong>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <span className="text-zinc-500 text-[11px] block">Ticket Alto (R$200+)</span>
            <strong className="text-sm font-mono text-zinc-950">
              {audienceStats.gastos_altos} clientes
            </strong>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <span className="text-zinc-500 text-[11px] block">Região Sudeste</span>
            <strong className="text-sm font-mono text-zinc-950">
              {audienceStats.sudeste} clientes
            </strong>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por nome, cupom ou tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm bg-zinc-50 border-zinc-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-zinc-600 whitespace-nowrap">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 text-xs bg-zinc-50 border-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="ativa">Ativas</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="pausada">Pausadas</SelectItem>
              <SelectItem value="concluida">Concluídas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCampaigns.length === 0 ? (
          <div className="col-span-full bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-500 text-xs">
            Nenhuma campanha cadastrada ou encontrada.
          </div>
        ) : (
          filteredCampaigns.map((camp) => {
            const audienceCount =
              audienceStats[camp.target_audience as keyof typeof audienceStats] ??
              audienceStats.todos

            return (
              <div
                key={camp.id}
                className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-all"
              >
                <div className="space-y-3">
                  {/* Status badge & Actions */}
                  <div className="flex items-center justify-between">
                    <CampaignStatusBadge status={camp.status} />

                    <div className="flex items-center gap-1 text-zinc-400">
                      <button
                        onClick={() => handleToggleStatus(camp)}
                        title={camp.status === 'ativa' ? 'Pausar campanha' : 'Ativar campanha'}
                        className="p-1 hover:text-black transition-colors"
                      >
                        {camp.status === 'ativa' ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(camp)}
                        title="Editar"
                        className="p-1 hover:text-black transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(camp.id)}
                        title="Excluir"
                        className="p-1 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Type */}
                  <div>
                    <h3 className="font-display font-bold text-base text-zinc-950 leading-snug">
                      {camp.name}
                    </h3>
                    {camp.type && (
                      <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block mt-0.5">
                        {camp.type}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {camp.description && (
                    <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                      {camp.description}
                    </p>
                  )}

                  {/* Audience & Coupon */}
                  <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-600">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-medium capitalize">
                        {camp.target_audience?.replace('_', ' ') || 'Todos'}
                      </span>
                      <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                        {audienceCount} contatos
                      </Badge>
                    </div>

                    {camp.discount_code && (
                      <div className="flex items-center gap-1 font-mono font-bold bg-zinc-100 px-2 py-0.5 rounded text-zinc-900 text-[11px]">
                        <Tag className="w-3 h-3 text-zinc-500" />
                        {camp.discount_code}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom CTA: Message Generator */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">
                    {camp.clicks_count || 0} cópias/disparos
                  </span>

                  <Button
                    size="sm"
                    onClick={() => handleOpenGenerator(camp)}
                    className="bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs h-8 gap-1.5 font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Gerar Mensagem WhatsApp
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Criar / Editar Campanha */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg">
              {editingCampaign ? 'Editar Campanha' : 'Criar Nova Campanha'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure o público-alvo, cupom de desconto e mensagem modelo para disparos manuais
              via WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCampaign} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Nome da Campanha *</label>
              <Input
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex.: Promoção Sedas King Size ou Resgate de Inativos"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Tipo de Campanha</label>
                <Input
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="Ex.: Reativação, Lançamento"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Cupom de Desconto</label>
                <Input
                  value={formData.discount_code || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_code: e.target.value.toUpperCase() })
                  }
                  placeholder="Ex.: HEADSHOP15"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Público-Alvo (CRM)</label>
                <Select
                  value={formData.target_audience || 'todos'}
                  onValueChange={(val) => setFormData({ ...formData, target_audience: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Clientes ({audienceStats.todos})</SelectItem>
                    <SelectItem value="ativos">
                      Clientes Ativos nos últ. 30d ({audienceStats.ativos})
                    </SelectItem>
                    <SelectItem value="inativos_30d">
                      Inativos 30d+ ({audienceStats.inativos_30d})
                    </SelectItem>
                    <SelectItem value="recorrentes_2plus">
                      Recorrentes 2+ Pedidos ({audienceStats.recorrentes_2plus})
                    </SelectItem>
                    <SelectItem value="gastos_altos">
                      Gasto R$200+ ({audienceStats.gastos_altos})
                    </SelectItem>
                    <SelectItem value="sudeste">
                      Região Sudeste ({audienceStats.sudeste})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Status</label>
                <Select
                  value={formData.status || 'ativa'}
                  onValueChange={(val) =>
                    setFormData({ ...formData, status: val as CampaignStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="pausada">Pausada</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Descrição / Objetivo Interno</label>
              <Textarea
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Finalidade da campanha e metas comerciais..."
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Modelo de Mensagem Padrão</label>
              <Textarea
                rows={3}
                value={formData.message_template || ''}
                onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                placeholder="Texto que será copiado ou enviado via WhatsApp..."
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#0A0A0A] hover:bg-zinc-800 text-white">
                Salvar Campanha
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Gerador de Mensagens Promocionais & Link wa.me */}
      <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <DialogTitle className="font-display font-bold text-xl">
                Gerador de Mensagem WhatsApp
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Selecione o público e produtos do catálogo para gerar o texto formatado e o link wa.me
              pronto para envio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 text-xs">
            {/* Audience and discount customization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 block">Público do CRM:</label>
                <Select
                  value={targetAudienceKey}
                  onValueChange={(val) => {
                    setTargetAudienceKey(val)
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">
                      Toda a base ({audienceStats.todos} clientes)
                    </SelectItem>
                    <SelectItem value="ativos">
                      Clientes Ativos ({audienceStats.ativos} clientes)
                    </SelectItem>
                    <SelectItem value="inativos_30d">
                      Inativos 30d+ ({audienceStats.inativos_30d} clientes)
                    </SelectItem>
                    <SelectItem value="recorrentes_2plus">
                      Recorrentes VIP ({audienceStats.recorrentes_2plus} clientes)
                    </SelectItem>
                    <SelectItem value="gastos_altos">
                      Gasto R$200+ ({audienceStats.gastos_altos} clientes)
                    </SelectItem>
                    <SelectItem value="sudeste">
                      Sudeste ({audienceStats.sudeste} clientes)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 block">
                  Texto da Oferta / Cupom:
                </label>
                <Input
                  value={customDiscountText}
                  onChange={(e) => setCustomDiscountText(e.target.value)}
                  placeholder="Ex.: 15% OFF ou Frete Grátis"
                  className="bg-white font-mono"
                />
              </div>
            </div>

            {/* Product multi-select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-zinc-800">
                  Incluir Produtos em Destaque na Mensagem ({selectedProductIds.length}{' '}
                  selecionados):
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={regenerateMessage}
                  className="h-7 text-[11px] gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Atualizar Texto
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-zinc-200 rounded-lg bg-zinc-50">
                {products
                  .filter((p) => p.active)
                  .slice(0, 24)
                  .map((p) => {
                    const isSelected = selectedProductIds.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProductIds((prev) =>
                            isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id],
                          )
                        }}
                        className={`p-2 rounded border text-left text-[11px] transition-all truncate ${
                          isSelected
                            ? 'bg-zinc-950 text-white border-zinc-950 font-semibold'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        <div className="truncate">{p.name}</div>
                        <div
                          className={`font-mono text-[10px] ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}
                        >
                          R$ {p.price.toFixed(2)}
                        </div>
                      </button>
                    )
                  })}
              </div>
            </div>

            {/* Generated Message Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-zinc-800">
                  Mensagem Gerada (WhatsApp Format):
                </label>
                <span className="text-[10px] font-mono text-zinc-400">
                  Suporta *negrito* e emojis
                </span>
              </div>

              <Textarea
                rows={6}
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
                className="font-sans text-xs bg-zinc-50 border-zinc-300 leading-relaxed"
              />
            </div>

            {/* Action Buttons: One-click copy & Direct WhatsApp open */}
            <div className="pt-3 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  onClick={handleCopyMessage}
                  className={`flex-1 sm:flex-initial h-10 text-xs font-semibold gap-1.5 transition-all ${
                    copied
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado com Sucesso!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Mensagem
                    </>
                  )}
                </Button>

                {/* Abrir WhatsApp oficial da loja com a mensagem pré-preenchida */}
                <a
                  href={buildWhatsAppUrl(STORE_WHATSAPP, generatedMessage)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    if (selectedCampaignForGen) {
                      incrementCampaignClicks(selectedCampaignForGen.id)
                    }
                  }}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md font-semibold text-xs bg-[#25D366] hover:bg-[#1EBE5A] text-white shadow-xs transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  Testar no WhatsApp da Loja
                </a>
              </div>

              <span className="text-[11px] font-mono text-zinc-400 text-center sm:text-right">
                WhatsApp: +55 (48) 99246-3428
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  switch (status) {
    case 'ativa':
      return (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px] uppercase font-mono font-bold">
          Ativa
        </Badge>
      )
    case 'rascunho':
      return (
        <Badge variant="secondary" className="text-[10px] uppercase font-mono font-bold">
          Rascunho
        </Badge>
      )
    case 'pausada':
      return (
        <Badge className="bg-amber-600 text-white hover:bg-amber-600 text-[10px] uppercase font-mono font-bold">
          Pausada
        </Badge>
      )
    case 'concluida':
      return (
        <Badge className="bg-zinc-800 text-white hover:bg-zinc-800 text-[10px] uppercase font-mono font-bold">
          Concluída
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}
