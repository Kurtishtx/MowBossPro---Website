import type { Metadata } from "next";
import Script from "next/script";
import Footer from "./components/Footer";
import DemoPopup from "./components/DemoPopup";
import "./globals.css";
import MetaPixel from './components/MetaPixel';

export const metadata: Metadata = {
  /* Every route resolves its own canonical against this base, so a page reached as www vs
     non-www, with a trailing slash, or carrying ?fbclid=/?utm_source= all point at one URL
     instead of competing with each other. */
  metadataBase: new URL('https://mowbosspro.com'),
  alternates: { canonical: './' },

  title: "MowBossPro | Lawn Mowing & Lawn Care Software",
  description: "MowBossPro is lawn mowing software built by people who've run real routes — recurring route scheduling, map-based routing, crew dispatch, automated SMS, and card-on-file billing. from $59/month, everything included.",
};


const structuredData = {"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://mowbosspro.com/#organization","name":"MowBossPro","url":"https://mowbosspro.com","logo":"https://mowbosspro.com/icon.png","description":"Lawn mowing software with recurring route scheduling, map-based routing, crew dispatch, automated SMS, and card-on-file billing."},{"@type":"WebSite","@id":"https://mowbosspro.com/#website","url":"https://mowbosspro.com","name":"MowBossPro","publisher":{"@id":"https://mowbosspro.com/#organization"}},{"@type":"SoftwareApplication","name":"MowBossPro","applicationCategory":"BusinessApplication","operatingSystem":"Web, iOS, Android","description":"Lawn mowing software with recurring route scheduling, map-based routing, crew dispatch, automated SMS, and card-on-file billing.","offers":{"@type":"AggregateOffer","lowPrice":"59","highPrice":"199","offerCount":"3","priceCurrency":"USD","description":"from $59/month flat — everything included, 14-day free trial."},"publisher":{"@id":"https://mowbosspro.com/#organization"}}]};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
        {/* Meta Pixel — builds the retargeting audience. Inert until
            NEXT_PUBLIC_META_PIXEL_ID is set on the Vercel project. */}
        <MetaPixel />
        <DemoPopup />
        <Footer />
        <Script
          src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
