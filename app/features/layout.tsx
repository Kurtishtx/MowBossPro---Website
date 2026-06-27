import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features | MowBossPro',
  description: 'Circle-map routing, job board dispatch, recurring program scheduling, automated SMS alerts, service compliance logs, and Stripe payments — all included.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}