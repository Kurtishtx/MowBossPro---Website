import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MowBossPro vs Housecall Pro | MowBossPro',
  description: 'MowBossPro vs Housecall Pro: mowing-specific scheduling, circle-map routing, job board dispatch, and service compliance logs. See how they compare.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}