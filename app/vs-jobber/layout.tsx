import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MowBossPro vs Jobber | MowBossPro',
  description: 'MowBossPro vs Jobber: mowing-native scheduling, flat $79/month pricing, circle-map routing, and service compliance logs. Feature-by-feature comparison.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
