import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MowBossPro vs Service Autopilot | MowBossPro',
  description: 'MowBossPro vs Service Autopilot: mowing-specific route scheduling, flat pricing, and faster setup for lawn care and lawn care businesses. Compare features.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}