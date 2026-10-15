import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Check, Settings, Mail, FileText, Lock, Volume2, Truck, CreditCard, Database, AlertTriangle, RefreshCw, Sprout, Layers, Send, ShieldCheck, Wrench } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import ImageUploadField from '../../components/ui/ImageUploadField';
import RichTextEditor from '../../components/ui/RichTextEditor';
import { COUNTRIES } from '../../utils/geoData';
import SettingsSearchTypeahead from '../../components/admin/SettingsSearchTypeahead';
import { PaystackLogo, StripeLogo, PayPalLogo } from '../../components/storefront/PaymentGatewayLogos';
import SearchableSelect from '../../components/ui/SearchableSelect';

const CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira (₦)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi (GH₵)' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand (R)' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham (د.إ)' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling (KSh)' }
];

export default function AdminSettings() {
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Active form section tab
  const [activeSettingsTab, setActiveSettingsTab] = useState(() => {
    return tabParam || 'brand';
  });

  // Sync state from query param
  useEffect(() => {
    if (tabParam && tabParam !== activeSettingsTab) {
      setActiveSettingsTab(tabParam);
    }
  }, [tabParam]);

  // Sync query param from state
  useEffect(() => {
    if (activeSettingsTab) {
      setSearchParams({ tab: activeSettingsTab }, { replace: true });
    }
  }, [activeSettingsTab]);

  // Demo data management states
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [seedLoading, setSeedLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [demoError, setDemoError] = useState('');

  // Test email state
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);

  // Settings states - Store identity
  const [ecommerceName, setEcommerceName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [themeColor, setThemeColor] = useState('#C5A880');
  const [storefrontThemeMode, setStorefrontThemeMode] = useState('user_choice'); // 'b_night' | 'light' | 'user_choice'
  const [storefrontDefaultTheme, setStorefrontDefaultTheme] = useState('dark'); // 'dark' | 'light'
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [instagramAccessToken, setInstagramAccessToken] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [openingHoursNote, setOpeningHoursNote] = useState('');

  // Settings states - Meet the CEO
  const [ceoName, setCeoName] = useState('');
  const [ceoBio, setCeoBio] = useState('');
  const [ceoImageUrl, setCeoImageUrl] = useState('');

  // Settings states - Auth Pages Configuration
  const [authTitle, setAuthTitle] = useState('');
  const [authSubtitle, setAuthSubtitle] = useState('');
  const [authImageUrl, setAuthImageUrl] = useState('');

  // Settings states - Bank details
  const [bankName, setBankName] = useState('');
  const [bankAccountNum, setBankAccountNum] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');

  // Settings states - SMTP config
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpEncryption, setSmtpEncryption] = useState('tls');
  const [smtpFromAddress, setSmtpFromAddress] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('');

  // Settings states - Templates config
  const [emailOrderPlacedSubject, setEmailOrderPlacedSubject] = useState('');
  const [emailOrderPlacedBody, setEmailOrderPlacedBody] = useState('');
  const [emailOrderShippedSubject, setEmailOrderShippedSubject] = useState('');
  const [emailOrderShippedBody, setEmailOrderShippedBody] = useState('');
  const [emailInvoiceSubject, setEmailInvoiceSubject] = useState('');
  const [emailInvoiceBody, setEmailInvoiceBody] = useState('');

  // Settings states - Promotions & Popups
  const [announcementShow, setAnnouncementShow] = useState(true);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementBgColor, setAnnouncementBgColor] = useState('#181120');
  const [announcementTextColor, setAnnouncementTextColor] = useState('#FFFFFF');
  const [announcementAccentColor, setAnnouncementAccentColor] = useState('#EC268F');
  const [announcementAutoplaySpeed, setAnnouncementAutoplaySpeed] = useState('4500');
  const [announcementIncludeCoupons, setAnnouncementIncludeCoupons] = useState(true);
  const [announcementLinkUrl, setAnnouncementLinkUrl] = useState('');
  const [announcementAnimationMode, setAnnouncementAnimationMode] = useState('fade_slide');
  const [promoPopupShow, setPromoPopupShow] = useState(false);
  const [promoPopupTitle, setPromoPopupTitle] = useState('');
  const [promoPopupBody, setPromoPopupBody] = useState('');
  const [promoPopupImage, setPromoPopupImage] = useState('');
  const [promoPopupDelay, setPromoPopupDelay] = useState('3000');

  // Settings states - Shipping configs
  const [allowOverselling, setAllowOverselling] = useState(false);

  // Settings states - Payment Gateways
  const [paymentGatewayActive, setPaymentGatewayActive] = useState('paystack');
  const [paystackEnabled, setPaystackEnabled] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [paypalEnabled, setPaypalEnabled] = useState(true);
  const [bankTransferEnabled, setBankTransferEnabled] = useState(true);
  const [paypalMode, setPaypalMode] = useState('sandbox');
  const [stripeKeyPublic, setStripeKeyPublic] = useState('');
  const [stripeKeySecret, setStripeKeySecret] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalClientSecret, setPaypalClientSecret] = useState('');
  const [paypalIntent, setPaypalIntent] = useState('CAPTURE');
  const [paypalCurrency, setPaypalCurrency] = useState('USD');
  const [paypalExchangeRate, setPaypalExchangeRate] = useState('1');
  const [paypalWebhookId, setPaypalWebhookId] = useState('');
  const [paystackKeyPublic, setPaystackKeyPublic] = useState('');
  const [paystackKeySecret, setPaystackKeySecret] = useState('');
  const [flutterwaveKeyPublic, setFlutterwaveKeyPublic] = useState('');
  const [flutterwaveKeySecret, setFlutterwaveKeySecret] = useState('');
  const [showGalleryPage, setShowGalleryPage] = useState(true);
  const [showSizeGuideOnProduct, setShowSizeGuideOnProduct] = useState(true);
  const [showBlogPage, setShowBlogPage] = useState(true);
  const [codEnabled, setCodEnabled] = useState(false);
  const [soldCountEnabled, setSoldCountEnabled] = useState(true);
  const [modulePosEnabled, setModulePosEnabled] = useState(false);
  const [moduleExpensesEnabled, setModuleExpensesEnabled] = useState(false);
  const [modulePurchasesEnabled, setModulePurchasesEnabled] = useState(false);
  const [paymentCashChannel, setPaymentCashChannel] = useState('both');
  const [paymentCardChannel, setPaymentCardChannel] = useState('both');
  const [paymentTransferChannel, setPaymentTransferChannel] = useState('both');
  const [posReceiptFormat, setPosReceiptFormat] = useState('thermal');
  const [posReceiptFooter, setPosReceiptFooter] = useState('THANK YOU FOR YOUR PATRONAGE!\nAll items checked out in-store are non-refundable after tags are removed.');
  const [posOfflineEnabled, setPosOfflineEnabled] = useState(true);
  const [posAutoSyncEnabled, setPosAutoSyncEnabled] = useState(true);
  const [posSyncInterval, setPosSyncInterval] = useState('30');

  // Security & CAPTCHA Protection settings
  const [captchaEnabled, setCaptchaEnabled] = useState(false);
  const [captchaProvider, setCaptchaProvider] = useState('visual_code');
  const [captchaOnContact, setCaptchaOnContact] = useState(true);
  const [captchaOnNewsletter, setCaptchaOnNewsletter] = useState(true);
  const [captchaOnReviews, setCaptchaOnReviews] = useState(true);
  const [captchaOnCheckout, setCaptchaOnCheckout] = useState(true);
  const [captchaSiteKey, setCaptchaSiteKey] = useState('');
  const [captchaSecretKey, setCaptchaSecretKey] = useState('');
  const [captchaMaxAttempts, setCaptchaMaxAttempts] = useState('3');

  // Maintenance Mode settings
  const [maintenanceModeEnabled, setMaintenanceModeEnabled] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState("We'll Be Back Soon!");
  const [maintenanceMessage, setMaintenanceMessage] = useState("Our ecommerce is currently undergoing scheduled maintenance to upgrade your shopping experience. Stay tuned for stunning new designer drops!");
  const [maintenanceEndTime, setMaintenanceEndTime] = useState('');
  const [maintenanceShowNewsletter, setMaintenanceShowNewsletter] = useState(true);
  const [maintenanceShowContact, setMaintenanceShowContact] = useState(true);
  const [maintenanceBypassKey, setMaintenanceBypassKey] = useState('admin123');

  // SKU, Currency, Timezone & Domicile settings
  const [skuPrefix, setSkuPrefix] = useState('FQ-');
  const [skuSuffix, setSkuSuffix] = useState('');
  const [systemCurrencyCode, setSystemCurrencyCode] = useState('GBP');
  const [systemCurrencySymbol, setSystemCurrencySymbol] = useState(getCurrencySymbol());
  const [systemTimezone, setSystemTimezone] = useState('Europe/London');
  const [systemDomesticCountry, setSystemDomesticCountry] = useState('United Kingdom');
  const [enableFittingSessions, setEnableFittingSessions] = useState(true);

  // Submit states
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch settings
  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ['admin-settings-panel'],
    queryFn: () => apiFetch('/api/admin/settings').then(res => res.json())
  });

  // Load into states on query load
  useEffect(() => {
    if (settingsRes?.data) {
      const data = settingsRes.data;
      setEcommerceName(data.ecommerce?.name || '');
      
      const s = data.settings || {};
      setLogoUrl(s.logo_url || '');
      setFaviconUrl(s.favicon_url || '');
      setThemeColor(s.theme_primary_color || '#C5A880');
      setStorefrontThemeMode(s.storefront_theme_mode || 'user_choice');
      setStorefrontDefaultTheme(s.storefront_default_theme || 'dark');
      setTagline(s.tagline || '');
      setDescription(s.description || '');
      setInstagramUrl(s.instagram_url || '');
      setInstagramHandle(s.instagram_handle || '');
      setInstagramAccessToken(s.instagram_access_token || '');
      setFacebookUrl(s.facebook_url || '');
      setTiktokUrl(s.tiktok_url || '');
      setYoutubeUrl(s.youtube_url || '');
      setTwitterUrl(s.twitter_url || '');
      setWhatsappNumber(s.whatsapp_number || '');
      setStoreAddress(s.store_address || '');
      setOpeningHours(s.opening_hours || '');
      setSupportEmail(s.support_email || s.contact_email || '');
      setOpeningHoursNote(s.opening_hours_note || '');

      setCeoName(s.ceo_name || '');
      setCeoBio(s.ceo_bio || '');
      setCeoImageUrl(s.ceo_image_url || '');
      
      setAuthTitle(s.auth_title || '');
      setAuthSubtitle(s.auth_subtitle || '');
      setAuthImageUrl(s.auth_image_url || '');
      
      setBankName(s.bank_name || '');
      setBankAccountNum(s.bank_account_number || '');
      setBankAccountName(s.bank_account_name || '');

      // Load SMTP configs
      setSmtpHost(s.smtp_host || '');
      setSmtpPort(s.smtp_port || '587');
      setSmtpUsername(s.smtp_username || '');
      setSmtpPassword(s.smtp_password || '');
      setSmtpEncryption(s.smtp_encryption || 'tls');
      setSmtpFromAddress(s.smtp_from_address || '');
      setSmtpFromName(s.smtp_from_name || '');

      // Load templates
      setEmailOrderPlacedSubject(s.email_order_placed_subject || '');
      setEmailOrderPlacedBody(s.email_order_placed_body || '');
      setEmailOrderShippedSubject(s.email_order_shipped_subject || '');
      setEmailOrderShippedBody(s.email_order_shipped_body || '');
      setEmailInvoiceSubject(s.email_invoice_subject || '');
      setEmailInvoiceBody(s.email_invoice_body || '');

      // Load Promotions & Popups
      setAnnouncementShow(s.announcement_show === 'true' || s.announcement_show === true || s.announcement_show === '1' || s.announcement_show === 1);
      setAnnouncementText(s.announcement_text || '');
      setAnnouncementBgColor(s.announcement_bg_color || '#181120');
      setAnnouncementTextColor(s.announcement_text_color || '#FFFFFF');
      setAnnouncementAccentColor(s.announcement_accent_color || '#EC268F');
      setAnnouncementAutoplaySpeed(s.announcement_autoplay_speed || '4500');
      setAnnouncementIncludeCoupons(s.announcement_include_coupons === undefined || ['true', '1', true, 1].includes(s.announcement_include_coupons));
      setAnnouncementLinkUrl(s.announcement_link_url || '');
      setAnnouncementAnimationMode(s.announcement_animation_mode || 'fade_slide');
      setPromoPopupShow(s.promo_popup_show === 'true' || s.promo_popup_show === true || s.promo_popup_show === '1' || s.promo_popup_show === 1);
      setPromoPopupTitle(s.promo_popup_title || '');
      setPromoPopupBody(s.promo_popup_body || '');
      setPromoPopupImage(s.promo_popup_image || '');
      setPromoPopupDelay(s.promo_popup_delay || '3000');

      // Load Shipping configs
      setAllowOverselling(s.allow_overselling === 'true' || s.allow_overselling === true || s.allow_overselling === '1' || s.allow_overselling === 1);

      // Load Payment Gateways
      setPaymentGatewayActive(s.payment_gateway_active || 'paystack');
      setPaystackEnabled(s.paystack_enabled === undefined || ['true', '1', true, 1].includes(s.paystack_enabled));
      setStripeEnabled(s.stripe_enabled === undefined || ['true', '1', true, 1].includes(s.stripe_enabled));
      setPaypalEnabled(s.paypal_enabled === undefined || ['true', '1', true, 1].includes(s.paypal_enabled));
      setBankTransferEnabled(s.bank_transfer_enabled === undefined || ['true', '1', true, 1].includes(s.bank_transfer_enabled));
      setPaypalMode(s.paypal_mode || 'sandbox');
      setStripeKeyPublic(s.stripe_key_public || '');
      setStripeKeySecret(s.stripe_key_secret || '');
      setStripeWebhookSecret(s.stripe_webhook_secret || '');
      setPaypalClientId(s.paypal_client_id || '');
      setPaypalClientSecret(s.paypal_client_secret || '');
      setPaypalIntent(s.paypal_intent || 'CAPTURE');
      setPaypalCurrency(s.paypal_currency || 'USD');
      setPaypalExchangeRate(s.paypal_exchange_rate || '1');
      setPaypalWebhookId(s.paypal_webhook_id || '');
      setPaystackKeyPublic(s.paystack_key_public || '');
      setPaystackKeySecret(s.paystack_key_secret || '');
      setFlutterwaveKeyPublic(s.flutterwave_key_public || '');
      setFlutterwaveKeySecret(s.flutterwave_key_secret || '');
      setCodEnabled(s.cod_enabled === 'true' || s.cod_enabled === true || s.cod_enabled === '1' || s.cod_enabled === 1);
      setShowGalleryPage(s.show_gallery_page === 'true' || s.show_gallery_page === true || s.show_gallery_page === '1' || s.show_gallery_page === 1 || s.show_gallery_page === undefined);
      setShowBlogPage(s.show_blog_page === 'true' || s.show_blog_page === true || s.show_blog_page === '1' || s.show_blog_page === 1 || s.show_blog_page === undefined);
      setSoldCountEnabled(s.sold_count_enabled === 'true' || s.sold_count_enabled === true || s.sold_count_enabled === '1' || s.sold_count_enabled === 1 || s.sold_count_enabled === undefined);
      setShowSizeGuideOnProduct(s.show_size_guide_on_product === 'true' || s.show_size_guide_on_product === true || s.show_size_guide_on_product === '1' || s.show_size_guide_on_product === 1 || s.show_size_guide_on_product === undefined);
      setEnableFittingSessions(s.enable_fitting_sessions === undefined || ['true', '1', true, 1].includes(s.enable_fitting_sessions));
      setModulePosEnabled(s.module_pos_enabled === 'true' || s.module_pos_enabled === true || s.module_pos_enabled === '1' || s.module_pos_enabled === 1);
      setModuleExpensesEnabled(['true', '1', true, 1].includes(s.module_expenses_enabled));
      setModulePurchasesEnabled(['true', '1', true, 1].includes(s.module_purchases_enabled));
      setPaymentCashChannel(s.payment_cash_channel || 'both');
      setPaymentCardChannel(s.payment_card_channel || 'both');
      setPaymentTransferChannel(s.payment_transfer_channel || 'both');
      setPosReceiptFormat(s.pos_receipt_format === 'a4' ? 'a4' : 'thermal');
      setPosReceiptFooter(s.pos_receipt_footer !== undefined ? s.pos_receipt_footer : 'THANK YOU FOR YOUR PATRONAGE!\nAll items checked out in-store are non-refundable after tags are removed.');
      setPosOfflineEnabled(s.pos_offline_enabled === undefined || ['true', '1', true, 1].includes(s.pos_offline_enabled));
      setPosAutoSyncEnabled(s.pos_auto_sync_enabled === undefined || ['true', '1', true, 1].includes(s.pos_auto_sync_enabled));
      setPosSyncInterval(s.pos_sync_interval || '30');

      // Load CAPTCHA settings
      setCaptchaEnabled(s.captcha_enabled === 'true' || s.captcha_enabled === true || s.captcha_enabled === '1' || s.captcha_enabled === 1);
      setCaptchaProvider(s.captcha_provider || 'visual_code');
      setCaptchaOnContact(s.captcha_on_contact === undefined || ['true', '1', true, 1].includes(s.captcha_on_contact));
      setCaptchaOnNewsletter(s.captcha_on_newsletter === undefined || ['true', '1', true, 1].includes(s.captcha_on_newsletter));
      setCaptchaOnReviews(s.captcha_on_reviews === undefined || ['true', '1', true, 1].includes(s.captcha_on_reviews));
      setCaptchaOnCheckout(s.captcha_on_checkout === undefined || ['true', '1', true, 1].includes(s.captcha_on_checkout));
      setCaptchaSiteKey(s.captcha_site_key || '');
      setCaptchaSecretKey(s.captcha_secret_key || '');
      setCaptchaMaxAttempts(s.captcha_max_attempts || '3');

      // Load Maintenance Mode settings
      setMaintenanceModeEnabled(['true', '1', true, 1].includes(s.maintenance_mode_enabled));
      setMaintenanceTitle(s.maintenance_title || "We'll Be Back Soon!");
      setMaintenanceMessage(s.maintenance_message || "Our ecommerce is currently undergoing scheduled maintenance to upgrade your shopping experience. Stay tuned for stunning new designer drops!");
      setMaintenanceEndTime(s.maintenance_end_time || '');
      setMaintenanceShowNewsletter(s.maintenance_show_newsletter === undefined || ['true', '1', true, 1].includes(s.maintenance_show_newsletter));
      setMaintenanceShowContact(s.maintenance_show_contact === undefined || ['true', '1', true, 1].includes(s.maintenance_show_contact));
      setMaintenanceBypassKey(s.maintenance_bypass_key || 'admin123');

      // Load SKU, Currency, Timezone & Domicile
      setSkuPrefix(s.sku_prefix || 'FQ-');
      setSkuSuffix(s.sku_suffix || '');
      setSystemCurrencyCode(s.system_currency_code || 'GBP');
      setSystemCurrencySymbol(s.system_currency_symbol || getCurrencySymbol());
      setSystemTimezone(s.system_timezone || 'Europe/London');
      setSystemDomesticCountry(s.system_domestic_country || 'United Kingdom');
    }
  }, [settingsRes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);

    const payload = {
      logo_url: logoUrl,
      favicon_url: faviconUrl,
      theme_primary_color: themeColor,
      storefront_theme_mode: storefrontThemeMode,
      storefront_default_theme: storefrontDefaultTheme,
      tagline: tagline,
      description: description,
      instagram_url: instagramUrl,
      instagram_handle: instagramHandle,
      instagram_access_token: instagramAccessToken,
      facebook_url: facebookUrl,
      tiktok_url: tiktokUrl,
      youtube_url: youtubeUrl,
      twitter_url: twitterUrl,
      whatsapp_number: whatsappNumber,
      store_address: storeAddress,
      opening_hours: openingHours,
      support_email: supportEmail,
      opening_hours_note: openingHoursNote,
      ceo_name: ceoName,
      ceo_bio: ceoBio,
      ceo_image_url: ceoImageUrl,
      auth_title: authTitle,
      auth_subtitle: authSubtitle,
      auth_image_url: authImageUrl,
      bank_name: bankName,
      bank_account_number: bankAccountNum,
      bank_account_name: bankAccountName,

      // SMTP configs payload
      smtp_host: smtpHost,
      smtp_port: smtpPort,
      smtp_username: smtpUsername,
      smtp_password: smtpPassword,
      smtp_encryption: smtpEncryption,
      smtp_from_address: smtpFromAddress,
      smtp_from_name: smtpFromName,

      // Templates payload
      email_order_placed_subject: emailOrderPlacedSubject,
      email_order_placed_body: emailOrderPlacedBody,
      email_order_shipped_subject: emailOrderShippedSubject,
      email_order_shipped_body: emailOrderShippedBody,
      email_invoice_subject: emailInvoiceSubject,
      email_invoice_body: emailInvoiceBody,

      // Promotions & Popups payload
      announcement_show: announcementShow ? 'true' : 'false',
      announcement_text: announcementText,
      announcement_bg_color: announcementBgColor,
      announcement_text_color: announcementTextColor,
      announcement_accent_color: announcementAccentColor,
      announcement_autoplay_speed: announcementAutoplaySpeed,
      announcement_include_coupons: announcementIncludeCoupons ? 'true' : 'false',
      announcement_link_url: announcementLinkUrl,
      announcement_animation_mode: announcementAnimationMode,
      promo_popup_show: promoPopupShow ? 'true' : 'false',
      promo_popup_title: promoPopupTitle,
      promo_popup_body: promoPopupBody,
      promo_popup_image: promoPopupImage,
      promo_popup_delay: promoPopupDelay,

      // Shipping configs payload
      allow_overselling: allowOverselling ? 'true' : 'false',
      enable_fitting_sessions: enableFittingSessions ? 'true' : 'false',

      // Payment gateways payload
      payment_gateway_active: paymentGatewayActive,
      paystack_enabled: paystackEnabled ? 'true' : 'false',
      stripe_enabled: stripeEnabled ? 'true' : 'false',
      paypal_enabled: paypalEnabled ? 'true' : 'false',
      bank_transfer_enabled: bankTransferEnabled ? 'true' : 'false',
      paypal_mode: paypalMode,
      stripe_key_public: stripeKeyPublic,
      stripe_key_secret: stripeKeySecret,
      stripe_webhook_secret: stripeWebhookSecret,
      paypal_client_id: paypalClientId,
      paypal_client_secret: paypalClientSecret,
      paypal_intent: paypalIntent,
      paypal_currency: paypalCurrency,
      paypal_exchange_rate: paypalExchangeRate,
      paypal_webhook_id: paypalWebhookId.trim(),
      paystack_key_public: paystackKeyPublic,
      paystack_key_secret: paystackKeySecret,
      flutterwave_key_public: flutterwaveKeyPublic,
      flutterwave_key_secret: flutterwaveKeySecret,
      show_gallery_page: showGalleryPage ? 'true' : 'false',
      show_blog_page: showBlogPage ? 'true' : 'false',
      cod_enabled: codEnabled ? 'true' : 'false',
      sold_count_enabled: soldCountEnabled ? 'true' : 'false',
      show_size_guide_on_product: showSizeGuideOnProduct ? 'true' : 'false',
      module_pos_enabled: modulePosEnabled ? 'true' : 'false',
      module_expenses_enabled: moduleExpensesEnabled ? 'true' : 'false',
      module_purchases_enabled: modulePurchasesEnabled ? 'true' : 'false',
      payment_cash_channel: paymentCashChannel,
      payment_card_channel: paymentCardChannel,
      payment_transfer_channel: paymentTransferChannel,
      pos_receipt_format: posReceiptFormat,
      pos_receipt_footer: posReceiptFooter,
      pos_offline_enabled: posOfflineEnabled ? 'true' : 'false',
      pos_auto_sync_enabled: posAutoSyncEnabled ? 'true' : 'false',
      pos_sync_interval: Math.max(10, parseInt(posSyncInterval, 10) || 30).toString(),

      // CAPTCHA Security Settings payload
      captcha_enabled: captchaEnabled ? 'true' : 'false',
      captcha_provider: captchaProvider,
      captcha_on_contact: captchaOnContact ? 'true' : 'false',
      captcha_on_newsletter: captchaOnNewsletter ? 'true' : 'false',
      captcha_on_reviews: captchaOnReviews ? 'true' : 'false',
      captcha_on_checkout: captchaOnCheckout ? 'true' : 'false',
      captcha_site_key: captchaSiteKey,
      captcha_secret_key: captchaSecretKey,
      captcha_max_attempts: captchaMaxAttempts,

      // Maintenance Mode Payload
      maintenance_mode_enabled: maintenanceModeEnabled ? 'true' : 'false',
      maintenance_title: maintenanceTitle,
      maintenance_message: maintenanceMessage,
      maintenance_end_time: maintenanceEndTime,
      maintenance_show_newsletter: maintenanceShowNewsletter ? 'true' : 'false',
      maintenance_show_contact: maintenanceShowContact ? 'true' : 'false',
      maintenance_bypass_key: maintenanceBypassKey,
      sku_prefix: skuPrefix,
      sku_suffix: skuSuffix,
      system_currency_code: systemCurrencyCode,
      system_currency_symbol: systemCurrencySymbol,
      system_timezone: systemTimezone,
      system_domestic_country: systemDomesticCountry,
    };

    // The host is occasionally slow or briefly unavailable; one quiet retry covers
    // that, since saving the same values twice is harmless.
    const save = () => apiFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(payload) });
    const readJson = (res) => res.json().catch(() => null);
    const isTransient = (res) => res.status >= 500;

    try {
      let res;
      try {
        res = await save();
        if (isTransient(res)) throw new Error(`HTTP ${res.status}`);
      } catch {
        await new Promise((r) => setTimeout(r, 1500));
        res = await save();
      }
      const data = await readJson(res);
      setSaveLoading(false);

      if (res.ok && data?.success) {
        setSaveSuccess(true);
        systemToast.success(data.message || 'Settings saved successfully.');
        queryClient.invalidateQueries(['admin-settings-panel', 'settings']);

        // Auto fade success message
        setTimeout(() => setSaveSuccess(false), 4000);
      } else if (res.status === 401) {
        systemToast.error('Your session has expired. Please sign in again to save settings.');
      } else if (res.status === 403) {
        systemToast.error(data?.message || 'Your account is not allowed to change these settings.');
      } else if (res.status === 422 && data?.errors) {
        systemToast.error(Object.values(data.errors).flat()[0] || data.message);
      } else if (data?.message) {
        systemToast.error(data.message);
      } else {
        systemToast.error(`The server could not save your settings right now (HTTP ${res.status}). Nothing was changed. Please try again in a moment.`);
      }
    } catch {
      setSaveLoading(false);
      systemToast.error('Could not reach the server to save your settings. Check your internet connection and try again.');
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient) {
      systemToast.error('Please specify a recipient email address');
      return;
    }
    if (!smtpHost || !smtpPort || !smtpFromAddress || !smtpFromName) {
      systemToast.error('Please fill in SMTP Host, Port, From Address, and From Name');
      return;
    }

    setTestEmailLoading(true);
    try {
      const res = await apiFetch('/api/admin/settings/test-smtp', {
        method: 'POST',
        body: JSON.stringify({
          smtp_host: smtpHost,
          smtp_port: parseInt(smtpPort, 10),
          smtp_username: smtpUsername,
          smtp_password: smtpPassword,
          smtp_encryption: smtpEncryption,
          smtp_from_address: smtpFromAddress,
          smtp_from_name: smtpFromName,
          recipient_email: testEmailRecipient,
        })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        systemToast.success(data.message);
      } else if (res.status === 422 && data?.errors) {
        systemToast.error(Object.values(data.errors).flat()[0] || data.message);
      } else {
        systemToast.error(data?.message || `The server could not send the test email right now (HTTP ${res.status}). Please try again.`);
      }
    } catch (err) {
      systemToast.error('Could not reach the server to send the test email. Check your internet connection and try again.');
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleSelectSearchSetting = (item) => {
    if (!item) return;
    setActiveSettingsTab(item.tab);
    setTimeout(() => {
      const targetEl = document.getElementById(item.id);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.classList.add('ring-4', 'ring-primary', 'ring-offset-4', 'transition-all', 'duration-500');
        setTimeout(() => {
          targetEl.classList.remove('ring-4', 'ring-primary', 'ring-offset-4', 'transition-all', 'duration-500');
        }, 2500);
      }
    }, 150);
  };

  if (isLoading) {
    return <div className="animate-pulse bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl h-96 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900 dark:text-gray-100">Ecommerce Configuration & Settings</h2>
          <p className="text-xs text-gray-400 mt-1 font-semibold">Configure white-label styling, bank transfers, payment channels (Stripe, PayPal, Paystack, Flutterwave), and email dispatch settings.</p>
        </div>

        {/* Top-Right Settings Search Typeahead */}
        <SettingsSearchTypeahead onSelectSetting={handleSelectSearchSetting} />
      </div>

      {/* Tabs Menu button bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-none text-xs font-bold shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSettingsTab('brand')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSettingsTab === 'brand'
              ? 'bg-[#5D3E85] text-white shadow-sm shadow-[#5D3E85]/25 font-bold'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-[#5D3E85] dark:hover:text-purple-300 border border-gray-200 dark:border-gray-700 shadow-2xs'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Brand & Identity
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsTab('promotions')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSettingsTab === 'promotions'
              ? 'bg-[#5D3E85] text-white shadow-sm shadow-[#5D3E85]/25 font-bold'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-[#5D3E85] dark:hover:text-purple-300 border border-gray-200 dark:border-gray-700 shadow-2xs'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          Announcements & Popups
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsTab('shipping')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSettingsTab === 'shipping'
              ? 'bg-[#5D3E85] text-white shadow-sm shadow-[#5D3E85]/25 font-bold'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-[#5D3E85] dark:hover:text-purple-300 border border-gray-200 dark:border-gray-700 shadow-2xs'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          Shipping Rules
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsTab('payment')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSettingsTab === 'payment'
              ? 'bg-[#5D3E85] text-white shadow-sm shadow-[#5D3E85]/25 font-bold'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-[#5D3E85] dark:hover:text-purple-300 border border-gray-200 dark:border-gray-700 shadow-2xs'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Payment Gateways
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsTab('smtp')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSettingsTab === 'smtp'
              ? 'bg-[#5D3E85] text-white shadow-sm shadow-[#5D3E85]/25 font-bold'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-[#5D3E85] dark:hover:text-purple-300 border border-gray-200 dark:border-gray-700 shadow-2xs'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          SMTP Server
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsTab('templates')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSettingsTab === 'templates'
              ? 'bg-[#5D3E85] text-white shadow-sm shadow-[#5D3E85]/25 font-bold'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-[#5D3E85] dark:hover:text-purple-300 border border-gray-200 dark:border-gray-700 shadow-2xs'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Notification Templates
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsTab('pages')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSettingsTab === 'pages'
              ? 'bg-[#5D3E85] text-white shadow-sm shadow-[#5D3E85]/25 font-bold'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-[#5D3E85] dark:hover:text-purple-300 border border-gray-200 dark:border-gray-700 shadow-2xs'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Storefront Pages
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsTab('modules')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSettingsTab === 'modules'
              ? 'bg-[#5D3E85] text-white shadow-sm shadow-[#5D3E85]/25 font-bold'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-[#5D3E85] dark:hover:text-purple-300 border border-gray-200 dark:border-gray-700 shadow-2xs'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Modules
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsTab('security')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSettingsTab === 'security'
              ? 'bg-[#5D3E85] text-white shadow-sm shadow-[#5D3E85]/25 font-bold'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-[#5D3E85] dark:hover:text-purple-300 border border-gray-200 dark:border-gray-700 shadow-2xs'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Security & CAPTCHA
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col gap-6 font-sans text-gray-700 dark:text-gray-200">
        
        {/* ==========================================
            TAB 1: BRAND & BANK DETAILS
           ========================================== */}
        {activeSettingsTab === 'brand' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <h3 id="setting-store-identity" className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">Store Identity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-550 font-bold uppercase">Ecommerce Name (Read Only)</label>
                <input
                  type="text"
                  disabled
                  value={ecommerceName}
                  className="px-3 py-2 rounded-lg border border-gray-100 text-xs bg-gray-55 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Brand Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={e => setThemeColor(e.target.value)}
                    className="w-10 h-10 border border-gray-200 rounded-lg p-0.5 cursor-pointer bg-white"
                  />
                  <span className="text-xs font-mono font-semibold text-gray-650">{themeColor}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Storefront Theme Mode</label>
                <SearchableSelect
                  value={storefrontThemeMode}
                  onChange={e => setStorefrontThemeMode(e.target.value)}
                  className="px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 font-medium cursor-pointer"
                >
                  <option value="user_choice">User Choice (Allow Visitor Toggle)</option>
                  <option value="b_night">B Night (Enforce Dark Mode)</option>
                  <option value="light">Quiet Editorial (Enforce Light Mode)</option>
                </SearchableSelect>
                <span className="text-[10px] text-gray-400">Controls whether visitors can toggle between B Night and Light mode</span>
              </div>

              {storefrontThemeMode === 'user_choice' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Default Theme for New Visitors</label>
                  <SearchableSelect
                    value={storefrontDefaultTheme}
                    onChange={e => setStorefrontDefaultTheme(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 font-medium cursor-pointer"
                  >
                    <option value="dark">B Night (Dark Mode)</option>
                    <option value="light">Quiet Editorial (Light Mode)</option>
                  </SearchableSelect>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <ImageUploadField
                  label="Logo Image"
                  value={logoUrl}
                  onChange={url => setLogoUrl(url)}
                  aspect="square"
                  hint="Upload ecommerce logo (appears on invoices, emails & checkout)"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <ImageUploadField
                  label="Store Favicon"
                  value={faviconUrl}
                  onChange={url => setFaviconUrl(url)}
                  aspect="square"
                  hint="Upload store favicon (browser tab icon, PNG/ICO)"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Store Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                />
              </div>
            </div>

            <RichTextEditor
              label="Store Description / Intro"
              value={description}
              onChange={setDescription}
              placeholder="Store description details..."
            />

            <h3 id="setting-ceo-profile" className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2 mt-4">Meet the CEO</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">CEO Name</label>
                  <input
                    type="text"
                    value={ceoName}
                    onChange={e => setCeoName(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="e.g. Queen Fatima"
                  />
                </div>
                <RichTextEditor
                  label="CEO Biography / Quote"
                  value={ceoBio}
                  onChange={setCeoBio}
                  placeholder="Queen Fatima is a visionary designer..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <ImageUploadField
                  label="CEO Photograph"
                  value={ceoImageUrl}
                  onChange={url => setCeoImageUrl(url)}
                  aspect="portrait"
                  hint="Upload CEO portrait photograph (will display on About page)"
                />
              </div>
            </div>

            <h3 id="setting-auth-cover" className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2 mt-4">Auth Pages Cover Customization</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Auth Cover Title</label>
                  <input
                    type="text"
                    value={authTitle}
                    onChange={e => setAuthTitle(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="e.g. Find Your Perfect Style Today"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Auth Cover Subtitle</label>
                  <textarea
                    rows="3"
                    value={authSubtitle}
                    onChange={e => setAuthSubtitle(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="Join Dansolam and start exploring..."
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <ImageUploadField
                  label="Auth Cover Campaign Image"
                  value={authImageUrl}
                  onChange={url => setAuthImageUrl(url)}
                  aspect="portrait"
                  hint="Upload portrait fashion banner (displays on left side of Auth split panes)"
                />
              </div>
            </div>

            <h3 id="setting-contact-details" className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2 mt-4 flex items-center justify-between">
              <span>Beauty Center & Store Contact Details</span>
              <span className="text-[10px] text-[#5D3E85] font-semibold lowercase">Managed live across storefront Contact Us page & footer</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[10px] text-gray-555 font-bold uppercase">SHOP Physical Address</label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={e => setStoreAddress(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="e.g. 123 High Street, London, UK"
                />
                <span className="text-[9px] text-gray-400">Displayed on the Contact Us page, directions banner, storefront footer, and mobile navigation drawer.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Customer Support Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="e.g. support@dansolam.com"
                />
                <span className="text-[9px] text-gray-400">Direct recipient for customer support queries and mailto links.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">WhatsApp Business Number</label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="e.g. +234 800 000 0000 or 2348000000000"
                />
                <span className="text-[9px] text-gray-400">Formatted contact number used for one-click WhatsApp chat triggers.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Opening Hours (Operating Schedule)</label>
                <input
                  type="text"
                  value={openingHours}
                  onChange={e => setOpeningHours(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="e.g. Monday–Saturday: 9:00 AM - 6:00 PM"
                />
                <span className="text-[9px] text-gray-400">Daily business operating schedule.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Opening Hours Note / Weekend Status</label>
                <input
                  type="text"
                  value={openingHoursNote}
                  onChange={e => setOpeningHoursNote(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="e.g. Closed on Sundays"
                />
                <span className="text-[9px] text-gray-400">Highlighted status note displayed directly below operating hours.</span>
              </div>
            </div>

            <h3 id="setting-social-links" className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2 mt-4">Social Media Channels & Feeds</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Instagram URL</label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={e => setInstagramUrl(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Instagram Handle</label>
                <input type="text" value={instagramHandle} onChange={e => setInstagramHandle(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" placeholder="@dansolam_official" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Instagram Professional Access Token</label>
                <input type="password" value={instagramAccessToken} onChange={e => setInstagramAccessToken(e.target.value)} autoComplete="off" className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" placeholder="Optional — enables the live feed" />
                <span className="text-[9px] text-gray-400">Kept server-side. Requires a Meta Business or Creator account token.</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Facebook URL</label>
                <input type="url" value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">TikTok URL</label>
                <input type="url" value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">YouTube URL</label>
                <input type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">X / Twitter URL</label>
                <input type="url" value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" />
              </div>
            </div>

            <h3 id="setting-bank-details" className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2 mt-4">Offline Bank Transfer Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Account Number</label>
                <input
                  type="text"
                  value={bankAccountNum}
                  onChange={e => setBankAccountNum(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Account Name</label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={e => setBankAccountName(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                />
              </div>
            </div>

            <h3 id="setting-sku-currency" className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2 mt-4">System, Currency & SKU Options</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">SKU / Code Prefix</label>
                <input
                  type="text"
                  value={skuPrefix}
                  onChange={e => setSkuPrefix(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  placeholder="e.g. FQ-"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">SKU / Code Suffix</label>
                <input
                  type="text"
                  value={skuSuffix}
                  onChange={e => setSkuSuffix(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  placeholder="e.g. -BLK"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">System Currency *</label>
                <SearchableSelect
                  value={systemCurrencyCode}
                  onChange={e => {
                    const selected = CURRENCIES.find(c => c.code === e.target.value);
                    if (selected) {
                      setSystemCurrencyCode(selected.code);
                      setSystemCurrencySymbol(selected.symbol);
                    }
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 cursor-pointer h-[38px]"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </SearchableSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">System Default Timezone</label>
                <SearchableSelect
                  value={systemTimezone}
                  onChange={e => setSystemTimezone(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 cursor-pointer h-[38px]"
                >
                  <option value="Africa/Lagos">Africa/Lagos (West Africa Time)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                  <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
                </SearchableSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Business Domicile Country *</label>
                <SearchableSelect
                  value={systemDomesticCountry}
                  onChange={e => setSystemDomesticCountry(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 cursor-pointer h-[38px]"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.name}>{c.name}</option>
                  ))}
                </SearchableSelect>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: ANNOUNCEMENTS & POPUPS
           ========================================== */}
        {activeSettingsTab === 'promotions' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">Announcements & Popups</h3>
            <p className="text-xs text-gray-400">Configure client promotions, header notice bars, and email capture popup delays.</p>

            {/* Announcement Ribbon */}
            <div id="setting-announcement-bar" className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/80 pb-3">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={announcementShow}
                      onChange={e => setAnnouncementShow(e.target.checked)}
                      className="rounded border-gray-300 text-primary w-4.5 h-4.5"
                    />
                    Enable Storefront Top Bar Announcement Ribbon
                  </label>
                  <p className="text-[11px] text-gray-500 mt-0.5 ml-6.5">
                    Displays a top-level notice ribbon across all storefront pages with rotating messages, coupon badges, and copy buttons.
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider self-start sm:self-auto ${
                  announcementShow ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                }`}>
                  {announcementShow ? 'Active' : 'Disabled'}
                </span>
              </div>

              {/* Live Preview of the Announcement Bar */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Live Real-time Preview</span>
                <div
                  style={{
                    backgroundColor: announcementBgColor,
                    color: announcementTextColor,
                    borderColor: `${announcementAccentColor}40`
                  }}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-3 shadow-sm border overflow-hidden relative"
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: announcementAccentColor }}>📢</span>
                    <span className="truncate max-w-xs sm:max-w-md">
                      {announcementText.split('|')[0]?.trim() || '🌿 100% Organic Skincare, Whitening Soaps & Discoloration Oils'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        backgroundColor: `${announcementTextColor}25`,
                        color: announcementTextColor,
                        borderColor: `${announcementTextColor}40`
                      }}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5"
                    >
                      <span>WELCOME10</span>
                      <span
                        style={{ backgroundColor: announcementAccentColor, color: '#FFFFFF' }}
                        className="px-1.5 py-0.2 rounded text-[9px] font-sans font-black"
                      >
                        COPY
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Text Message Field with Multi-message delimiter support */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-gray-600 font-bold uppercase">
                    Announcement Messages (Separate multiple slides with <span className="font-mono text-[#5D3E85] font-black">|</span>)
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">Supports emojis & text</span>
                </div>
                <textarea
                  rows="3"
                  value={announcementText}
                  onChange={e => setAnnouncementText(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-medium"
                  placeholder="🌿 100% Organic Skincare & Discoloration Oils | 🎁 Use coupon code WELCOME10 for 10% OFF"
                  disabled={!announcementShow}
                />
                <span className="text-[10px] text-gray-400">
                  Tip: Use the pipe symbol <code className="bg-gray-200 px-1 py-0.5 rounded font-mono">|</code> to create multiple rotating announcements.
                </span>
              </div>

              {/* Colors Customization Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-200/80 pt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-600 font-bold uppercase">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={announcementBgColor}
                      onChange={e => setAnnouncementBgColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white shrink-0"
                      disabled={!announcementShow}
                    />
                    <input
                      type="text"
                      value={announcementBgColor}
                      onChange={e => setAnnouncementBgColor(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-mono uppercase flex-1"
                      placeholder="#181120"
                      disabled={!announcementShow}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-600 font-bold uppercase">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={announcementTextColor}
                      onChange={e => setAnnouncementTextColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white shrink-0"
                      disabled={!announcementShow}
                    />
                    <input
                      type="text"
                      value={announcementTextColor}
                      onChange={e => setAnnouncementTextColor(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-mono uppercase flex-1"
                      placeholder="#FFFFFF"
                      disabled={!announcementShow}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-600 font-bold uppercase">Accent & Copy Badge Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={announcementAccentColor}
                      onChange={e => setAnnouncementAccentColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white shrink-0"
                      disabled={!announcementShow}
                    />
                    <input
                      type="text"
                      value={announcementAccentColor}
                      onChange={e => setAnnouncementAccentColor(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-mono uppercase flex-1"
                      placeholder="#EC268F"
                      disabled={!announcementShow}
                    />
                  </div>
                </div>
              </div>

              {/* Behavior & Animation Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-200/80 pt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-600 font-bold uppercase">Rotation Speed (ms)</label>
                  <SearchableSelect
                    value={announcementAutoplaySpeed}
                    onChange={e => setAnnouncementAutoplaySpeed(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white cursor-pointer"
                    disabled={!announcementShow}
                  >
                    <option value="3000">3 Seconds (Fast)</option>
                    <option value="4500">4.5 Seconds (Normal)</option>
                    <option value="6000">6 Seconds (Relaxed)</option>
                    <option value="8000">8 Seconds (Slow)</option>
                    <option value="0">Disabled (Static First Slide)</option>
                  </SearchableSelect>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-600 font-bold uppercase">Transition Animation</label>
                  <SearchableSelect
                    value={announcementAnimationMode}
                    onChange={e => setAnnouncementAnimationMode(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white cursor-pointer"
                    disabled={!announcementShow}
                  >
                    <option value="fade_slide">Fade & Slide</option>
                    <option value="fade_only">Smooth Fade</option>
                    <option value="pulse">Pulse In</option>
                  </SearchableSelect>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-600 font-bold uppercase">Destination Click Link (Optional)</label>
                  <input
                    type="text"
                    value={announcementLinkUrl}
                    onChange={e => setAnnouncementLinkUrl(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                    placeholder="e.g. /shop or /blog/offers"
                    disabled={!announcementShow}
                  />
                </div>
              </div>

              {/* Automatic Active Coupons Toggle */}
              <div className="border-t border-gray-200/80 pt-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={announcementIncludeCoupons}
                    onChange={e => setAnnouncementIncludeCoupons(e.target.checked)}
                    className="rounded border-gray-300 text-primary w-4 h-4"
                    disabled={!announcementShow}
                  />
                  <span>Automatically rotate active discount coupons in the announcement bar</span>
                </label>
                <p className="text-[10px] text-gray-400 ml-6 mt-0.5">
                  When enabled, active promotion coupon codes will automatically cycle through the top announcement with instant 1-click copy buttons.
                </p>
              </div>

            </div>

            {/* Newsletter Popup */}
            <div id="setting-promo-popup" className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={promoPopupShow}
                  onChange={e => setPromoPopupShow(e.target.checked)}
                  className="rounded border-gray-300 text-primary w-4.5 h-4.5"
                />
                Enable Newsletter Signup Popup Modal
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-550 font-bold uppercase">Popup Title</label>
                  <input
                    type="text"
                    value={promoPopupTitle}
                    onChange={e => setPromoPopupTitle(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                    placeholder="e.g. Save 10% off your purchase!"
                    disabled={!promoPopupShow}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-550 font-bold uppercase">Popup Delay (milliseconds)</label>
                  <input
                    type="number"
                    value={promoPopupDelay}
                    onChange={e => setPromoPopupDelay(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                    placeholder="3000"
                    disabled={!promoPopupShow}
                  />
                </div>
              </div>

              {promoPopupShow && (
                <div className="flex flex-col gap-1.5">
                  <ImageUploadField
                    label="Popup Banner Image"
                    value={promoPopupImage}
                    onChange={url => setPromoPopupImage(url)}
                    aspect="banner"
                    hint="Upload pop-up promotional banner image"
                  />
                </div>
              )}

              <RichTextEditor
                label="Popup Description Text"
                value={promoPopupBody}
                onChange={setPromoPopupBody}
                placeholder="Enter details for the newsletter value proposition..."
              />
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: SHIPPING RULES CONFIG
           ========================================== */}
        {activeSettingsTab === 'shipping' && (
          <div id="setting-shipping-rates" className="flex flex-col gap-5 animate-fade-in">
            <h3 className="font-semibold text-xs text-gray-800 tracking-wider border-b border-gray-50 pb-2">Shipping charges</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Shipping charges are set per method (UK / International, by number of items) on the{' '}
              <a href="/admin/shipping" className="text-primary font-semibold underline">Shipping methods</a> page.
              Customers choose one of the methods that apply to their order at checkout.
            </p>

            <div className="border-t border-gray-100 pt-5 mt-2">
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                allowOverselling ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
                <input
                  type="checkbox"
                  checked={allowOverselling}
                  onChange={e => setAllowOverselling(e.target.checked)}
                  className="rounded border-gray-300 text-primary w-4.5 h-4.5 shrink-0 mt-0.5"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-800">Allow Overselling / Backorders</span>
                  <span className="text-[10px] text-gray-400 leading-normal">
                    Permit customers to order more units than are currently in stock. Inventory may become negative until it is replenished.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 4: PAYMENT GATEWAYS
           ========================================== */}
        {activeSettingsTab === 'payment' && (
          <div className="flex flex-col gap-5 animate-fade-in text-xs">
            <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">Active Payment Gateways</h3>
            <p className="text-xs text-gray-400">Configure public/secret api keys for dynamic gateways and select the active default channel.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                ['Cash / COD', paymentCashChannel, setPaymentCashChannel],
                ['Card / Online Gateway', paymentCardChannel, setPaymentCardChannel],
                ['Bank Transfer', paymentTransferChannel, setPaymentTransferChannel],
              ].map(([label, value, setter]) => (
                <label key={label} className="flex flex-col gap-1.5 p-3 rounded-xl border border-gray-200 bg-white">
                  <span className="text-[10px] font-bold uppercase text-gray-600">{label} availability</span>
                  <SearchableSelect value={value} onChange={e => setter(e.target.value)} disabled={!modulePosEnabled}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs disabled:opacity-60">
                    <option value="storefront">Storefront only</option>
                    <option value="pos">POS only</option>
                    <option value="both">Storefront and POS</option>
                  </SearchableSelect>
                  {!modulePosEnabled && <span className="text-[9px] text-gray-400">Enable POS to configure channel availability.</span>}
                </label>
              ))}
            </div>

            <div id="setting-payment-active" className="flex flex-col gap-1.5 bg-gray-50 p-4 border border-gray-150 rounded-xl">
              <label className="text-[10px] text-gray-555 font-bold uppercase">Active Default Gateway Channel</label>
              <SearchableSelect
                value={paymentGatewayActive}
                onChange={e => setPaymentGatewayActive(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 font-semibold"
              >
                <option value="bank_transfer">Bank Wire Transfer (Manual Verification)</option>
                <option value="stripe">Stripe Checkout (International Card Payments)</option>
                <option value="paypal">PayPal Payment Express (Global Checkout)</option>
                <option value="paystack">Paystack Payments (Online Card Payments)</option>
                <option value="flutterwave">Flutterwave Gateway (Multi-Currency Africa)</option>
              </SearchableSelect>
            </div>
            
            <div id="setting-cod-toggle" className="grid grid-cols-1 gap-4">
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                codEnabled ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
                <input
                  type="checkbox"
                  checked={codEnabled}
                  onChange={e => setCodEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-primary w-4.5 h-4.5 shrink-0 mt-0.5"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-800 font-sans">Enable Cash on Delivery (COD)</span>
                  <span className="text-[10px] text-gray-405 leading-normal font-sans">
                    Allow customers to place orders without immediate online payment, with payment collected in cash/transfer upon physical delivery.
                  </span>
                </div>
              </label>
              {modulePosEnabled && (
                <div className="p-4 rounded-xl border border-gray-200 bg-white">
                  <span className="block text-xs font-bold text-gray-800 mb-3">POS printout format</span>
                  <div className="grid grid-cols-2 gap-3">
                    {['thermal', 'a4'].map(format => (
                      <label key={format} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${posReceiptFormat === format ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                        <input type="radio" name="pos_receipt_format" value={format} checked={posReceiptFormat === format} onChange={() => setPosReceiptFormat(format)} />
                        <span className="text-xs font-bold">{format === 'a4' ? 'A4 invoice' : 'Thermal receipt'}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Only the selected format is used when printing POS receipts.</p>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-800">Custom Receipt Footer Message</label>
                    <textarea
                      rows="3"
                      value={posReceiptFooter}
                      onChange={e => setPosReceiptFooter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-mono"
                      placeholder="THANK YOU FOR YOUR PATRONAGE!&#10;All items checked out in-store are non-refundable after tags are removed."
                    ></textarea>
                    <p className="text-[10px] text-gray-400">Custom message, thank you note, or return policy printed at the bottom of all POS receipts. Separate lines with newlines.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Paystack Panel */}
            <div id="setting-paystack-keys" className={`bg-white border rounded-2xl p-5 flex flex-col gap-4 shadow-3xs transition-all ${paystackEnabled ? 'border-emerald-200' : 'border-gray-200 opacity-75'}`}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h4 className="font-bold text-xs text-gray-900 flex items-center gap-3">
                  <div className="h-6 px-2 bg-emerald-50 rounded border border-emerald-200 flex items-center justify-center">
                    <PaystackLogo className="h-3.5 w-auto" />
                  </div>
                  Paystack Gateway (Cards, Transfer & USSD)
                </h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[11px] font-semibold text-gray-600">{paystackEnabled ? 'Active' : 'Disabled'}</span>
                  <input
                    type="checkbox"
                    checked={paystackEnabled}
                    onChange={e => setPaystackEnabled(e.target.checked)}
                    className="w-4.5 h-4.5 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Public Key</label>
                  <input
                    type="text"
                    value={paystackKeyPublic}
                    onChange={e => setPaystackKeyPublic(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D3E85] text-xs bg-white font-mono"
                    placeholder="pk_live_... / pk_test_..."
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Secret Key</label>
                  <input
                    type="password"
                    value={paystackKeySecret}
                    onChange={e => setPaystackKeySecret(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D3E85] text-xs bg-white font-mono"
                    placeholder="sk_live_... / sk_test_..."
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400">Webhook URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono">/api/payment/verify</code></p>
            </div>

            {/* Stripe Panel */}
            <div id="setting-stripe-keys" className={`bg-white border rounded-2xl p-5 flex flex-col gap-4 shadow-3xs transition-all ${stripeEnabled ? 'border-indigo-200' : 'border-gray-200 opacity-75'}`}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h4 className="font-bold text-xs text-gray-900 flex items-center gap-3">
                  <div className="h-6 px-2 bg-indigo-50 rounded border border-indigo-200 flex items-center justify-center">
                    <StripeLogo className="h-3 w-auto" />
                  </div>
                  Stripe Gateway (Visa, Mastercard, AMEX, Apple Pay)
                </h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[11px] font-semibold text-gray-600">{stripeEnabled ? 'Active' : 'Disabled'}</span>
                  <input
                    type="checkbox"
                    checked={stripeEnabled}
                    onChange={e => setStripeEnabled(e.target.checked)}
                    className="w-4.5 h-4.5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Publishable Key</label>
                  <input
                    type="text"
                    value={stripeKeyPublic}
                    onChange={e => setStripeKeyPublic(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D3E85] text-xs bg-white font-mono"
                    placeholder="pk_live_... / pk_test_..."
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Secret Key</label>
                  <input
                    type="password"
                    value={stripeKeySecret}
                    onChange={e => setStripeKeySecret(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D3E85] text-xs bg-white font-mono"
                    placeholder="sk_live_... / sk_test_..."
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Webhook Signing Secret (Optional)</label>
                  <input
                    type="password"
                    value={stripeWebhookSecret}
                    onChange={e => setStripeWebhookSecret(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D3E85] text-xs bg-white font-mono"
                    placeholder="whsec_..."
                  />
                </div>
              </div>
            </div>

            {/* PayPal Panel */}
            <div id="setting-paypal-keys" className={`bg-white border rounded-2xl p-5 flex flex-col gap-4 shadow-3xs transition-all ${paypalEnabled ? 'border-blue-200' : 'border-gray-200 opacity-75'}`}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h4 className="font-bold text-xs text-gray-900 flex items-center gap-3">
                  <div className="h-6 px-2 bg-blue-50 rounded border border-blue-200 flex items-center justify-center">
                    <PayPalLogo className="h-3 w-auto" />
                  </div>
                  PayPal Express Gateway (Global PayPal Wallets & Cards)
                </h4>
                <div className="flex items-center gap-4">
                  <SearchableSelect
                    value={paypalMode}
                    onChange={e => setPaypalMode(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 font-semibold text-gray-700 bg-gray-50"
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="live">Live (Production)</option>
                  </SearchableSelect>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[11px] font-semibold text-gray-600">{paypalEnabled ? 'Active' : 'Disabled'}</span>
                    <input
                      type="checkbox"
                      checked={paypalEnabled}
                      onChange={e => setPaypalEnabled(e.target.checked)}
                      className="w-4.5 h-4.5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
              {paypalMode === 'sandbox' ? (
                <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                  <strong className="font-bold">Sandbox is PayPal's test system: cards are not charged and no money reaches you.</strong>{' '}
                  While PayPal is in Sandbox, card and PayPal payments are hidden from checkout on the live site.
                  To take real payments, open your PayPal Business account at developer.paypal.com, switch to <strong>Live</strong>, create an app, paste its Live Client ID and Secret below, and choose Live (Production).
                </div>
              ) : (
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Live mode charges real cards and PayPal accounts. Use the Client ID and Secret from your <strong>Live</strong> app; sandbox keys will not work here.</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Client ID</label>
                  <input
                    type="text"
                    value={paypalClientId}
                    onChange={e => setPaypalClientId(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D3E85] text-xs bg-white font-mono"
                    placeholder="Enter PayPal Client ID"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Client Secret</label>
                  <input
                    type="password"
                    value={paypalClientSecret}
                    onChange={e => setPaypalClientSecret(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D3E85] text-xs bg-white font-mono"
                    placeholder="Enter PayPal Client Secret"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Payment Intent</label>
                  <SearchableSelect
                    value={paypalIntent}
                    onChange={e => setPaypalIntent(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D3E85] text-xs bg-white font-semibold text-gray-800"
                  >
                    <option value="CAPTURE">Immediate Capture (Direct Settlement)</option>
                    <option value="AUTHORIZE">Authorize Only (Hold Funds)</option>
                  </SearchableSelect>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">PayPal Settlement Currency</label>
                  <SearchableSelect
                    value={paypalCurrency}
                    onChange={e => setPaypalCurrency(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D3E85] text-xs bg-white font-semibold text-gray-800"
                  >
                    <option value="USD">USD - US Dollar ($)</option>
                    <option value="EUR">EUR - Euro (€)</option>
                    <option value="GBP">GBP - British Pound (£)</option>
                    <option value="CAD">CAD - Canadian Dollar (C$)</option>
                    <option value="AUD">AUD - Australian Dollar (A$)</option>
                  </SearchableSelect>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    Exchange Rate (1 {systemCurrencyCode} = ? {paypalCurrency})
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={paypalExchangeRate}
                    onChange={e => setPaypalExchangeRate(e.target.value)}
                    disabled={paypalCurrency === systemCurrencyCode}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D3E85] text-xs bg-white font-bold text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                    placeholder="1.0"
                  />
                  {paypalCurrency === systemCurrencyCode ? (
                    <span className="text-[10px] text-gray-400">
                      Not needed — PayPal charges in {systemCurrencyCode}, the same currency your prices are in.
                    </span>
                  ) : parseFloat(paypalExchangeRate || 1) === 1 ? (
                    <span className="text-[10px] font-bold text-red-600 leading-relaxed">
                      A rate of 1 would charge a {systemCurrencyCode} price as the same number of {paypalCurrency}.
                      PayPal payments are blocked until you set a real rate, or set the settlement currency to {systemCurrencyCode}.
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">
                      A {systemCurrencyCode}100 order will be charged as {paypalCurrency}{(100 * parseFloat(paypalExchangeRate || 1)).toFixed(2)}.
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Webhook ID (recommended)</label>
                <input
                  type="text"
                  value={paypalWebhookId}
                  onChange={e => setPaypalWebhookId(e.target.value)}
                  placeholder="e.g. 8PT597110X687430LKGECATA"
                  className="px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5D3E85] text-xs bg-white font-mono text-gray-800"
                />
                <span className="text-[10px] text-gray-400 leading-relaxed">
                  In the PayPal developer dashboard, add a webhook for <code className="bg-gray-100 px-1 rounded">{`${window.location.origin}/api/paypal/webhook`}</code> with
                  the events Checkout order approved, Payment capture completed / denied / refunded / reversed, then paste its ID here.
                  It confirms payments even when a buyer closes the tab before returning to the store.
                </span>
              </div>
            </div>

            {/* Bank Transfer Panel */}
            <div id="setting-bank-transfer" className={`bg-white border rounded-2xl p-5 flex flex-col gap-4 shadow-3xs transition-all ${bankTransferEnabled ? 'border-amber-200' : 'border-gray-200 opacity-75'}`}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h4 className="font-bold text-xs text-gray-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs"></span>
                  Manual Bank Wire Transfer
                </h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[11px] font-semibold text-gray-600">{bankTransferEnabled ? 'Active' : 'Disabled'}</span>
                  <input
                    type="checkbox"
                    checked={bankTransferEnabled}
                    onChange={e => setBankTransferEnabled(e.target.checked)}
                    className="w-4.5 h-4.5 text-amber-600 rounded focus:ring-amber-500"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">Bank accounts configured in General Store Settings will be presented to the customer upon choosing Bank Transfer.</p>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 5: SMTP CONFIGURATION
           ========================================== */}
        {activeSettingsTab === 'smtp' && (
          <div id="setting-smtp-config" className="flex flex-col gap-5 animate-fade-in">
            <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">SMTP Mail Server Settings</h3>
            <p className="text-xs text-gray-400">Configure your system mail settings to send automated notifications and PDF invoice receipts.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">SMTP Server Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={e => setSmtpHost(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="e.g. smtp.mailgun.org"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">SMTP Port</label>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={e => setSmtpPort(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="e.g. 587"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Encryption protocol</label>
                <SearchableSelect
                  value={smtpEncryption}
                  onChange={e => setSmtpEncryption(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700"
                >
                  <option value="tls">STARTTLS / TLS (Recommend)</option>
                  <option value="ssl">SSL / SMTPS</option>
                  <option value="none">None (Plaintext)</option>
                </SearchableSelect>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Username / Email</label>
                <input
                  type="text"
                  value={smtpUsername}
                  onChange={e => setSmtpUsername(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="e.g. mailer@dansolam.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Password / Key</label>
                <input
                  type="password"
                  value={smtpPassword}
                  onChange={e => setSmtpPassword(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="•••••••••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-50 pt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Sender From Address</label>
                <input
                  type="email"
                  value={smtpFromAddress}
                  onChange={e => setSmtpFromAddress(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="e.g. notifications@dansolam.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Sender From Name</label>
                <input
                  type="text"
                  value={smtpFromName}
                  onChange={e => setSmtpFromName(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="e.g. Dansolam"
                />
              </div>
            </div>

            {/* SMTP Test Connection Section */}
            <div id="setting-smtp-test" className="flex flex-col gap-3 border-t border-gray-150 pt-5 mt-2 text-left">
              <h4 className="font-semibold text-xs text-gray-700 uppercase tracking-wider">SMTP Server Verification</h4>
              <p className="text-[11px] text-gray-400">Test your credentials before saving. Enter a destination email address below to send a live verification email.</p>
              
              <div className="flex flex-col sm:flex-row gap-3 items-end max-w-xl">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Test Destination Email</label>
                  <input
                    type="email"
                    value={testEmailRecipient}
                    onChange={e => setTestEmailRecipient(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white w-full"
                    placeholder="e.g. yourname@example.com"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testEmailLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 h-[38px] shrink-0"
                >
                  {testEmailLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Test Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 6: NOTIFICATION TEMPLATES
           ========================================== */}
        {activeSettingsTab === 'templates' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">Email Templates Editor</h3>
            <p className="text-xs text-gray-400">Customise subjects and bodies for automated transactional emails. Use tags like <code>{'{customer_name}'}</code>, <code>{'{order_number}'}</code>, or <code>{'{total_amount}'}</code> to personalize.</p>

            {/* Template 1: Order Confirmation */}
            <div id="setting-email-order-placed" className="bg-gray-50 p-4 border border-gray-200 rounded-xl flex flex-col gap-3">
              <h4 className="font-semibold text-xs text-gray-700">1. Order Placed Confirmation</h4>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-500 font-semibold uppercase">Email Subject</label>
                <input
                  type="text"
                  value={emailOrderPlacedSubject}
                  onChange={e => setEmailOrderPlacedSubject(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-semibold text-gray-800"
                  placeholder="Subject line"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-500 font-semibold uppercase">Email Body Content</label>
                <textarea
                  value={emailOrderPlacedBody}
                  onChange={e => setEmailOrderPlacedBody(e.target.value)}
                  rows="4"
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-mono"
                  placeholder="Hello {customer_name}, your order #{order_number} has been received..."
                ></textarea>
              </div>
            </div>

            {/* Template 2: Order Shipped Dispatch */}
            <div id="setting-email-order-shipped" className="bg-gray-50 p-4 border border-gray-200 rounded-xl flex flex-col gap-3">
              <h4 className="font-semibold text-xs text-gray-700">2. Order Shipped Notification</h4>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-500 font-semibold uppercase">Email Subject</label>
                <input
                  type="text"
                  value={emailOrderShippedSubject}
                  onChange={e => setEmailOrderShippedSubject(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-semibold text-gray-800"
                  placeholder="Subject line"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-500 font-semibold uppercase">Email Body Content</label>
                <textarea
                  value={emailOrderShippedBody}
                  onChange={e => setEmailOrderShippedBody(e.target.value)}
                  rows="4"
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-mono"
                  placeholder="Hello {customer_name}, good news! Your order #{order_number} has been shipped..."
                ></textarea>
              </div>
            </div>

            {/* Template 3: Invoice Notification */}
            <div id="setting-email-invoice" className="bg-gray-50 p-4 border border-gray-200 rounded-xl flex flex-col gap-3">
              <h4 className="font-semibold text-xs text-gray-700">3. Invoice & Receipt Notification</h4>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-500 font-semibold uppercase">Email Subject</label>
                <input
                  type="text"
                  value={emailInvoiceSubject}
                  onChange={e => setEmailInvoiceSubject(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-semibold text-gray-800"
                  placeholder="Subject line"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-550 font-semibold uppercase">Email Body Content</label>
                <textarea
                  value={emailInvoiceBody}
                  onChange={e => setEmailInvoiceBody(e.target.value)}
                  rows="4"
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-mono"
                  placeholder="Hello {customer_name}, please find attached your invoice for order #{order_number}..."
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 7: STOREFRONT PAGES VISIBILITY
           ========================================== */}
        {activeSettingsTab === 'pages' && (
          <div id="setting-page-visibility" className="flex flex-col gap-5 animate-fade-in">
            <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">Public Pages Visibility</h3>
            <p className="text-xs text-gray-400">Toggle whether standard public ecommerce pages (like the Image Gallery or Blog Articles) should be displayed and accessible on the storefront.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                showGalleryPage ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
                <input
                  type="checkbox"
                  checked={showGalleryPage}
                  onChange={e => setShowGalleryPage(e.target.checked)}
                  className="rounded border-gray-300 text-primary w-4.5 h-4.5 shrink-0 mt-0.5"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-800">Show Public Gallery Page</span>
                  <span className="text-[10px] text-gray-400 leading-normal">
                    Display the photo gallery portfolios link on the storefront navigation menus and allow customers to browse images.
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                showBlogPage ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
                <input
                  type="checkbox"
                  checked={showBlogPage}
                  onChange={e => setShowBlogPage(e.target.checked)}
                  className="rounded border-gray-300 text-primary w-4.5 h-4.5 shrink-0 mt-0.5"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-800">Show Public Blog / Articles Page</span>
                  <span className="text-[10px] text-gray-400 leading-normal">
                    Display the ecommerce blog/articles link on storefront navigation menus and allow customers to read posts.
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                soldCountEnabled ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
                <input
                  type="checkbox"
                  checked={soldCountEnabled}
                  onChange={e => setSoldCountEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-primary w-4.5 h-4.5 shrink-0 mt-0.5"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-800">Show Product Sales Count ("Sold So Far")</span>
                  <span className="text-[10px] text-gray-400 leading-normal">
                    Display an organic sales indicator counter (orders volume + manual overrides) on storefront item main details page.
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                showSizeGuideOnProduct ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
                <input
                  type="checkbox"
                  checked={showSizeGuideOnProduct}
                  onChange={e => setShowSizeGuideOnProduct(e.target.checked)}
                  className="rounded border-gray-300 text-primary w-4.5 h-4.5 shrink-0 mt-0.5"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-800">Show Sizing Chart Modal Button</span>
                  <span className="text-[10px] text-gray-400 leading-normal">
                    Display a "Sizing Guide 📏" link modal button next to the size picker on storefront product pages.
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                enableFittingSessions ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
                <input
                  type="checkbox"
                  checked={enableFittingSessions}
                  onChange={e => setEnableFittingSessions(e.target.checked)}
                  className="rounded border-gray-300 text-primary w-4.5 h-4.5 shrink-0 mt-0.5"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    Enable VIP Skin & Spa Consultation Booking
                  </span>
                  <span className="text-[10px] text-gray-400 leading-normal">
                    Display a "Book Skin Consultation" option under the Contact menu dropdown on the storefront, allowing visitors to request private skincare consultations and spa sessions.
                  </span>
                </div>
              </label>
              {modulePosEnabled && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">POS offline sales and synchronization</h4>
                    <p className="text-[10px] text-gray-400 mt-1">Cache the POS catalog on this device, queue sales when disconnected, and synchronize them safely when the connection returns.</p>
                  </div>
                  <label className="flex items-center justify-between gap-4"><span className="text-xs font-semibold text-gray-700">Allow offline checkout</span><input type="checkbox" checked={posOfflineEnabled} onChange={e => setPosOfflineEnabled(e.target.checked)} className="w-4 h-4 rounded text-primary" /></label>
                  <label className="flex items-center justify-between gap-4"><span className="text-xs font-semibold text-gray-700">Automatically sync queued sales</span><input type="checkbox" checked={posAutoSyncEnabled} onChange={e => setPosAutoSyncEnabled(e.target.checked)} disabled={!posOfflineEnabled} className="w-4 h-4 rounded text-primary disabled:opacity-50" /></label>
                  <label className="flex flex-col gap-1.5 max-w-xs"><span className="text-[10px] font-bold uppercase text-gray-500">Retry interval (seconds)</span><input type="number" min="10" max="3600" value={posSyncInterval} onChange={e => setPosSyncInterval(e.target.value)} disabled={!posOfflineEnabled || !posAutoSyncEnabled} className="px-3 py-2 rounded-lg border border-gray-200 text-xs disabled:bg-gray-50" /></label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            MODULES MANAGEMENT
           ========================================== */}
        {activeSettingsTab === 'modules' && (
          <div className="flex flex-col gap-5 animate-fade-in text-left">
            <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">Ecommerce Modules Configuration</h3>
            <p className="text-xs text-gray-400">Enable or disable supplementary ecommerce features, custom integrations, or store modules.</p>

            <div className="grid grid-cols-1 gap-4 mt-2">
              <label id="setting-module-expenses" className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${moduleExpensesEnabled ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                <input type="checkbox" checked={moduleExpensesEnabled} onChange={e => setModuleExpensesEnabled(e.target.checked)} className="rounded border-gray-300 text-primary w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-800">Expenses Management</span>
                  <span className="text-[10px] text-gray-400 leading-normal">Track operating costs, vendors, categories, receipts, payment methods, statuses, and expense totals.</span>
                </div>
              </label>

              <label id="setting-module-purchases" className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${modulePurchasesEnabled ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                <input type="checkbox" checked={modulePurchasesEnabled} onChange={e => setModulePurchasesEnabled(e.target.checked)} className="rounded border-gray-300 text-primary w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-800">Purchases & Suppliers</span>
                  <span className="text-[10px] text-gray-400 leading-normal">Create supplier purchase orders and receive goods directly into product and variant inventory with audit logs.</span>
                </div>
              </label>

              <label id="setting-module-pos" className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                modulePosEnabled ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
                <input
                  type="checkbox"
                  checked={modulePosEnabled}
                  onChange={e => setModulePosEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-primary w-4.5 h-4.5 shrink-0 mt-0.5"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-800">Point of Sale (POS) Checkout</span>
                  <span className="text-[10px] text-gray-400 leading-normal">
                    Enable the full-screen cash register, offline checkout cart, and thermal receipt printer templates module.
                  </span>
                </div>
              </label>

              {modulePosEnabled && (
                <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
                  <div>
                    <span className="block text-xs font-bold text-gray-800 mb-2">POS Printout Format</span>
                    <div className="grid grid-cols-2 gap-3">
                      {['thermal', 'a4'].map(format => (
                        <label key={format} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${posReceiptFormat === format ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                          <input type="radio" name="pos_receipt_format_modules" value={format} checked={posReceiptFormat === format} onChange={() => setPosReceiptFormat(format)} />
                          <span className="text-xs font-bold">{format === 'a4' ? 'A4 invoice' : 'Thermal receipt'}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Only the selected format is used when printing POS receipts.</p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-800">Custom Receipt Footer Message</label>
                    <textarea
                      rows="3"
                      value={posReceiptFooter}
                      onChange={e => setPosReceiptFooter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-mono"
                      placeholder="THANK YOU FOR YOUR PATRONAGE!&#10;All items checked out in-store are non-refundable after tags are removed."
                    ></textarea>
                    <p className="text-[10px] text-gray-400">Custom message, thank you note, or return policy printed at the bottom of all POS receipts. Separate lines with newlines.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* ==========================================
            SECURITY & CAPTCHA PROTECTION
           ========================================== */}
        {activeSettingsTab === 'security' && (
          <div className="flex flex-col gap-6 animate-fade-in text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider">Security & Anti-Bot CAPTCHA Protection</h3>
                <p className="text-xs text-gray-400 mt-0.5">Protect your public web forms, contact inquiries, newsletter signups, and checkout from spam bots.</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${captchaEnabled ? 'bg-green-100 text-green-750 border border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                {captchaEnabled ? '● CAPTCHA ACTIVE' : '○ CAPTCHA DISABLED'}
              </span>
            </div>

            {/* Master Toggle */}
            <div id="setting-captcha-config" className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-gray-900 block">Enable CAPTCHA Protection on Storefront</span>
                <span className="text-[11px] text-gray-500 block mt-0.5">Toggle master switch to turn CAPTCHA verification on or off across all storefront forms.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={captchaEnabled}
                  onChange={(e) => setCaptchaEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {captchaEnabled && (
              <div className="flex flex-col gap-6">
                {/* Form-Specific Toggles */}
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Protected Forms Settings</h4>
                  <p className="text-[11px] text-gray-400 mb-3">Select which public forms require CAPTCHA verification when enabled:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${captchaOnContact ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}>
                      <span className="text-xs font-bold text-gray-800">Contact Us Form (/contact-us)</span>
                      <input type="checkbox" checked={captchaOnContact} onChange={e => setCaptchaOnContact(e.target.checked)} className="rounded text-primary w-4 h-4" />
                    </label>
                    <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${captchaOnNewsletter ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}>
                      <span className="text-xs font-bold text-gray-800">Newsletter Subscription Form</span>
                      <input type="checkbox" checked={captchaOnNewsletter} onChange={e => setCaptchaOnNewsletter(e.target.checked)} className="rounded text-primary w-4 h-4" />
                    </label>
                    <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${captchaOnReviews ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}>
                      <span className="text-xs font-bold text-gray-800">Product Review Submission Form</span>
                      <input type="checkbox" checked={captchaOnReviews} onChange={e => setCaptchaOnReviews(e.target.checked)} className="rounded text-primary w-4 h-4" />
                    </label>
                    <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${captchaOnCheckout ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}>
                      <span className="text-xs font-bold text-gray-800">Guest Checkout Order Form</span>
                      <input type="checkbox" checked={captchaOnCheckout} onChange={e => setCaptchaOnCheckout(e.target.checked)} className="rounded text-primary w-4 h-4" />
                    </label>
                  </div>
                </div>

                {/* Provider Selection */}
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Verification Provider</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'visual_code', title: 'Interactive Visual Challenge (Default)', desc: 'Built-in anti-bot math verification code. Instant, zero keys required.' },
                      { id: 'recaptcha_v2', title: 'Google reCAPTCHA v2', desc: 'Standard "I am not a robot" checkbox challenge.' },
                      { id: 'recaptcha_v3', title: 'Google reCAPTCHA v3', desc: 'Invisible background bot scoring verification.' },
                      { id: 'turnstile', title: 'Cloudflare Turnstile', desc: 'Privacy-friendly Cloudflare smart challenge.' },
                    ].map(prov => (
                      <label key={prov.id} className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${captchaProvider === prov.id ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}>
                        <input type="radio" name="captcha_provider" value={prov.id} checked={captchaProvider === prov.id} onChange={() => setCaptchaProvider(prov.id)} className="mt-0.5 text-primary" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-gray-900">{prov.title}</span>
                          <span className="text-[10px] text-gray-400">{prov.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* API Keys configuration */}
                {captchaProvider !== 'visual_code' && (
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-bold uppercase">Site Key (Public Key)</label>
                      <input
                        type="text"
                        value={captchaSiteKey}
                        onChange={e => setCaptchaSiteKey(e.target.value)}
                        placeholder="e.g. 6Ldxxxxxxxxx"
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-bold uppercase">Secret Key (Private Key)</label>
                      <input
                        type="password"
                        value={captchaSecretKey}
                        onChange={e => setCaptchaSecretKey(e.target.value)}
                        placeholder="e.g. 6Ldxxxxxxxxx"
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STOREFRONT MAINTENANCE MODE SECTION */}
            <div id="setting-maintenance-mode" className="mt-6 border-t border-gray-200 pt-6 flex flex-col gap-5">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    Storefront Maintenance Mode Controls
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Locks the public storefront and displays an interactive, animated maintenance screen while allowing admin access.</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${maintenanceModeEnabled ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                  {maintenanceModeEnabled ? '🔴 MAINTENANCE MODE ACTIVE' : '🟢 STOREFRONT ONLINE'}
                </span>
              </div>

              {/* Maintenance Master Switch */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Enable Storefront Maintenance Mode</span>
                  <span className="text-[11px] text-gray-500 block mt-0.5">When enabled, customers see the interactive animated maintenance page instead of the store.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={maintenanceModeEnabled}
                    onChange={(e) => setMaintenanceModeEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {maintenanceModeEnabled && (
                <div className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col gap-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-bold uppercase">Maintenance Headline Title</label>
                      <input
                        type="text"
                        value={maintenanceTitle}
                        onChange={e => setMaintenanceTitle(e.target.value)}
                        placeholder="e.g. We'll Be Back Soon!"
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-bold uppercase">Estimated Reopening Date & Time</label>
                      <input
                        type="datetime-local"
                        value={maintenanceEndTime}
                        onChange={e => setMaintenanceEndTime(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Maintenance Message / Subtitle</label>
                    <textarea
                      rows="3"
                      value={maintenanceMessage}
                      onChange={e => setMaintenanceMessage(e.target.value)}
                      placeholder="Explain why the store is undergoing maintenance..."
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={maintenanceShowNewsletter} onChange={e => setMaintenanceShowNewsletter(e.target.checked)} className="rounded text-primary" />
                      <span className="text-xs font-semibold text-gray-800">Enable VIP Launch Signup</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={maintenanceShowContact} onChange={e => setMaintenanceShowContact(e.target.checked)} className="rounded text-primary" />
                      <span className="text-xs font-semibold text-gray-800">Show WhatsApp Contact</span>
                    </label>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">Admin Preview Bypass Key</label>
                      <input
                        type="text"
                        value={maintenanceBypassKey}
                        onChange={e => setMaintenanceBypassKey(e.target.value)}
                        placeholder="e.g. secret123"
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 8: DEMO DATA MANAGEMENT
           ========================================== */}
        {activeSettingsTab === 'demo' && (
          <div id="setting-demo-data" className="flex flex-col gap-5 animate-fade-in">
            <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">Demo Data Management</h3>
            <p className="text-xs text-gray-400">Populate your system with realistic demo data to explore all features, or reset to a clean state.</p>

            {/* Seed Demo Data */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Sprout className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-gray-800">Seed Demo Data</h4>
                  <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                    Populates the database with comprehensive demo data including: 2 admin users, ecommerce settings, 8 categories, 4 collections, 5 delivery zones, 4 shipping rates, 2 taxes, 4 coupons, 2 discounts, 4 product tags, 3 banners, 5 pages, 15 products with variants & reviews, 4 blog categories, 5 blog tags, 5 articles with comments, 5 gallery items, 5 customers with addresses, 10 orders with payments, inventory logs, and 5 contact inquiries.
                  </p>
                </div>
              </div>

              {!seedConfirmOpen ? (
                <button
                  type="button"
                  onClick={() => { setSeedConfirmOpen(true); setResetConfirmOpen(false); setConfirmText(''); setDemoError(''); }}
                  className="self-start px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Database className="w-4 h-4" />
                  Seed Demo Data
                </button>
              ) : (
                <div className="bg-white border border-amber-300 rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-bold">Type CONFIRM to proceed with seeding demo data</span>
                  </div>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="Type CONFIRM"
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-500 text-xs bg-white font-mono uppercase"
                    autoFocus
                  />
                  {demoError && (
                    <div className="text-[10px] text-red-500 font-semibold">{demoError}</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={seedLoading || confirmText !== 'CONFIRM'}
                      onClick={async () => {
                        if (confirmText !== 'CONFIRM') return;
                        setSeedLoading(true);
                        setDemoError('');
                        try {
                          const res = await apiFetch('/api/admin/demo-data/seed', {
                            method: 'POST',
                            body: JSON.stringify({ confirmation: confirmText })
                          });
                          const data = await res.json();
                          setSeedLoading(false);
                          if (data.success) {
                            setSeedSuccess(true);
                            systemToast.success(data.message || 'Demo data created successfully.');
                            setSeedConfirmOpen(false);
                            setConfirmText('');
                            setTimeout(() => setSeedSuccess(false), 5000);
                          } else {
                            setDemoError(data.message || 'Seeding failed');
                          }
                        } catch (e) {
                          setSeedLoading(false);
                          setDemoError('Connection error while seeding');
                        }
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                    >
                      {seedLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Seeding...
                        </>
                      ) : (
                        <>
                          <Sprout className="w-4 h-4" />
                          Confirm Seed
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={seedLoading}
                      onClick={() => { setSeedConfirmOpen(false); setConfirmText(''); setDemoError(''); }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {seedSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-3 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-4 h-4" />
                  Demo data seeded successfully! Refresh the page to see changes.
                </div>
              )}
            </div>

            {/* Reset Data */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex flex-col gap-4 mt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-gray-800">Reset All Data</h4>
                  <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                    <strong className="text-red-600">WARNING:</strong> This will permanently delete ALL data from the database including products, orders, customers, reviews, articles, gallery items, and settings. This action cannot be undone. The database will be completely empty after this operation.
                  </p>
                </div>
              </div>

              {!resetConfirmOpen ? (
                <button
                  type="button"
                  onClick={() => { setResetConfirmOpen(true); setSeedConfirmOpen(false); setConfirmText(''); setDemoError(''); }}
                  className="self-start px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset All Data
                </button>
              ) : (
                <div className="bg-white border border-red-300 rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-bold">Type CONFIRM to permanently delete all data</span>
                  </div>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="Type CONFIRM"
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-red-500 text-xs bg-white font-mono uppercase"
                    autoFocus
                  />
                  {demoError && (
                    <div className="text-[10px] text-red-500 font-semibold">{demoError}</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={resetLoading || confirmText !== 'CONFIRM'}
                      onClick={async () => {
                        if (confirmText !== 'CONFIRM') return;
                        setResetLoading(true);
                        setDemoError('');
                        try {
                          const res = await apiFetch('/api/admin/demo-data/reset', {
                            method: 'POST',
                            body: JSON.stringify({ confirmation: confirmText })
                          });
                          const data = await res.json();
                          setResetLoading(false);
                          if (data.success) {
                            setResetSuccess(true);
                            systemToast.success(data.message || 'Demo data reset successfully.');
                            setResetConfirmOpen(false);
                            setConfirmText('');
                            setTimeout(() => setResetSuccess(false), 5000);
                          } else {
                            setDemoError(data.message || 'Reset failed');
                          }
                        } catch (e) {
                          setResetLoading(false);
                          setDemoError('Connection error while resetting');
                        }
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                    >
                      {resetLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          Confirm Reset
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={resetLoading}
                      onClick={() => { setResetConfirmOpen(false); setConfirmText(''); setDemoError(''); }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {resetSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-3 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-4 h-4" />
                  All data has been reset successfully. The database is now clean.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Alert */}
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-3 text-xs font-semibold flex items-center gap-1.5 mt-2 animate-fade-in">
            <Check className="w-4 h-4" />
            Ecommerce system settings and configurations saved successfully!
          </div>
        )}

        {activeSettingsTab !== 'demo' && (
          <button
            type="submit"
            disabled={saveLoading}
            className="self-end px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all mt-4"
          >
            {saveLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving System Configs...
              </>
            ) : 'Save Settings'}
          </button>
        )}

      </form>
    </div>
  );
}
