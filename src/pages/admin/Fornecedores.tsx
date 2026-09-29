import React, { useEffect, useState } from 'react'
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Phone,
  Mail,
  FileText,
  Boxes,
} from 'lucide-react'
import { Supplier } from '@/types/ecommerce'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/services/suppliers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useRealtime } from '@/hooks/use-realtime'

export default function AdminFornecedores() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [name, setName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [suppliedProducts, setSuppliedProducts] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getSuppliers()
      setSuppliers(data)
    } catch (e) {
      console.error('Erro ao buscar fornecedores:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('suppliers', () => {
    getSuppliers().then(setSuppliers)
  })

  const openCreateModal = () => {
    setEditingSupplier(null)
    setName('')
    setContactPerson('')
    setPhone('')
    setEmail('')
    setCnpj('')
    setSuppliedProducts('')
    setNotes('')
    setIsModalOpen(true)
  }

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s)
    setName(s.name)
    setContactPerson(s.contact_person || '')
    setPhone(s.phone || '')
    setEmail(s.email || '')
    setCnpj(s.cnpj || '')
    setSuppliedProducts(s.supplied_products || '')
    setNotes(s.notes || '')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Informe o nome da empresa fornecedora.')
      return
    }

    setIsSaving(true)
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, {
          name: name.trim(),
          contact_person: contactPerson.trim(),
          phone: phone.trim(),
          email: email.trim(),
          cnpj: cnpj.trim(),
          supplied_products: suppliedProducts.trim(),
          notes: notes.trim(),
        })
      } else {
        await createSupplier({
          name: name.trim(),
          contact_person: contactPerson.trim(),
          phone: phone.trim(),
          email: email.trim(),
          cnpj: cnpj.trim(),
          supplied_products: suppliedProducts.trim(),
          notes: notes.trim(),
        })
      }

      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      console.error('Erro ao salvar fornecedor:', err)
      alert('Falha ao salvar fornecedor.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, supName: string) => {
    if (!window.confirm(`Deseja remover o fornecedor "${supName}"?`)) return
    try {
      await deleteSupplier(id)
      setSuppliers((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      console.error('Erro ao excluir:', err)
      alert('Falha ao excluir fornecedor.')
    }
  }

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
      s.supplied_products?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-zinc-700" />
            Cadeia de Suprimentos & OEM
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950">
            Fornecedores Cadastrados
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Cadastro de parceiros industriais e distribuidores para cotações e recompras de estoque.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-zinc-300 gap-1.5 text-xs bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-[#0A0A0A] hover:bg-zinc-800 text-white font-medium text-xs gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por fornecedor ou produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm bg-zinc-50 border-zinc-200"
          />
        </div>
        <div className="text-xs font-mono text-zinc-500">
          Total: <strong>{filtered.length}</strong> fornecedores
        </div>
      </div>

      {/* Cards de Fornecedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-zinc-400 transition-colors flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-base text-zinc-950">{s.name}</h3>
                  {s.contact_person && (
                    <span className="text-xs text-zinc-500 block">Contato: {s.contact_person}</span>
                  )}
                </div>
                <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>

              {s.cnpj && (
                <div className="text-[11px] font-mono text-zinc-600 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200 inline-block">
                  Doc / CNPJ: {s.cnpj}
                </div>
              )}

              <div className="space-y-1.5 pt-2 text-xs text-zinc-600">
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="font-mono">{s.phone}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{s.email}</span>
                  </div>
                )}
                {s.supplied_products && (
                  <div className="flex items-start gap-2 pt-1 text-zinc-700">
                    <Boxes className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{s.supplied_products}</span>
                  </div>
                )}
                {s.notes && (
                  <p className="text-[11px] text-zinc-500 italic pt-1 border-t border-zinc-100">
                    "{s.notes}"
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(s)}
                className="h-7 text-[11px] px-2.5 border-zinc-300 gap-1"
              >
                <Edit2 className="w-3 h-3" /> Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(s.id, s.name)}
                className="h-7 text-[11px] px-2.5 text-red-600 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="w-3 h-3" /> Excluir
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar / Editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-xl">
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Nome da Empresa / Fábrica <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Ex: Higher Manufacturing Hong Kong"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 block">
                    Pessoa de Contato
                  </label>
                  <Input
                    placeholder="Ex: Sr. Chen Wei"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 block">
                    Telefone / WhatsApp
                  </label>
                  <Input
                    placeholder="+852 9123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 block">E-mail</label>
                  <Input
                    type="email"
                    placeholder="contato@fornecedor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 block">
                    CNPJ / ID Fiscal
                  </label>
                  <Input
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Linhas de Produtos Fornecidas
                </label>
                <Input
                  placeholder="Ex: Vaporizadores, Sedas Orgânicas, Bongs de Vidro..."
                  value={suppliedProducts}
                  onChange={(e) => setSuppliedProducts(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Observações / Condições
                </label>
                <textarea
                  rows={2}
                  placeholder="Prazos de produção, termos de frete (FOB/CIF), etc..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-zinc-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-medium"
              >
                {isSaving ? 'Salvando...' : 'Salvar Fornecedor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
