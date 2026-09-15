import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MowBossPro vs Aspire Software | MowBossPro',
  description: 'MowBossPro vs Aspire Software: purpose-built mowing routes, flat from $59/month pricing, and no enterprise implementation timeline. See how they compare.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
