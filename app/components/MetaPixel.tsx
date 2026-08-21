'use client';
import Script from 'next/script';

/* Meta Pixel.
 *
 * The point of this is the retargeting audience, and an audience can only ever contain people
 * who visited AFTER the pixel went live — there is no way to add yesterday's visitors. So this
 * wants to be on every site before any ad money is spent, not after.
 *
 * The ID comes from NEXT_PUBLIC_META_PIXEL_ID so the same component drops into all ten sites
 * and the value is set once per Vercel project. With no ID set the component renders nothing
 * and costs nothing, which is what happens on a site that has not been configured yet.
 *
 * PRODUCT tags every event with which of the ten it came from, so one pixel can serve the whole
 * suite and still be segmented — "everyone who looked at PoolBossPro" stays a targetable slice.
 *
 * Loaded through next/script rather than a hand-rolled injector, matching how the Google tag in
 * this same layout is loaded. Inline scripts need an id for Next to track them.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
const PRODUCT = 'mowbosspro';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/* Called when a visitor actually opens the demo — see HeroDemo. Meta optimises toward whatever
 * you tell it to count, so counting demo opens rather than page loads points the spend at
 * people who try the software instead of people who merely arrive. */
export function pixelDemoStarted() {
  try {
    window.fbq?.('track', 'Lead', { content_category: PRODUCT, content_name: 'demo_started' });
  } catch { /* tracking must never break the page */ }
}

export default function MetaPixel() {
  if (!PIXEL_ID) return null;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');
fbq('track','PageView');
fbq('track','ViewContent',{content_category:'${PRODUCT}'});`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: 'none' }} alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} />
      </noscript>
    </>
  );
}
