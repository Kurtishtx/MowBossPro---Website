import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MowBossPro vs Housecall Pro | MowBossPro',
  description: 'MowBossPro vs Housecall Pro: spray-specific scheduling, circle-map routing, waiting list dispatch, and chemical compliance logs. See how they compare.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}