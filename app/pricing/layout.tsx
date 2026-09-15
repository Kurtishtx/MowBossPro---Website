import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | MowBossPro',
  description: 'from $59/month for everything. No hidden fees, no add-ons, no setup costs. Full access to every feature including routes, SMS alerts, and compliance logs.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
