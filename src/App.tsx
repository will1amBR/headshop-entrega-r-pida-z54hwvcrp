/* Main App Component - Handles routing (using react-router-dom), query client and other providers */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'

import Layout from './components/Layout'
import Index from './pages/Index'
import ProductsPage from './pages/Products'
import ProductDetailPage from './pages/ProductDetail'
import CartPage from './pages/Cart'
import CheckoutPage from './pages/Checkout'
import NotFound from './pages/NotFound'

// Auth & Admin pages
import AdminLogin from './pages/admin/Login'
import ForgotPassword from './pages/admin/ForgotPassword'
import ResetPassword from './pages/admin/ResetPassword'
import VerifyEmail from './pages/admin/VerifyEmail'
import { ProtectedAdminRoute } from './components/admin/ProtectedAdminRoute'
import { AdminLayout } from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminKanban from './pages/admin/Kanban'
import AdminOrders from './pages/admin/Orders'
import AdminExpedicao from './pages/admin/Expedicao'
import AdminCommercial from './pages/admin/Commercial'
import AdminCRM from './pages/admin/CRM'
import AdminMarketing from './pages/admin/Marketing'
import AdminProducts from './pages/admin/Products'
import AdminCategories from './pages/admin/Categories'
import AdminFinanceiro from './pages/admin/Financeiro'
import AdminIntegracoes from './pages/admin/Integracoes'
import AdminEstoque from './pages/admin/Estoque'
import AdminFornecedores from './pages/admin/Fornecedores'
import AdminRecompras from './pages/admin/Recompras'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Storefront public pages (with global Layout, announcement, navbar, footer, WhatsApp button) */}
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/produtos" element={<ProductsPage />} />
              <Route path="/produto/:id" element={<ProductDetailPage />} />
              <Route path="/carrinho" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
            </Route>

            {/* Public Auth routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot-password" element={<ForgotPassword />} />
            <Route path="/admin/reset-password" element={<ResetPassword />} />
            <Route path="/admin/verify-email" element={<VerifyEmail />} />

            {/* Protected Admin routes */}
            <Route path="/admin" element={<ProtectedAdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="kanban" element={<AdminKanban />} />
                <Route path="pedidos" element={<AdminOrders />} />
                <Route path="expedicao" element={<AdminExpedicao />} />
                <Route path="comercial" element={<AdminCommercial />} />
                <Route path="crm" element={<AdminCRM />} />
                <Route path="marketing" element={<AdminMarketing />} />
                <Route path="financeiro" element={<AdminFinanceiro />} />
                <Route path="integracoes" element={<AdminIntegracoes />} />
                <Route path="estoque" element={<AdminEstoque />} />
                <Route path="fornecedores" element={<AdminFornecedores />} />
                <Route path="recompras" element={<AdminRecompras />} />
                <Route path="produtos" element={<AdminProducts />} />
                <Route path="categorias" element={<AdminCategories />} />
              </Route>
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
