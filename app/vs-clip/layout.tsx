import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MowBossPro vs CLIP Lawn Software | MowBossPro',
  description: 'MowBossPro vs CLIP Lawn Software: modern web-based routing, circle-map dispatch, automated SMS, and mowing-native scheduling at flat $79/month.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
