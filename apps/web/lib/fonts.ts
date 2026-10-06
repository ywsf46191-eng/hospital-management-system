import localFont from 'next/font/local';

/** Self-hosted Inter (Latin) — no CDN. */
export const inter = localFont({
  src: [
    { path: '../fonts/inter-latin-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/inter-latin-600.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/inter-latin-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-inter',
  adjustFontFallback: false,
});

/** Self-hosted Noto Sans Arabic — no CDN. */
export const notoSansArabic = localFont({
  src: [
    { path: '../fonts/noto-sans-arabic-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/noto-sans-arabic-600.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/noto-sans-arabic-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-noto-arabic',
  adjustFontFallback: false,
});
