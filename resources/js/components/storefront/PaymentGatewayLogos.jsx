import React from 'react';

/**
 * Paystack Vector Logo Badge
 */
export function PaystackLogo({ className = 'h-5 w-auto', variant = 'colored' }) {
  return (
    <svg className={className} viewBox="0 0 138 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Paystack">
      {/* Paystack Icon */}
      <g>
        <path d="M4 4H24V7.5H4V4Z" fill="#00C3F7" />
        <path d="M4 10.5H18V14H4V10.5Z" fill="#00C3F7" />
        <path d="M4 17H24V20.5H4V17Z" fill="#00C3F7" />
        <path d="M4 23.5H18V27H4V23.5Z" fill="#00C3F7" />
      </g>
      {/* Paystack Wordmark */}
      <text
        x="32"
        y="19.5"
        fill={variant === 'white' ? '#FFFFFF' : '#092C4C'}
        className={variant === 'adaptive' ? 'fill-[#092C4C] dark:fill-white' : ''}
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="17"
        fontWeight="800"
        letterSpacing="-0.5px"
      >
        paystack
      </text>
    </svg>
  );
}

/**
 * Stripe Vector Logo
 */
export function StripeLogo({ className = 'h-5 w-auto', variant = 'colored' }) {
  return (
    <svg className={className} viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Stripe">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M59.64 14.28c0-4.49-2.17-8-6.47-8-4.32 0-6.9 3.51-6.9 8 0 5.28 3.1 7.94 7.45 7.94 2.13 0 3.73-.48 4.95-1.16v-3.48c-1.22.61-2.58.97-4.14.97-1.63 0-3.05-.62-3.26-2.5h8.33c.03-.4.04-1.27.04-1.77zm-8.37-1.57c0-1.75 1.07-2.47 2-2.47.9 0 1.93.72 1.93 2.47h-3.93zm-9.35-4.43c-1.64 0-2.69.77-3.23 1.3v-1.1h-4.75v19.46l5-.98v-4.57c.57.44 1.5.96 2.92.96 2.97 0 5.86-2.29 5.86-7.55-.01-5.06-2.91-7.52-5.8-7.52zm-1.53 10.96c-1.46 0-2.31-1.07-2.31-2.69s.83-2.73 2.31-2.73c1.45 0 2.29 1.11 2.29 2.73 0 1.63-.84 2.69-2.29 2.69zm-13.88-9.4h-5.03v11.96h5.03v-11.96zm-2.52-1.99c1.63 0 2.69-1.07 2.69-2.43 0-1.39-1.06-2.43-2.69-2.43-1.61 0-2.68 1.04-2.68 2.43 0 1.36 1.07 2.43 2.68 2.43zm-7.66 4.33l-.36-2.14h-4.48v11.96h4.99v-7.23c1.07-1.39 2.87-1.14 3.44-.94v-4.71c-.62-.22-2.71-.56-3.59 3.06zm-10.74-.75c-1.16-.48-2.77-.92-2.77-1.84 0-.74.69-1.23 1.83-1.23 1.63 0 3.3.62 4.49 1.34l1.64-3.51c-1.43-.8-3.53-1.31-6.13-1.31-4.14 0-6.9 2.16-6.9 5.79 0 3.82 3.47 4.7 5.76 5.37 1.4.43 1.88.94 1.88 1.56 0 .86-.81 1.34-2.11 1.34-1.78 0-3.95-.8-5.32-1.75l-1.63 3.63c1.58 1.05 4.09 1.66 6.95 1.66 4.35 0 7.21-2.14 7.21-5.91-.01-4.05-3.51-4.83-4.85-5.15z"
        fill={variant === 'white' ? '#FFFFFF' : '#635BFF'}
      />
    </svg>
  );
}

/**
 * PayPal Vector Logo
 */
export function PayPalLogo({ className = 'h-5 w-auto', variant = 'colored' }) {
  return (
    <svg className={className} viewBox="0 0 84 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="PayPal">
      <g>
        {/* Double P Mark */}
        <path d="M7.74 3.25H16.24C19.33 3.25 21.41 4.72 20.89 7.94C20.35 11.23 18.06 13.08 15.02 13.08H11.51L10.05 21.75H5.06L7.74 3.25Z" fill="#003087" />
        <path d="M11.64 6.75H17.89C20.36 6.75 22.02 7.92 21.61 10.5C21.18 13.13 19.34 14.61 16.91 14.61H14.1L12.93 21.75H9.5L11.64 6.75Z" fill="#0079C1" />
        <path d="M14.1 14.61L15.02 8.84C15.02 8.84 15.34 7.08 17.89 6.75C17.39 6.75 12.83 6.75 11.64 6.75L9.5 21.75H12.93L14.1 14.61Z" fill="#00296B" />
      </g>
      {/* PayPal text */}
      <text
        x="26"
        y="18"
        fill={variant === 'white' ? '#FFFFFF' : '#003087'}
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="16"
        fontWeight="800"
        fontStyle="italic"
        letterSpacing="-0.5px"
      >
        Pay<tspan fill={variant === 'white' ? '#FFFFFF' : '#0079C1'}>Pal</tspan>
      </text>
    </svg>
  );
}

/**
 * Flutterwave Vector Logo
 */
export function FlutterwaveLogo({ className = 'h-5 w-auto', variant = 'colored' }) {
  return (
    <svg className={className} viewBox="0 0 135 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Flutterwave">
      <g>
        {/* Flutterwave Butterfly ribbons */}
        <path d="M3.5 13C3.5 7.75 7.75 3.5 13 3.5C18.25 3.5 22.5 7.75 22.5 13" stroke="#F5A623" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M7 17.5C7 13.36 10.36 10 14.5 10C18.64 10 22 13.36 22 17.5" stroke="#FB6340" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M10.5 22C10.5 18.96 12.96 16.5 16 16.5C19.04 16.5 21.5 18.96 21.5 22" stroke="#11CDEF" strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <text
        x="30"
        y="18"
        fill={variant === 'white' ? '#FFFFFF' : '#0A0E27'}
        className={variant === 'adaptive' ? 'fill-[#0A0E27] dark:fill-white' : ''}
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="14"
        fontWeight="800"
        letterSpacing="-0.2px"
      >
        Flutterwave
      </text>
    </svg>
  );
}

/**
 * Visa Official Mark
 */
export function VisaLogo({ className = 'h-3.5 w-auto', variant = 'colored' }) {
  return (
    <svg className={className} viewBox="0 0 36 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
      <path
        d="M13.67 0.35L9.04 11.5H6.11L3.71 2.5C3.57 1.95 3.44 1.74 3.01 1.51C2.31 1.14 1.08 0.77 0 0.54L0.06 0.35H5.06C5.7 0.35 6.27 0.77 6.4 1.48L7.63 8.01L10.72 0.35H13.67ZM25.29 8.21C25.31 5.08 20.97 4.9 21.01 3.5C21.03 3.08 21.44 2.62 22.38 2.5C22.84 2.44 24.13 2.39 25.56 3.05L26.11 0.78C25.35 0.5 24.37 0.25 23.15 0.25C20.31 0.25 18.28 1.77 18.26 3.9C18.23 5.5 19.67 6.39 20.76 6.92C21.88 7.47 22.25 7.82 22.24 8.31C22.23 9.06 21.34 9.39 20.5 9.4C19.06 9.42 17.84 8.98 17.18 8.68L16.61 11.02C17.39 11.38 18.82 11.69 20.3 11.7C23.36 11.7 25.28 10.19 25.29 8.21ZM32.74 11.5H35.32L33.06 0.35H30.73C30.22 0.35 29.78 0.64 29.59 1.1L25.33 11.5H28.31L28.9 9.87H32.53L32.74 11.5ZM29.72 7.56L31.25 3.32L32.13 7.56H29.72ZM17.65 0.35L15.34 11.5H12.51L14.82 0.35H17.65Z"
        fill={variant === 'white' ? '#FFFFFF' : '#1A1F71'}
      />
      <path d="M5.06 0.35H0L0.06 0.54C2.56 1.17 4.7 1.95 6.4 3.05L5.06 0.35Z" fill="#F7B600" />
    </svg>
  );
}

/**
 * Mastercard Official Mark
 */
export function MastercardLogo({ className = 'h-4 w-auto' }) {
  return (
    <svg className={className} viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
      <circle cx="8" cy="8" r="7" fill="#EB001B" />
      <circle cx="16" cy="8" r="7" fill="#F79E1B" fillOpacity="0.9" />
      <path d="M12 2.68A6.98 6.98 0 0 0 9.33 8c0 2.24 1.05 4.23 2.67 5.32A6.98 6.98 0 0 0 14.67 8c0-2.24-1.05-4.23-2.67-5.32z" fill="#FF5F00" />
    </svg>
  );
}
