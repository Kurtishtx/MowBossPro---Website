import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lawn Mowing Software for Canada | CAD Invoicing Built In — MowBossPro',
  description: 'Lawn mowing software that works in Canada today — bill your customers in Canadian dollars, hold weekly cut schedules through rain weeks, route whole neighbourhoods, and run spring-to-fall from one dashboard. 14-day free trial, no credit card. $79 USD/month.',
  alternates: { canonical: 'https://mowbosspro.com/lawn-mowing-software-canada' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
