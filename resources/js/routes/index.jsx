import React, { lazy, Suspense, useEffect } from 'react';
import { useRouteLoading } from '../components/ui/ActivityIndicator';
import { useQueryClient } from '@tanstack/react-query';
import { cmsPageQuery } from '../utils/pageQueries';

/**
 * After a deploy the old chunk filenames are gone, so a tab left open asks for a
 * file that no longer exists and the server answers with HTML. Reload once to
 * pick up the new build instead of showing an error page.
 */
const RELOAD_FLAG = 'dansolam_chunk_reload';
const lazyPage = (factory) => lazy(() => factory()
  .then((module) => {
    sessionStorage.removeItem(RELOAD_FLAG);
    return module;
  })
  .catch((error) => {
    if (!sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
      return new Promise(() => {}); // Hold until the reload takes over.
    }
    throw error;
  }));
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import StorefrontLayout from '../components/layout/StorefrontLayout';
const AdminLayout = lazyPage(() => import('../components/layout/AdminLayout'));

// Storefront pages
import Home from '../pages/storefront/Home';
const Shop = lazyPage(() => import('../pages/storefront/Shop'));
const ProductDetails = lazyPage(() => import('../pages/storefront/ProductDetails'));
const Cart = lazyPage(() => import('../pages/storefront/Cart'));
const Checkout = lazyPage(() => import('../pages/storefront/Checkout'));
const OrderTracking = lazyPage(() => import('../pages/storefront/OrderTracking'));
const PayOrder = lazyPage(() => import('../pages/storefront/PayOrder'));
const Account = lazyPage(() => import('../pages/storefront/Account'));
const PolicyPage = lazyPage(() => import('../pages/storefront/PolicyPage'));
const Gallery = lazyPage(() => import('../pages/storefront/Gallery'));
const Blog = lazyPage(() => import('../pages/storefront/Blog'));
const ArticleDetails = lazyPage(() => import('../pages/storefront/ArticleDetails'));
const ContactUs = lazyPage(() => import('../pages/storefront/ContactUs'));
const Reviews = lazyPage(() => import('../pages/storefront/Reviews'));
const ForgotPassword = lazyPage(() => import('../pages/storefront/ForgotPassword'));
const ResetPassword = lazyPage(() => import('../pages/storefront/ResetPassword'));

// Admin pages
const AdminLogin = lazyPage(() => import('../pages/admin/AdminLogin'));
const AdminDashboard = lazyPage(() => import('../pages/admin/AdminDashboard'));
const AdminProducts = lazyPage(() => import('../pages/admin/AdminProducts'));
const AdminProductForm = lazyPage(() => import('../pages/admin/AdminProductForm'));
const AdminOrders = lazyPage(() => import('../pages/admin/AdminOrders'));
const AdminOrderDetails = lazyPage(() => import('../pages/admin/AdminOrderDetails'));
const AdminSettings = lazyPage(() => import('../pages/admin/AdminSettings'));
const AdminCollections = lazyPage(() => import('../pages/admin/AdminCollections'));
const AdminCoupons = lazyPage(() => import('../pages/admin/AdminCoupons'));
const AdminReviews = lazyPage(() => import('../pages/admin/AdminReviews'));
const AdminCustomers = lazyPage(() => import('../pages/admin/AdminCustomers'));
const AdminInventory = lazyPage(() => import('../pages/admin/AdminInventory'));
const AdminInvoices = lazyPage(() => import('../pages/admin/AdminInvoices'));
const AdminUsers = lazyPage(() => import('../pages/admin/AdminUsers'));
const AdminGallery = lazyPage(() => import('../pages/admin/AdminGallery'));
const AdminArticles = lazyPage(() => import('../pages/admin/AdminArticles'));
const AdminDiscounts = lazyPage(() => import('../pages/admin/AdminDiscounts'));
const AdminTaxes = lazyPage(() => import('../pages/admin/AdminTaxes'));
const AdminReports = lazyPage(() => import('../pages/admin/AdminReports'));
const AdminShipping = lazyPage(() => import('../pages/admin/AdminShipping'));
const AdminPages = lazyPage(() => import('../pages/admin/AdminPages'));
const AdminHero = lazyPage(() => import('../pages/admin/AdminHero'));
const AdminNewsletter = lazyPage(() => import('../pages/admin/AdminNewsletter'));
const AdminExpenses = lazyPage(() => import('../pages/admin/AdminExpenses'));
const AdminPurchases = lazyPage(() => import('../pages/admin/AdminPurchases'));
import RequireEnabledModule from '../components/auth/RequireEnabledModule';
const AdminInquiries = lazyPage(() => import('../pages/admin/AdminInquiries'));
const AdminBrands = lazyPage(() => import('../pages/admin/AdminBrands'));
const AdminFittingSessions = lazyPage(() => import('../pages/admin/AdminFittingSessions'));
const AdminProfile = lazyPage(() => import('../pages/admin/AdminProfile'));
const PosSessionStart = lazyPage(() => import('../pages/admin/pos/PosSessionStart'));
const PosTerminal = lazyPage(() => import('../pages/admin/pos/PosTerminal'));
const PosSessionHistory = lazyPage(() => import('../pages/admin/pos/PosSessionHistory'));
import RequireAdminAuth from '../components/auth/RequireAdminAuth';

function RouteFallback() {
  useRouteLoading();
  return (
    <div className="min-h-[100dvh] grid place-items-center" role="status" aria-label="Loading">
      <span className="page-spinner" aria-hidden="true" />
    </div>
  );
}

// Keeps the surrounding layout mounted while a lazily loaded page chunk arrives.
function SuspenseOutlet() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  );
}

// Storefront variant: re-keys on the path so every page plays the enter transition.
function StorefrontOutlet() {
  const { pathname } = useLocation();
  const queryClient = useQueryClient();

  // Once the first page is idle, warm the chunks shoppers usually open next.
  useEffect(() => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 2000));
    const handle = idle(() => {
      import('../pages/storefront/Shop');
      import('../pages/storefront/ProductDetails');
      import('../pages/storefront/Cart');
    });
    return () => (window.cancelIdleCallback || clearTimeout)(handle);
  }, []);

  // Start fetching CMS page data in parallel with the page's JS chunk.
  useEffect(() => {
    const slug = pathname.match(/^\/pages\/([^/]+)/)?.[1];
    if (slug) queryClient.prefetchQuery(cmsPageQuery(slug));
  }, [pathname, queryClient]);

  return (
    <Suspense fallback={<RouteFallback />}>
      {/* Full-height wrapper keeps the footer below the fold while data loads (prevents CLS). */}
      <div key={pathname} className="page-enter min-h-[100dvh]">
        <Outlet />
      </div>
    </Suspense>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Customer Storefront Routes */}
      <Route path="/" element={<StorefrontLayout />}>
       <Route element={<StorefrontOutlet />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:slug" element={<ProductDetails />} />
        <Route path="products/:slug" element={<ProductDetails />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-tracking" element={<OrderTracking />} />
        <Route path="pay/:orderNumber" element={<PayOrder />} />
        <Route path="account" element={<Account />} />
        {/* The old Tips page was retired; its articles live on the blog. */}
        <Route path="pages/tips" element={<Navigate to="/blog" replace />} />
        <Route path="pages/:slug" element={<PolicyPage />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<ArticleDetails />} />
        <Route path="contact" element={<ContactUs />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
       </Route>
      </Route>

      {/* Admin Panel Login */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/login" element={<Navigate to="/admin/login" replace />} />

      {/* Admin Dashboard Protected Routes */}
      <Route path="/admin" element={<AdminLayout />}>
       <Route element={<SuspenseOutlet />}>
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
      </Route>

      {/* POS Module Full-Screen Routes (bypasses AdminLayout wrapper for speed and layout control) */}
      <Route path="/admin/pos" element={<RequireAdminAuth><PosSessionStart /></RequireAdminAuth>} />
      <Route path="/admin/pos/terminal" element={<RequireAdminAuth><PosTerminal /></RequireAdminAuth>} />
      <Route path="/admin/pos/history" element={<RequireAdminAuth><PosSessionHistory /></RequireAdminAuth>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
