import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MowBossPro vs RealGreen | MowBossPro',
  description: 'MowBossPro vs RealGreen: modern routing, circle-map dispatch, and service compliance logs — without the legacy software learning curve. $79/month flat.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
