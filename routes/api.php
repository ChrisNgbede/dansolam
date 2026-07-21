<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\StorefrontController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\PosController;
use App\Http\Controllers\Api\BusinessOperationsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// =========================================================================
// 1. PUBLIC STOREFRONT ENDPOINTS
// =========================================================================
Route::get('/settings', [StorefrontController::class, 'getSettings']);
Route::get('/banners', [StorefrontController::class, 'getBanners']);
Route::get('/instagram-feed', [StorefrontController::class, 'getInstagramFeed']);
Route::get('/categories', [StorefrontController::class, 'getCategories']);
Route::get('/collections', [StorefrontController::class, 'getCollections']);
Route::get('/delivery-zones', [StorefrontController::class, 'getDeliveryZones']);
Route::get('/shipping-rates', [StorefrontController::class, 'getShippingRates']);
Route::get('/products', [StorefrontController::class, 'getProducts']);
Route::get('/products/{slug}', [StorefrontController::class, 'getProductDetails']);
Route::get('/search', [StorefrontController::class, 'search']);
Route::get('/search-all', [StorefrontController::class, 'searchAll']);
Route::post('/coupon/verify', [StorefrontController::class, 'verifyCoupon']);
Route::get('/coupons/active', [StorefrontController::class, 'getActiveCoupons']);
Route::post('/checkout', [StorefrontController::class, 'checkout']);
Route::post('/payment/verify', [StorefrontController::class, 'verifyPayment']);
Route::post('/track-order', [StorefrontController::class, 'trackOrder']);
Route::post('/products/{id}/reviews', [StorefrontController::class, 'addReview']);
Route::post('/reviews', [StorefrontController::class, 'addReview']);
Route::get('/pages/{slug}', [StorefrontController::class, 'getPage']);
Route::get('/faqs', [StorefrontController::class, 'getFaqs']);
Route::post('/newsletter/subscribe', [StorefrontController::class, 'subscribeNewsletter']);
Route::post('/contact-inquiries', [StorefrontController::class, 'submitContactInquiry']);
Route::get('/gallery', [StorefrontController::class, 'getGalleryItems']);
Route::get('/blog', [StorefrontController::class, 'getArticles']);
Route::get('/blog/{slug}', [StorefrontController::class, 'getArticleDetails']);
Route::get('/brands', [StorefrontController::class, 'getBrands']);
Route::get('/reviews', [StorefrontController::class, 'getReviews']);
Route::post('/fitting-sessions', [StorefrontController::class, 'storeFittingSession']);

// =========================================================================
// 2. CUSTOMER AUTHENTICATION & PORTAL ENDPOINTS
// =========================================================================
Route::post('/customer/register', [CustomerAuthController::class, 'register']);
Route::post('/customer/login', [CustomerAuthController::class, 'login']);
Route::post('/customer/forgot-password', [CustomerAuthController::class, 'forgotPassword']);
Route::post('/customer/reset-password', [CustomerAuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/customer/logout', [CustomerAuthController::class, 'logout']);
    Route::get('/customer/profile', [CustomerAuthController::class, 'getProfile']);
    Route::put('/customer/profile', [CustomerAuthController::class, 'updateProfile']);
    Route::put('/customer/measurements', [CustomerAuthController::class, 'updateMeasurements']);
    Route::get('/customer/orders', [CustomerAuthController::class, 'getOrders']);
    
    // Addresses
    Route::get('/customer/addresses', [CustomerAuthController::class, 'getAddresses']);
    Route::post('/customer/addresses', [CustomerAuthController::class, 'addAddress']);
    Route::delete('/customer/addresses/{id}', [CustomerAuthController::class, 'deleteAddress']);
    
    // Wishlist
    Route::get('/customer/wishlist', [CustomerAuthController::class, 'getWishlist']);
    Route::post('/customer/wishlist', [CustomerAuthController::class, 'toggleWishlist']);
});


// =========================================================================
// 3. ADMIN DASHBOARD ENDPOINTS
// =========================================================================
Route::post('/admin/login', [AdminController::class, 'login']);
Route::post('/admin/forgot-password', [AdminController::class, 'forgotPassword']);
Route::post('/admin/reset-password', [AdminController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/admin/logout', [AdminController::class, 'logout']);
    Route::post('/admin/upload', [AdminController::class, 'uploadImage']);
    Route::get('/admin/metrics', [AdminController::class, 'getMetrics']);
    Route::get('/admin/profile', [AdminController::class, 'getProfile']);
    Route::put('/admin/profile', [AdminController::class, 'updateProfile']);
    Route::post('/admin/settings/test-smtp', [AdminController::class, 'testSmtpConnection']);

    
    // Products CRUD
    Route::get('/admin/products/generate-sku', [AdminController::class, 'generateSku']);
    Route::get('/admin/products', [AdminController::class, 'getProducts']);
    Route::post('/admin/products', [AdminController::class, 'createProduct']);
    Route::put('/admin/products/{id}', [AdminController::class, 'updateProduct']);
    Route::delete('/admin/products/{id}', [AdminController::class, 'deleteProduct']);
    Route::put('/admin/products/{id}/featured', [AdminController::class, 'toggleProductFeatured']);
    Route::put('/admin/products/{id}/flash-sale', [AdminController::class, 'toggleProductFlashSale']);
    Route::post('/admin/products/bulk-flash-sale', [AdminController::class, 'bulkProductFlashSale']);
    Route::get('/admin/products/{id}/history', [AdminController::class, 'getProductHistory']);
    
    // Variant overrides
    Route::put('/admin/variants/{id}/stock', [AdminController::class, 'updateVariantStock']);

    // Advanced Shipping Rates CRUD
    Route::get('/admin/shipping-rates', [AdminController::class, 'getShippingRates']);
    Route::post('/admin/shipping-rates', [AdminController::class, 'createShippingRate']);
    Route::put('/admin/shipping-rates/{id}', [AdminController::class, 'updateShippingRate']);
    Route::delete('/admin/shipping-rates/{id}', [AdminController::class, 'deleteShippingRate']);

    // Product Tags CRUD
    Route::get('/admin/product-tags', [AdminController::class, 'getProductTags']);
    Route::post('/admin/product-tags', [AdminController::class, 'createProductTag']);
    Route::put('/admin/product-tags/{id}', [AdminController::class, 'updateProductTag']);
    Route::delete('/admin/product-tags/{id}', [AdminController::class, 'deleteProductTag']);
    
    // Categories CRUD
    Route::get('/admin/categories', [AdminController::class, 'getCategories']);
    Route::post('/admin/categories', [AdminController::class, 'createCategory']);
    Route::put('/admin/categories/{id}', [AdminController::class, 'updateCategory']);
    Route::delete('/admin/categories/{id}', [AdminController::class, 'deleteCategory']);
    
    // Collections
    Route::get('/admin/collections', [AdminController::class, 'getCollections']);
    Route::post('/admin/collections', [AdminController::class, 'createCollection']);
    Route::put('/admin/collections/{id}', [AdminController::class, 'updateCollection']);
    Route::delete('/admin/collections/{id}', [AdminController::class, 'deleteCollection']);
    Route::post('/admin/collections/{id}/products', [AdminController::class, 'syncCollectionProducts']);
    Route::post('/admin/collections/{id}/categories', [AdminController::class, 'syncCollectionCategories']);
    
    // Pages CRUD
    Route::get('/admin/pages', [AdminController::class, 'getPages']);
    Route::post('/admin/pages', [AdminController::class, 'createPage']);
    Route::put('/admin/pages/{id}', [AdminController::class, 'updatePage']);
    Route::delete('/admin/pages/{id}', [AdminController::class, 'deletePage']);

    // Homepage Hero CRUD
    Route::get('/admin/hero-banners', [AdminController::class, 'getHeroBanners']);
    Route::post('/admin/hero-banners', [AdminController::class, 'createHeroBanner']);
    Route::post('/admin/hero-banners/{id}/duplicate', [AdminController::class, 'duplicateHeroBanner']);
    Route::put('/admin/hero-banners/{id}', [AdminController::class, 'updateHeroBanner']);
    Route::delete('/admin/hero-banners/{id}', [AdminController::class, 'deleteHeroBanner']);
    
    // Contact Inquiries CRUD
    Route::get('/admin/contact-inquiries', [AdminController::class, 'getContactInquiries']);
    Route::put('/admin/contact-inquiries/{id}/read', [AdminController::class, 'toggleContactInquiryRead']);
    Route::delete('/admin/contact-inquiries/{id}', [AdminController::class, 'deleteContactInquiry']);

    // Fitting Sessions CRUD
    Route::get('/admin/fitting-sessions', [AdminController::class, 'getFittingSessions']);
    Route::put('/admin/fitting-sessions/{id}', [AdminController::class, 'updateFittingSession']);
    Route::delete('/admin/fitting-sessions/{id}', [AdminController::class, 'deleteFittingSession']);

    // Newsletter subscribers
    Route::get('/admin/newsletter-subscribers', [AdminController::class, 'getNewsletterSubscribers']);
    Route::get('/admin/newsletter-subscribers/export', [AdminController::class, 'exportNewsletterSubscribers']);
    Route::delete('/admin/newsletter-subscribers/{id}', [AdminController::class, 'deleteNewsletterSubscriber']);
    
    // FAQs CRUD
    Route::get('/admin/faqs', [AdminController::class, 'getFaqs']);
    Route::post('/admin/faqs', [AdminController::class, 'createFaq']);
    Route::put('/admin/faqs/{id}', [AdminController::class, 'updateFaq']);
    Route::delete('/admin/faqs/{id}', [AdminController::class, 'deleteFaq']);
    
    // Orders Fulfillments & CRUD
    Route::get('/admin/orders', [AdminController::class, 'getOrders']);
    Route::post('/admin/orders', [AdminController::class, 'createOrder']);
    Route::put('/admin/orders/{id}', [AdminController::class, 'updateOrder']);
    Route::delete('/admin/orders/{id}', [AdminController::class, 'deleteOrder']);
    Route::get('/admin/orders/{id}', [AdminController::class, 'getOrderDetails']);
    Route::put('/admin/orders/{id}/status', [AdminController::class, 'updateOrderStatus']);
    Route::get('/admin/orders/{id}/invoice', [AdminController::class, 'exportInvoicePdf']);
    Route::post('/admin/orders/{id}/send-invoice', [AdminController::class, 'sendInvoiceEmail']);
    Route::post('/admin/invoices/export', [AdminController::class, 'exportManualInvoicePdf']);
    Route::post('/admin/invoices/send', [AdminController::class, 'sendManualInvoiceEmail']);
    
    // Ecommerce Settings Panel
    Route::get('/admin/settings', [AdminController::class, 'getSettings']);
    Route::put('/admin/settings', [AdminController::class, 'updateSettings']);
    Route::get('/admin/notifications', [AdminController::class, 'getNotifications']);
    Route::get('/admin/search', [AdminController::class, 'globalSearch']);

    // Admin Roles Management
    Route::get('/admin/roles', [AdminController::class, 'getRoles']);
    Route::post('/admin/roles', [AdminController::class, 'createRole']);
    Route::put('/admin/roles/{id}', [AdminController::class, 'updateRole']);
    Route::delete('/admin/roles/{id}', [AdminController::class, 'deleteRole']);

    // Admin Users Management
    Route::get('/admin/users', [AdminController::class, 'getUsers']);
    Route::post('/admin/users', [AdminController::class, 'createUser']);
    Route::put('/admin/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);
    
    // Inventory Logs & Audit
    Route::get('/admin/inventory-logs', [AdminController::class, 'getInventoryLogs']);

    Route::prefix('admin/expenses')->middleware('module.enabled:module_expenses_enabled')->group(function () {
        Route::get('/', [BusinessOperationsController::class, 'expenses']);
        Route::post('/', [BusinessOperationsController::class, 'storeExpense']);
        Route::post('/batch', [BusinessOperationsController::class, 'storeExpenseBatch']);
        Route::post('/bulk-action', [BusinessOperationsController::class, 'bulkExpenseAction']);
        Route::put('/{expense}', [BusinessOperationsController::class, 'updateExpense']);
        Route::delete('/{expense}', [BusinessOperationsController::class, 'deleteExpense']);
    });

    Route::middleware('module.enabled:module_purchases_enabled')->group(function () {
        Route::get('/admin/purchase-catalog', [BusinessOperationsController::class, 'catalog']);
        Route::get('/admin/suppliers', [BusinessOperationsController::class, 'suppliers']);
        Route::post('/admin/suppliers', [BusinessOperationsController::class, 'storeSupplier']);
        Route::get('/admin/purchases', [BusinessOperationsController::class, 'purchases']);
        Route::post('/admin/purchases', [BusinessOperationsController::class, 'storePurchase']);
        Route::post('/admin/purchases/bulk-action', [BusinessOperationsController::class, 'bulkPurchaseAction']);
        Route::put('/admin/purchases/{purchase}/status', [BusinessOperationsController::class, 'updatePurchaseStatus']);
        Route::post('/admin/purchases/{purchase}/receive', [BusinessOperationsController::class, 'receivePurchase']);
        Route::delete('/admin/purchases/{purchase}', [BusinessOperationsController::class, 'deletePurchase']);
    });
    
    // Coupon codes management
    Route::get('/admin/coupons', [AdminController::class, 'getCoupons']);
    Route::post('/admin/coupons', [AdminController::class, 'createCoupon']);
    Route::put('/admin/coupons/{id}', [AdminController::class, 'updateCoupon']);
    Route::delete('/admin/coupons/{id}', [AdminController::class, 'deleteCoupon']);

    // Customers management
    Route::get('/admin/customers', [AdminController::class, 'getCustomers']);
    Route::post('/admin/customers', [AdminController::class, 'createCustomer']);
    Route::put('/admin/customers/{id}', [AdminController::class, 'updateCustomer']);
    Route::delete('/admin/customers/{id}', [AdminController::class, 'deleteCustomer']);
    Route::get('/admin/customers/{id}/orders', [AdminController::class, 'getCustomerOrders']);

    // Reviews moderation
    Route::get('/admin/reviews', [AdminController::class, 'getReviews']);
    Route::post('/admin/reviews', [AdminController::class, 'createReview']);
    Route::put('/admin/reviews/{id}', [AdminController::class, 'updateReview']);
    Route::put('/admin/reviews/{id}/approve', [AdminController::class, 'approveReview']);
    Route::delete('/admin/reviews/{id}', [AdminController::class, 'deleteReview']);

    // Articles CRUD
    Route::get('/admin/articles', [AdminController::class, 'getArticles']);
    Route::post('/admin/articles', [AdminController::class, 'createArticle']);
    Route::put('/admin/articles/{id}', [AdminController::class, 'updateArticle']);
    Route::delete('/admin/articles/{id}', [AdminController::class, 'deleteArticle']);

    // Blog Categories CRUD
    Route::get('/admin/blog-categories', [AdminController::class, 'getBlogCategories']);
    Route::post('/admin/blog-categories', [AdminController::class, 'createBlogCategory']);
    Route::put('/admin/blog-categories/{id}', [AdminController::class, 'updateBlogCategory']);
    Route::delete('/admin/blog-categories/{id}', [AdminController::class, 'deleteBlogCategory']);

    // Blog Tags CRUD
    Route::get('/admin/blog-tags', [AdminController::class, 'getBlogTags']);
    Route::post('/admin/blog-tags', [AdminController::class, 'createBlogTag']);
    Route::put('/admin/blog-tags/{id}', [AdminController::class, 'updateBlogTag']);
    Route::delete('/admin/blog-tags/{id}', [AdminController::class, 'deleteBlogTag']);

    // Blog Comments Moderation
    Route::get('/admin/blog-comments', [AdminController::class, 'getBlogComments']);
    Route::put('/admin/blog-comments/{id}/approve', [AdminController::class, 'approveBlogComment']);
    Route::delete('/admin/blog-comments/{id}', [AdminController::class, 'deleteBlogComment']);

    // Gallery CRUD
    Route::get('/admin/gallery', [AdminController::class, 'getGalleryItems']);
    Route::post('/admin/gallery', [AdminController::class, 'createGalleryItem']);
    Route::put('/admin/gallery/{id}', [AdminController::class, 'updateGalleryItem']);
    Route::delete('/admin/gallery/{id}', [AdminController::class, 'deleteGalleryItem']);
    Route::post('/admin/gallery/bulk-upload', [AdminController::class, 'bulkUploadGallery']);

    // Discounts CRUD
    Route::get('/admin/discounts', [AdminController::class, 'getDiscounts']);
    Route::post('/admin/discounts', [AdminController::class, 'createDiscount']);
    Route::put('/admin/discounts/{id}', [AdminController::class, 'updateDiscount']);
    Route::delete('/admin/discounts/{id}', [AdminController::class, 'deleteDiscount']);

    // Taxes CRUD
    Route::get('/admin/taxes', [AdminController::class, 'getTaxes']);
    Route::post('/admin/taxes', [AdminController::class, 'createTax']);
    Route::put('/admin/taxes/{id}', [AdminController::class, 'updateTax']);
    Route::delete('/admin/taxes/{id}', [AdminController::class, 'deleteTax']);

    // Brands CRUD
    Route::get('/admin/brands', [AdminController::class, 'getBrands']);
    Route::post('/admin/brands', [AdminController::class, 'createBrand']);
    Route::put('/admin/brands/{id}', [AdminController::class, 'updateBrand']);
    Route::delete('/admin/brands/{id}', [AdminController::class, 'deleteBrand']);

    Route::post('/admin/demo-data/seed', [AdminController::class, 'seedDemoData']);
    Route::post('/admin/demo-data/reset', [AdminController::class, 'resetDemoData']);

    // Reports
    Route::get('/admin/reports', [AdminController::class, 'getReportsData']);
    Route::get('/admin/reports/csv', [AdminController::class, 'exportReportCsv']);
    Route::get('/admin/reports/pdf', [AdminController::class, 'exportReportPdf']);

    // POS Module Routes (protected by sanctum and gated by pos.enabled middleware)
    Route::prefix('pos')->middleware('pos.enabled')->group(function () {
        Route::get('/configuration', [PosController::class, 'getConfiguration']);
        // Sessions
        Route::post('/sessions/open', [PosController::class, 'openSession']);
        Route::get('/sessions/current', [PosController::class, 'getCurrentSession']);
        Route::post('/sessions/close', [PosController::class, 'closeSession']);
        Route::get('/sessions/history', [PosController::class, 'getSessionHistory']);
        
        // Products & Customers
        Route::get('/products', [PosController::class, 'searchProducts']);
        Route::get('/customers/search', [PosController::class, 'searchCustomers']);
        Route::post('/customers/quick-add', [PosController::class, 'quickAddCustomer']);
        
        // Transactions
        Route::post('/transactions', [PosController::class, 'createTransaction']);
        Route::get('/transactions', [PosController::class, 'getTransactions']);
        Route::get('/transactions/{id}', [PosController::class, 'getTransactionDetails']);
        
        // Held Carts
        Route::post('/held-carts', [PosController::class, 'holdCart']);
        Route::get('/held-carts', [PosController::class, 'getHeldCarts']);
        Route::post('/held-carts/{id}/resume', [PosController::class, 'resumeHeldCart']);
        Route::delete('/held-carts/{id}', [PosController::class, 'deleteHeldCart']);
        
        // Cash Movements
        Route::post('/cash-movements', [PosController::class, 'addCashMovement']);
        Route::get('/cash-movements', [PosController::class, 'getCashMovements']);
        
        // Reports
        Route::get('/daily-summary', [PosController::class, 'getDailySummary']);
    });
});
