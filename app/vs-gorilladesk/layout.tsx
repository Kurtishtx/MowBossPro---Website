import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MowBossPro vs GorillaDesk | MowBossPro',
  description: 'MowBossPro vs GorillaDesk: circle-map routing, sq ft pricing, automated SMS, and mowing-specific compliance logs — built for routes, not generic lawn care.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}