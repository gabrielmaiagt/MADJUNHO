
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ProfileProvider } from '@/context/profile-context';
import { CartProvider } from '@/context/cart-context';
import { AnalyticsProvider } from '@/context/analytics-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { BalanceProvider } from '@/context/balance-context';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Madames Online VIP',
  description: 'Conecte-se com madames e ganhe recompensas.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Madames VIP',
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="https://firebasestorage.googleapis.com/v0/b/mentoros-app.firebasestorage.app/o/media-hub%2FMAbrOVJfktZcWonkiLv4OS8eDc12%2F1781993204208-logo-madames.webp?alt=media&token=6b22c359-b4d6-4618-9503-7ce8ad0ef28f" type="image/webp" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
        
        {/* UTMify Main Script */}
        <script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          async
          defer
          data-utmify-prevent-xcod-sck=""
          data-utmify-prevent-subids=""
        ></script>

        {/* UTMify Pixel */}
        <Script id="utmify-pixel" strategy="afterInteractive">
          {`
            window.pixelId = "6aa20a1ba9d04e8819d0201b";
            var a = document.createElement("script");
            a.setAttribute("async", "");
            a.setAttribute("defer", "");
            a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
            document.head.appendChild(a);
          `}
        </Script>

        {/* --- Script to capture UTMs and handle initial redirect --- */}
        <Script id="utm-capture-and-redirect" strategy="beforeInteractive">
          {`
            try {
              const params = new URLSearchParams(window.location.search);
              const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'xcod', 'src', 'sck'];
              let utm_params = {};
              let hasUtm = false;

              utmKeys.forEach(key => {
                const value = params.get(key);
                if (value) {
                  utm_params[key] = value;
                  hasUtm = true;
                }
              });

              if (hasUtm) {
                localStorage.setItem('utm_params', JSON.stringify(utm_params));
              }

              // Redirection logic preserving UTMs
              const onboardingComplete = localStorage.getItem('onboardingComplete') === 'true';
              const currentPath = window.location.pathname;
              const searchParams = window.location.search;

              if (currentPath === '/') {
                  if (onboardingComplete) {
                      window.location.replace('/comunidade' + searchParams);
                  } else {
                      window.location.replace('/create' + searchParams);
                  }
              }
            } catch (e) {
              console.error('Error in UTM capture script:', e);
            }
          `}
        </Script>
      </head>
      <body className="font-body antialiased bg-background">
        <FirebaseClientProvider>
          <AnalyticsProvider>
            <ProfileProvider>
              <CartProvider>
                <BalanceProvider>
                  {children}
                </BalanceProvider>
              </CartProvider>
            </ProfileProvider>
          </AnalyticsProvider>
        </FirebaseClientProvider>
        <Toaster />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
