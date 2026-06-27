import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MowBossPro vs ServiceTitan | MowBossPro',
  description: 'MowBossPro vs ServiceTitan: lighter pricing, faster setup, and mowing-route-native scheduling built for lawn care and lawn care — not enterprise HVAC.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}