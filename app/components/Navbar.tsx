'use client';
import { useState } from 'react';

const solutions = [
  { label: 'Lawn Mowing Software',     href: '/lawn-mowing-software' },
  { label: 'Lawn Care Software',       href: '/lawn-care-software' },
  { label: 'Mowing Scheduling',        href: '/lawn-care-scheduling-software' },
  { label: 'Routes & Dispatch',        href: '/lawn-mowing-routes-software' },
  { label: 'Invoicing & Payments',     href: '/lawn-care-invoicing-software' },
  { label: 'Mowing Business Software', href: '/mowing-business-software' },
];

const comparisons = [
  { label: 'vs. Jobber',             href: '/vs-jobber' },
  { label: 'vs. ServiceTitan',       href: '/vs-servicetitan' },
  { label: 'vs. GorillaDesk',        href: '/vs-gorilladesk' },
  { label: 'vs. Housecall Pro',      href: '/vs-housecallpro' },
  { label: 'vs. FieldRoutes',        href: '/vs-fieldroutes' },
  { label: 'vs. Service AutoPilot',  href: '/vs-serviceautopilot' },
  { label: 'vs. RealGreen',          href: '/vs-realgreen' },
  { label: 'vs. LawnPro',            href: '/vs-lawnpro' },
  { label: 'vs. CLIP',               href: '/vs-clip' },
  { label: 'vs. Aspire',             href: '/vs-aspire' },
];

export default function Navbar({ onTrialClick }: { onTrialClick: (el: HTMLElement) => void }) {
  const [open, setOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const toggleMenu = (val: boolean) => {
    setOpen(val);
    document.body.style.overflow = val ? 'hidden' : '';
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <a href="/" style={{textDecoration:'none', display:'flex', alignItems:'center', gap:'8px'}}>
              <svg className="navbar-icon" width="30" height="30" viewBox="0 0 32 32" fill="none" style={{display:'block'}} aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="#ffffff"/>
                <g fill="#2e9e3f">
                  <path d="M16 28 C 14.4 19 14.4 11 16 4.5 C 17.6 11 17.6 19 16 28 Z"/>
                  <path d="M9.5 28 C 8 19.5 6 13 4 7 C 7 13 9.5 19.5 11 28 Z"/>
                  <path d="M22.5 28 C 24 19.5 26 13 28 7 C 25 13 22.5 19.5 21 28 Z"/>
                  <path d="M13 28 C 11.4 20 10.3 14.5 8.5 9.5 C 11 14.5 13 20 14 28 Z"/>
                  <path d="M19 28 C 20.6 20 21.7 14.5 23.5 9.5 C 21 14.5 19 20 18 28 Z"/>
                </g>
              </svg>
              <span className="navbar-name">MowBossPro</span>
            </a>
          </div>
          <div className="navbar-links">
            <div className="nav-dropdown">
              <span className="nav-dropdown-trigger">Solutions ▾</span>
              <div className="nav-dropdown-menu">
                <div className="nav-dropdown-inner">
                  {solutions.map(s => (
                    <a key={s.href} href={s.href} className="nav-dropdown-item">{s.label}</a>
                  ))}
                </div>
              </div>
            </div>
            <div className="nav-dropdown">
              <span className="nav-dropdown-trigger">Compare ▾</span>
              <div className="nav-dropdown-menu">
                <div className="nav-dropdown-inner">
                  {comparisons.map(c => (
                    <a key={c.href} href={c.href} className="nav-dropdown-item">{c.label}</a>
                  ))}
                </div>
              </div>
            </div>
            <a href="/features">Features</a>
            <a href="/pricing">Pricing</a>
            <a href="https://my.mowbosspro.com" target="_blank" rel="noreferrer">Log In</a>
            <a href="https://my.mowbosspro.com/demo.html" className="navbar-demo" style={{display:'inline-flex', alignItems:'center', gap:'7px', border:'1.5px solid rgba(255,255,255,.35)', borderRadius:'6px', padding:'9px 16px', fontSize:'14px', fontWeight:700, color:'#fff', textDecoration:'none', whiteSpace:'nowrap'}}>
              <span style={{width:'7px', height:'7px', borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 0 3px rgba(74,222,128,.22)'}} />
              Live Demo
            </a>
            <button
              className="navbar-cta"
              onClick={(e) => onTrialClick(e.currentTarget as HTMLElement)}
              style={{background:'var(--orange)', color:'#fff', border:'none', borderRadius:'6px', padding:'10px 20px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit'}}
            >
              Start Free Trial
            </button>
          </div>
          {/* Live Demo — mobile only, sits in the bar next to the hamburger */}
          <a
            href="https://my.mowbosspro.com/demo.html"
            className="nav-demo-mobile"
            style={{ alignItems: 'center', gap: '6px', marginLeft: 'auto', marginRight: '12px', border: '1.5px solid rgba(255,255,255,.35)', background: 'rgba(255,255,255,.06)', borderRadius: '999px', padding: '7px 13px', fontSize: '13px', fontWeight: 700, color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 3px rgba(74,222,128,.22)', flexShrink: 0 }} />
            Live Demo
          </a>

          {/* Hamburger — mobile only */}
          <button className="nav-hamburger" onClick={() => toggleMenu(!open)} aria-label="Menu">
            <span style={{display:'block', width:'22px', height:'2px', background:'#fff', marginBottom:'5px', transition:'transform .2s', transform: open ? 'rotate(45deg) translate(5px,5px)' : 'none'}}></span>
            <span style={{display:'block', width:'22px', height:'2px', background:'#fff', marginBottom:'5px', transition:'opacity .2s', opacity: open ? 0 : 1}}></span>
            <span style={{display:'block', width:'22px', height:'2px', background:'#fff', transition:'transform .2s', transform: open ? 'rotate(-45deg) translate(5px,-5px)' : 'none'}}></span>
          </button>
        </div>
      </nav>

      {/* Mobile menu — outside <nav> so navbar's backdrop-filter doesn't trap fixed positioning */}
      {open && (
        <div className="nav-mobile-menu">
          <div className="nav-mobile-section">
            <div className="nav-mobile-group-trigger" onClick={() => setSolutionsOpen(!solutionsOpen)}>
              Solutions {solutionsOpen ? '▴' : '▾'}
            </div>
            {solutionsOpen && solutions.map(s => (
              <a key={s.href} href={s.href} className="nav-mobile-item" onClick={() => toggleMenu(false)}>{s.label}</a>
            ))}
          </div>
          <div className="nav-mobile-section">
            <div className="nav-mobile-group-trigger" onClick={() => setCompareOpen(!compareOpen)}>
              Compare {compareOpen ? '▴' : '▾'}
            </div>
            {compareOpen && comparisons.map(c => (
              <a key={c.href} href={c.href} className="nav-mobile-item" onClick={() => toggleMenu(false)}>{c.label}</a>
            ))}
          </div>
          <a href="/features" className="nav-mobile-link" onClick={() => toggleMenu(false)}>Features</a>
          <a href="/pricing" className="nav-mobile-link" onClick={() => toggleMenu(false)}>Pricing</a>
          <a href="https://my.mowbosspro.com" target="_blank" rel="noreferrer" className="nav-mobile-link" onClick={() => toggleMenu(false)}>Log In</a>
          <a href="https://my.mowbosspro.com/demo.html" className="nav-mobile-link" onClick={() => toggleMenu(false)}>▶ Try the Live Demo — no signup</a>
          <button
            className="nav-mobile-cta"
            onClick={(e) => { toggleMenu(false); onTrialClick(e.currentTarget as HTMLElement); }}
          >
            Start Free Trial
          </button>
        </div>
      )}
    </>
  );
}
