import type { Metadata } from "next";
import Script from "next/script";
import Footer from "./components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "MowBossPro | Lawn Mowing & Lawn Care Software",
  description: "MowBossPro is lawn mowing software built by people who've run real routes — recurring route scheduling, map-based routing, crew dispatch, automated SMS, and card-on-file billing. $79/month, everything included.",
};


const structuredData = {"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://mowbosspro.com/#organization","name":"MowBossPro","url":"https://mowbosspro.com","logo":"https://mowbosspro.com/icon.svg","description":"Lawn mowing software with recurring route scheduling, map-based routing, crew dispatch, automated SMS, and card-on-file billing."},{"@type":"WebSite","@id":"https://mowbosspro.com/#website","url":"https://mowbosspro.com","name":"MowBossPro","publisher":{"@id":"https://mowbosspro.com/#organization"}},{"@type":"SoftwareApplication","name":"MowBossPro","applicationCategory":"BusinessApplication","operatingSystem":"Web, iOS, Android","description":"Lawn mowing software with recurring route scheduling, map-based routing, crew dispatch, automated SMS, and card-on-file billing.","offers":{"@type":"Offer","price":"79","priceCurrency":"USD","description":"$79/month flat — everything included, 14-day free trial."},"publisher":{"@id":"https://mowbosspro.com/#organization"}}]};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
        <Footer />
        <Script
          src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
