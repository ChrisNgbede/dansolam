import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StorefrontLayout from '../components/layout/StorefrontLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Storefront pages
import Home from '../pages/storefront/Home';
import Shop from '../pages/storefront/Shop';
import ProductDetails from '../pages/storefront/ProductDetails';
import Cart from '../pages/storefront/Cart';
import Checkout from '../pages/storefront/Checkout';
import OrderTracking from '../pages/storefront/OrderTracking';
import Account from '../pages/storefront/Account';
import PolicyPage from '../pages/storefront/PolicyPage';
import Gallery from '../pages/storefront/Gallery';
import Blog from '../pages/storefront/Blog';
import ArticleDetails from '../pages/storefront/ArticleDetails';
import ContactUs from '../pages/storefront/ContactUs';
import Reviews from '../pages/storefront/Reviews';
import ForgotPassword from '../pages/storefront/ForgotPassword';
import ResetPassword from '../pages/storefront/ResetPassword';

// Admin pages
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminProducts from '../pages/admin/AdminProducts';
import AdminProductForm from '../pages/admin/AdminProductForm';
import AdminOrders from '../pages/admin/AdminOrders';
import AdminOrderDetails from '../pages/admin/AdminOrderDetails';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminCollections from '../pages/admin/AdminCollections';
import AdminCoupons from '../pages/admin/AdminCoupons';
import AdminReviews from '../pages/admin/AdminReviews';
import AdminCustomers from '../pages/admin/AdminCustomers';
import AdminInventory from '../pages/admin/AdminInventory';
import AdminInvoices from '../pages/admin/AdminInvoices';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminGallery from '../pages/admin/AdminGallery';
import AdminArticles from '../pages/admin/AdminArticles';
import AdminDiscounts from '../pages/admin/AdminDiscounts';
import AdminTaxes from '../pages/admin/AdminTaxes';
import AdminReports from '../pages/admin/AdminReports';
import AdminShipping from '../pages/admin/AdminShipping';
import AdminPages from '../pages/admin/AdminPages';
import AdminHero from '../pages/admin/AdminHero';
import AdminNewsletter from '../pages/admin/AdminNewsletter';
import AdminExpenses from '../pages/admin/AdminExpenses';
import AdminPurchases from '../pages/admin/AdminPurchases';
import RequireEnabledModule from '../components/auth/RequireEnabledModule';
import AdminInquiries from '../pages/admin/AdminInquiries';
import AdminBrands from '../pages/admin/AdminBrands';
import AdminFittingSessions from '../pages/admin/AdminFittingSessions';
import AdminProfile from '../pages/admin/AdminProfile';
import PosSessionStart from '../pages/admin/pos/PosSessionStart';
import PosTerminal from '../pages/admin/pos/PosTerminal';
import PosSessionHistory from '../pages/admin/pos/PosSessionHistory';
import RequireAdminAuth from '../components/auth/RequireAdminAuth';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Customer Storefront Routes */}
      <Route path="/" element={<StorefrontLayout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:slug" element={<ProductDetails />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-tracking" element={<OrderTracking />} />
        <Route path="account" element={<Account />} />
        <Route path="pages/:slug" element={<PolicyPage />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<ArticleDetails />} />
        <Route path="contact" element={<ContactUs />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
      </Route>

      {/* Admin Panel Login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Dashboard Protected Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProductForm />} />
        <Route path="products/:id/edit" element={<AdminProductForm />} />
        <Route path="collections" element={<AdminCollections />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="discounts" element={<AdminDiscounts />} />
        <Route path="taxes" element={<AdminTaxes />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetails />} />
        <Route path="invoices" element={<AdminInvoices />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="gallery" element={<AdminGallery />} />
        <Route path="articles" element={<AdminArticles />} />
        <Route path="shipping" element={<AdminShipping />} />
        <Route path="pages" element={<AdminPages />} />
        <Route path="hero" element={<AdminHero />} />
        <Route path="newsletter" element={<AdminNewsletter />} />
        <Route path="expenses" element={<RequireEnabledModule settingKey="module_expenses_enabled"><AdminExpenses /></RequireEnabledModule>} />
        <Route path="purchases" element={<RequireEnabledModule settingKey="module_purchases_enabled"><AdminPurchases /></RequireEnabledModule>} />
        <Route path="inquiries" element={<AdminInquiries />} />
        <Route path="fitting-sessions" element={<AdminFittingSessions />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="brands" element={<AdminBrands />} />
      </Route>

      {/* POS Module Full-Screen Routes (bypasses AdminLayout wrapper for speed and layout control) */}
      <Route path="/admin/pos" element={<RequireAdminAuth><PosSessionStart /></RequireAdminAuth>} />
      <Route path="/admin/pos/terminal" element={<RequireAdminAuth><PosTerminal /></RequireAdminAuth>} />
      <Route path="/admin/pos/history" element={<RequireAdminAuth><PosSessionHistory /></RequireAdminAuth>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
