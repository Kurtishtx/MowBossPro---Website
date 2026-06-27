import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MowBossPro vs LawnPro | MowBossPro',
  description: 'MowBossPro vs LawnPro: circle-map routing, job board dispatch, sq ft pricing, and automated SMS for mowing businesses. Feature-by-feature comparison.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}