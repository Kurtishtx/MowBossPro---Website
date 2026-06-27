'use client';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';

const SBP_URL  = 'https://knjdbgroiyhvqwrpqzcx.supabase.co';
const SBP_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuamRiZ3JvaXlodnF3cnBxemN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTczMDMsImV4cCI6MjA5NTA3MzMwM30.zoExtkem-XZqU86S4yJjA_xOOaS1G0IPU2M9OAAza2g';
let sbpClient: any = null;
let sbpOpenForm = 0;

function getSbpClient() {
  if (!sbpClient) sbpClient = (window as any).supabase.createClient(SBP_URL, SBP_ANON);
  return sbpClient;
}

function openSignupModal(n: number, btn: HTMLElement) {
  closeAllModals();
  sbpOpenForm = n;
  const form = document.getElementById('sbp-form-' + n)!;
  const rect = btn.getBoundingClientRect();
  const formW = Math.min(420, window.innerWidth - 24);
  const centerX = rect.left + rect.width / 2;
  let top  = rect.bottom + 12;
  let left = centerX - formW / 2;
  if (top + 460 > window.innerHeight) { top = rect.top - 460 - 12; if (top < 12) top = 12; }
  top  = Math.max(12, top);
  left = Math.max(12, Math.min(left, window.innerWidth - formW - 12));
  form.style.top  = top  + 'px';
  form.style.left = left + 'px';
  form.style.display = 'block';
  document.getElementById('sbp-backdrop')!.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeSignupModal(n: number) {
  document.getElementById('sbp-form-' + n)!.style.display = 'none';
  document.getElementById('sbp-backdrop')!.style.display = 'none';
  document.body.style.overflow = '';
  sbpOpenForm = 0;
}

function closeAllModals() {
  [1, 2, 3].forEach(i => {
    const el = document.getElementById('sbp-form-' + i);
    if (el) el.style.display = 'none';
  });
  const backdrop = document.getElementById('sbp-backdrop');
  if (backdrop) backdrop.style.display = 'none';
  document.body.style.overflow = '';
  sbpOpenForm = 0;
}

function sbpStep2(n: number) {
  const err = document.getElementById(`sbp${n}-err1`)!;
  err.style.display = 'none';
  const first = (document.getElementById(`sbp${n}-first`) as HTMLInputElement).value.trim();
  const last  = (document.getElementById(`sbp${n}-last`)  as HTMLInputElement).value.trim();
  const comp  = (document.getElementById(`sbp${n}-company`) as HTMLInputElement).value.trim();
  const email = (document.getElementById(`sbp${n}-email`) as HTMLInputElement).value.trim();
  if (!first || !last)                return sbpShowErr(err, 'Please enter your first and last name.');
  if (!comp)                          return sbpShowErr(err, 'Please enter your company name.');
  if (!email || !email.includes('@')) return sbpShowErr(err, 'Please enter a valid email address.');
  (document.getElementById(`sbp${n}-login-email`) as HTMLInputElement).value = email;
  document.getElementById(`sbp${n}-step1`)!.style.display = 'none';
  document.getElementById(`sbp${n}-step2`)!.style.display = 'block';
  (document.getElementById(`sbp${n}-password`) as HTMLInputElement).focus();
}

function sbpBackToStep1(n: number) {
  document.getElementById(`sbp${n}-step2`)!.style.display = 'none';
  document.getElementById(`sbp${n}-step1`)!.style.display = 'block';
  document.getElementById(`sbp${n}-err2`)!.style.display  = 'none';
}

async function sbpCreateAccount(n: number) {
  const err = document.getElementById(`sbp${n}-err2`)!;
  const btn = document.getElementById(`sbp${n}-create-btn`) as HTMLButtonElement;
  err.style.display = 'none';
  const email    = (document.getElementById(`sbp${n}-login-email`) as HTMLInputElement).value.trim();
  const password = (document.getElementById(`sbp${n}-password`)    as HTMLInputElement).value;
  const confirm  = (document.getElementById(`sbp${n}-confirm`)     as HTMLInputElement).value;
  if (password.length < 8)  return sbpShowErr(err, 'Password must be at least 8 characters.');
  if (password !== confirm)  return sbpShowErr(err, 'Passwords do not match.');
  if (!(document.getElementById(`sbp${n}-agree`) as HTMLInputElement).checked)
    return sbpShowErr(err, 'Please agree to the Terms of Service and Privacy Policy.');
  btn.disabled = true;
  btn.textContent = 'Creating your account…';
  try {
    const res = await fetch(SBP_URL + '/functions/v1/manage-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SBP_ANON, 'apikey': SBP_ANON },
      body: JSON.stringify({ action: 'create', email, password }),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    const sb = getSbpClient();
    const { data: signInData, error: signInErr } = await sb.auth.signInWithPassword({ email, password });
    if (signInErr) throw new Error(signInErr.message);
    const uid   = signInData.user.id;
    const first = (document.getElementById(`sbp${n}-first`)   as HTMLInputElement).value.trim();
    const last  = (document.getElementById(`sbp${n}-last`)    as HTMLInputElement).value.trim();
    const comp  = (document.getElementById(`sbp${n}-company`) as HTMLInputElement).value.trim();
    await sb.auth.updateUser({ data: { full_name: first + ' ' + last } });
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    await sb.from('user_profiles').upsert(
      { id: uid, email, role: 'full_access', is_primary_owner: true, tenant_id: null, trial_ends_at: trialEnd },
      { onConflict: 'id' }
    );
    await sb.from('company_info').insert({ user_id: uid, company_name: comp, display_name: comp });
    const reasons = ['Cancel Maintaining Self','Cancel Sold House','Cancel Too Expensive','Cancel Unknown','Dropping Customer','Sold House']
      .map(nm => ({ name: nm, active: true, user_id: uid }));
    await sb.from('cancellation_reasons').insert(reasons);
    document.getElementById(`sbp${n}-step2`)!.style.display   = 'none';
    document.getElementById(`sbp${n}-success`)!.style.display = 'block';
    let secs = 4;
    const cd = document.getElementById(`sbp${n}-countdown`)!;
    cd.textContent = 'Redirecting in ' + secs + ' seconds…';
    const iv = setInterval(() => {
      secs--;
      if (secs <= 0) { clearInterval(iv); window.location.href = 'https://my.mowbosspro.com/dashboard.html'; }
      else cd.textContent = 'Redirecting in ' + secs + ' second' + (secs === 1 ? '' : 's') + '…';
    }, 1000);
  } catch (e: any) {
    sbpShowErr(err, e.message || 'Something went wrong. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Create My Account';
  }
}

function sbpShowErr(el: HTMLElement, msg: string) { el.textContent = msg; el.style.display = 'block'; }

function SignupForm({ n }: { n: number }) {
  return (
    <div id={`sbp-form-${n}`} className="sbp-form">
      <div className="sbp-form-header">
        <div className="sbp-form-title">Start Your 14-Day Free Trial</div>
        <div className="sbp-form-subtitle">No credit card required. Full access. Cancel anytime.</div>
        <button className="sbp-form-close" onClick={() => closeSignupModal(n)}>×</button>
      </div>
      <div id={`sbp${n}-step1`} className="sbp-form-body">
        <div id={`sbp${n}-err1`} className="sbp-err"></div>
        <div className="sbp-field-row">
          <div className="sbp-field-half">
            <label className="sbp-label">First Name</label>
            <input id={`sbp${n}-first`} type="text" placeholder="John" className="sbp-input" />
          </div>
          <div className="sbp-field-half">
            <label className="sbp-label">Last Name</label>
            <input id={`sbp${n}-last`} type="text" placeholder="Smith" className="sbp-input" />
          </div>
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Company Name</label>
          <input id={`sbp${n}-company`} type="text" placeholder="Smith Lawn Care" className="sbp-input" />
        </div>
        <div className="sbp-field-last">
          <label className="sbp-label">Email Address</label>
          <input id={`sbp${n}-email`} type="email" placeholder="you@yourcompany.com" className="sbp-input" />
        </div>
        <button onClick={() => sbpStep2(n)} className="btn-primary" style={{width:'100%', fontSize:'15px', padding:'13px'}}>
          Next: Create Password →
        </button>
      </div>
      <div id={`sbp${n}-step2`} className="sbp-form-body" style={{display:'none'}}>
        <div id={`sbp${n}-err2`} className="sbp-err"></div>
        <div className="sbp-trial-note">
          <div className="sbp-trial-note-title">14-Day Free Trial — No Credit Card Required</div>
          <div className="sbp-trial-note-sub">Full access to every feature. $79/month after trial.</div>
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Login Email</label>
          <input id={`sbp${n}-login-email`} type="email" readOnly className="sbp-input sbp-input-readonly" />
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Password</label>
          <input id={`sbp${n}-password`} type="password" placeholder="At least 8 characters" className="sbp-input" />
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Confirm Password</label>
          <input id={`sbp${n}-confirm`} type="password" placeholder="Repeat password" className="sbp-input" />
        </div>
        <div className="sbp-agree-row">
          <input type="checkbox" id={`sbp${n}-agree`} className="sbp-agree-check" />
          <label htmlFor={`sbp${n}-agree`} className="sbp-agree-label">
            I agree to the{' '}
            <a href="https://mowbosspro.com/terms" target="_blank" rel="noreferrer" className="sbp-link">Terms of Service</a>
            {' '}and{' '}
            <a href="https://mowbosspro.com/privacy-policy" target="_blank" rel="noreferrer" className="sbp-link">Privacy Policy</a>
          </label>
        </div>
        <button id={`sbp${n}-create-btn`} onClick={() => sbpCreateAccount(n)} className="btn-primary" style={{width:'100%', fontSize:'15px', padding:'13px'}}>
          Create My Account
        </button>
        <button className="sbp-btn-back" onClick={() => sbpBackToStep1(n)}>← Back</button>
      </div>
      <div id={`sbp${n}-success`} className="sbp-success-panel">
        <div className="sbp-success-icon">✓</div>
        <div className="sbp-success-title">You&#39;re In!</div>
        <div className="sbp-success-sub">Your 14-day free trial has started.<br />Taking you to your dashboard…</div>
        <div id={`sbp${n}-countdown`} className="sbp-countdown"></div>
      </div>
    </div>
  );
}

export default function LawnCareInvoicingSoftware() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !sbpOpenForm) return;
      const n = sbpOpenForm;
      if (document.getElementById('sbp-form-' + n)?.style.display !== 'block') return;
      if (document.getElementById(`sbp${n}-step2`)?.style.display === 'block') sbpCreateAccount(n);
      else sbpStep2(n);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <Navbar onTrialClick={(el) => openSignupModal(1, el)} />

      <div className="hero">
        <div className="hero-badge">Invoicing &amp; Payments for Mowing Crews</div>
        <h1>Lawn Care Invoicing &amp; Payments Software<br /><span>Built to Get Mowing Businesses Paid Faster</span></h1>
        <p>Cutting the grass is the easy part. Getting paid for every recurring visit, every week, without chasing checks is what breaks most mowing companies. MowBossPro turns each completed mow into an invoice automatically, stores customer cards on file, and collects the money for you &mdash; so the cash hits your account while you&apos;re still on the route.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">Auto</div><div className="hero-stat-lbl">Invoice Per Completed Mow</div></div>
          <div><div className="hero-stat-val">$79</div><div className="hero-stat-lbl">Flat Monthly — No Add-Ons</div></div>
          <div><div className="hero-stat-val">500+</div><div className="hero-stat-lbl">SMS Payment Reminders Included</div></div>
          <div><div className="hero-stat-val">2006</div><div className="hero-stat-lbl">In the Industry Since</div></div>
        </div>
      </div>

      {/* HERO IMAGE */}
      <div style={{background:'#0b2545', padding:'0 40px 60px', textAlign:'center'}}>
        <img
          src="/dashboard-mockup.webp"
          width={1200}
          height={800}
          fetchPriority="high"
          decoding="async"
          alt="MowBossPro lawn care invoicing software showing automatic invoices, card-on-file payments, and overdue tracking on a laptop with the crew mobile app on a phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Affordable Doesn&apos;t Mean Cheap.<br /><span>This Is Enterprise-Level Billing for Mowing.</span></h2>
        <p>$79/month sounds modest. But the billing engine inside MowBossPro is built to the same standard as software that costs 10 times more &mdash; the difference is we built it ourselves, for our own mowing routes, and we don&apos;t charge a percentage of every payment or bolt on a $200/month &quot;payments module.&quot; Every invoice, every card on file, every reminder is included.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">🧾</div><h4>Invoice On Job Complete</h4><p>The moment a crew marks a mow done in the field, MowBossPro generates the invoice with the right price, the right service, and the right customer attached. No end-of-week paperwork, no forgotten visits, no missed money.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔁</div><h4>Recurring Billing</h4><p>Weekly and bi-weekly mowing accounts bill themselves. Set the price once and MowBossPro invoices every visit on schedule for the whole season &mdash; you never re-key a single recurring charge.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💬</div><h4>Payment Reminders by Text</h4><p>Overdue invoices trigger automatic SMS reminders to the customer. No awkward phone calls, no &quot;did you get my invoice&quot; emails &mdash; the software does the collecting for you, politely and on time.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Stripe Card-on-File</h4><p>Store a card for every mowing account and charge it automatically after each visit. Customers can also tap a link and pay an invoice in seconds. Every dollar collected shows up in one place.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📊</div><h4>Money-Owed Reports</h4><p>See exactly who owes you, how much, and how overdue at a glance. Filter by unpaid, partial, paid, or overdue so you always know your real cash position &mdash; not a guess from a shoebox of receipts.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📱</div><h4>Billing From the Truck</h4><p>Your crew completes the mow on the mobile app and the invoice fires off without anyone in the office lifting a finger. Billing happens at the curb, not three days later when someone gets to it.</p></div>
        </div>
      </div>

      {/* INVOICE FLOW */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Mow → Invoice → Paid</span>
            <h2 style={{color:'#fff'}}>Every Completed Mow Turns Into an Invoice Automatically.</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>This is the heart of MowBossPro billing. When a crew taps &quot;complete&quot; on a mowing stop, the software instantly builds the invoice, attaches it to the customer, and either charges their card on file or sends them a pay-by-link text. The visit and the money are one connected action &mdash; not two jobs you have to remember to do. For the full walkthrough, read <a href="/blogs/lawn-care-invoicing-software-complete-guide" style={{color:'#7fb0ff', fontWeight:600}}>Lawn Care Invoicing &amp; Payments Software: The Complete Guide for Mowing Businesses</a>.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>Invoice generated the second a mow is marked complete</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Correct service and price pulled from the account automatically</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Card on file charged or pay-by-link text sent instantly</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Recurring weekly and bi-weekly visits bill on schedule</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Overdue invoices trigger automatic reminder texts</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Every payment, method, and date tracked in one ledger</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>No end-of-week billing session &mdash; it&apos;s already done</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Cuts the time between mowing and getting paid to near zero</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Today — Invoices Sent</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Weekly Mow · 123 Oak St</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Card on file · charged automatically</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Paid $45</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#7fb0ff', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Bi-Weekly Mow · 88 Maple Ave</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Pay-by-link text sent</div></div>
              <div style={{marginLeft:'auto', background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Sent $50</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#b22234', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Weekly Mow · 47 Birch Ln</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Reminder #2 auto-sent</div></div>
              <div style={{marginLeft:'auto', background:'#b22234', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Overdue $45</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#7fb0ff', fontSize:'16px', fontWeight:700}}>Mow it, and it&apos;s billed.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>No end-of-week paperwork pile.</div>
            </div>
          </div>
        </div>
      </section>

      {/* EASIER TO USE */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto 56px'}}>
          <span className="section-label">Simplicity</span>
          <h2 className="section-title">The Most Capable Mowing Billing Software Is Also the Easiest to Run</h2>
          <p className="section-sub" style={{maxWidth:'720px'}}>Most billing software is built for accountants. MowBossPro is built for the person who actually pushes the mower &mdash; or runs the crews that do. Connect Stripe, set your prices, and you&apos;re invoicing the same afternoon. No bookkeeper required.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Connect Stripe in One Afternoon', body:'Link your Stripe account, import your mowing customers and their recurring visit prices, and you can collect a real payment the same day you sign up. No merchant-account paperwork, no implementation consultant, no 90-day setup timeline.'},
            {n:'02', title:'One Screen Runs Billing', body:'Invoices, payments, money owed, and overdue reminders all live in one connected view. You\'re not jumping between QuickBooks, a card reader, and a spreadsheet. Open the billing board and the whole money side of your mowing business is right there.'},
            {n:'03', title:'Your Crew Just Taps Complete', body:'Crews never touch billing. They tap "complete" on the mow in the mobile app, and the invoice and charge happen behind the scenes. No training on accounting, no IT ticket, no mistakes from the field.'},
            {n:'04', title:'Collections Run Without You', body:'Set up your payment reminder texts once. After that, MowBossPro chases every overdue mowing invoice automatically &mdash; whether you\'re on a route, at home, or asleep. You stop being the person who makes the uncomfortable call.'},
          ].map(({n, title, body}) => (
            <div key={n} style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'30px 26px'}}>
              <div style={{fontSize:'40px', fontWeight:800, color:'#b22234', opacity:.25, lineHeight:1, marginBottom:'12px'}}>{n}</div>
              <h3 style={{fontSize:'17px', fontWeight:700, color:'var(--text)', marginBottom:'8px'}}>{title}</h3>
              <p style={{color:'var(--muted)', fontSize:'14px', lineHeight:1.6}}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* THE PROBLEM */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">The Problem</span>
          <h2 className="section-title">Generic Billing Wasn&apos;t Built for Recurring Mowing</h2>
          <p className="section-sub">Mowing isn&apos;t a one-off invoice. You&apos;re billing the same hundreds of yards every single week, all season, and a few dollars slipping through the cracks on each one adds up to thousands by fall. Generic accounting software has no idea what a recurring weekly mow even is.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid #b22234'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we were running our own mowing routes, we lost money every week to billing we forgot, visits we didn&apos;t invoice, and customers we never got around to chasing. We tried every accounting tool out there. None of them understood what it meant to have <strong>300 yards on a weekly cycle</strong> and need every single completed mow to bill itself the instant the crew finished.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>They don&apos;t do that, because they weren&apos;t built by someone who runs a mowing business. <strong>We were.</strong> We&apos;ve been in this industry since 2006, and MowBossPro is the billing system we always wished existed.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every part of the invoicing engine exists because we lost real money without it. Not because a product manager in a tech office thought it sounded nice. To see how it all fits together with scheduling and dispatch, take a look at the full <a href="/" style={{color:'#b22234', fontWeight:600}}>MowBossPro</a> platform.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Built for Mowing Billing</span>
          <h2 className="section-title">Invoicing &amp; Payment Features Designed Around Your Route</h2>
          <p className="section-sub">Every billing tool in MowBossPro was built with recurring mowing in mind &mdash; not adapted from a generic accounting app and called good enough.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'🧾', title:'Auto-Invoice on Completion', body:'The second a crew marks a mow complete, MowBossPro builds the invoice with the right service and price and attaches it to the customer. No visit ever goes unbilled because someone forgot to write it down.'},
            {icon:'🔁', title:'Recurring Visit Billing', body:'Weekly and bi-weekly mowing accounts invoice themselves on schedule for the whole season. Set the price once and every visit bills automatically &mdash; you never re-enter a recurring charge.'},
            {icon:'💳', title:'Card-on-File Charging', body:'Store a card for each mowing account through Stripe and charge it automatically after every visit. The money is collected before you&apos;ve even left the neighborhood.'},
            {icon:'🔗', title:'Pay-by-Link Texts', body:'Customers who prefer to pay manually get a one-tap payment link by text. They settle the invoice in seconds from their phone &mdash; no logins, no portals, no friction.'},
            {icon:'💬', title:'Automated Payment Reminders', body:'Overdue mowing invoices trigger an automatic sequence of reminder texts. MowBossPro does the collecting so you never make an uncomfortable phone call again.'},
            {icon:'📄', title:'Invoice Management', body:'Filter every invoice by unpaid, partial, paid, or overdue. Full payment history, method, and date tracked on each one. Your whole receivables picture in a single list.'},
            {icon:'💰', title:'Estimates That Become Invoices', body:'Build a mowing estimate, email it, and let the customer accept with one tap. Accepted estimates convert straight into the recurring billing schedule with no re-keying.'},
            {icon:'📊', title:'Money-Owed Dashboard', body:'See total outstanding, what&apos;s overdue, and today&apos;s collected revenue the moment you log in. Know your real cash position at a glance, every day.'},
            {icon:'🏷️', title:'Discounts &amp; Sales Tax', body:'Apply percentage or fixed-dollar discounts to any mowing invoice, and set sales tax by jurisdiction. MowBossPro calculates and tracks tax on every invoice automatically.'},
            {icon:'📱', title:'Billing From the Mobile App', body:'Crews complete the mow on their phone and the invoice fires off instantly. Billing happens in the field, the moment the work is done &mdash; not days later in the office.'},
            {icon:'🏠', title:'Per-Property Billing History', body:'Every property carries its own billing record: every mow invoiced, every payment, every balance. Tied to the address, not just the customer name.'},
            {icon:'⭐', title:'Review Requests After Payment', body:'Once a customer pays, MowBossPro can automatically send a Google review request. Turn a completed, paid mow into your next five-star review without lifting a finger.'},
            {icon:'🔔', title:'Payment Alerts', body:'Get notified the instant a payment clears, a card declines, or an invoice goes overdue. You always know the status of your money in real time.'},
            {icon:'🧮', title:'Partial Payments &amp; Balances', body:'Take partial payments on larger mowing jobs and let MowBossPro track the running balance automatically until the invoice is settled in full.'},
            {icon:'👥', title:'Customer Billing Profiles', body:'Every mowing customer has a billing profile: card on file, recurring schedule, balance, and full invoice history &mdash; all in one searchable record.'},
            {icon:'📅', title:'Season-Long Billing Schedules', body:'Map out the entire mowing season per account. MowBossPro knows exactly which visits to bill and when, from the first spring cut to the last fall mow.'},
            {icon:'🧾', title:'Branded Invoices', body:'Your company name, logo, and contact details on every invoice. Customers see a professional bill from your mowing business, not a generic template.'},
            {icon:'🔐', title:'Role-Based Billing Access', body:'Owner, Manager, and Office roles control who can see revenue, issue refunds, or edit prices. Crews never see the money side at all.'},
            {icon:'⏱️', title:'Crew Hour Tracking', body:'Track crew hours per mowing job and pull payroll-ready reports. Know your labor cost against what you billed before payday.'},
            {icon:'🚛', title:'Per-Visit Job Records', body:'Every invoice ties back to the exact visit, crew, and truck that did the mow &mdash; so you always know what you billed for and who did it.'},
            {icon:'💵', title:'Daily Revenue Reporting', body:'Custom dashboard cards show today&apos;s collected revenue, invoices sent, and outstanding balance &mdash; a live read on the cash flowing through your mowing business.'},
            {icon:'👥', title:'Unlimited Users', body:'Add every office staff member and crew lead at no extra cost. No per-seat fees. Unlimited users included in the flat $79/month rate.'},
            {icon:'🏢', title:'Unlimited Customers &amp; Invoices', body:'No caps on customers, properties, or invoices. Whether you bill 50 yards a week or 5,000 &mdash; MowBossPro handles it all at the same flat price.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RECURRING BILLING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Recurring Mowing Billing</span>
            <h2>Bill an Entire Season of Weekly Mows Without Touching an Invoice</h2>
            <p>This is the feature that pays for the software ten times over. Set a mowing account&apos;s price and cadence once, and MowBossPro invoices every visit for the whole season automatically &mdash; weekly, bi-weekly, or whatever you run. The crew mows, the invoice goes out, the card gets charged, and you see the money land. For the complete breakdown of how recurring invoicing and payments work end to end, read <a href="/blogs/lawn-care-invoicing-software-complete-guide" style={{color:'#b22234', fontWeight:600}}>Lawn Care Invoicing &amp; Payments Software: The Complete Guide for Mowing Businesses</a>.</p>
            <ul className="check-list">
              <li>Set price and cadence once per mowing account</li>
              <li>Every weekly or bi-weekly visit bills automatically</li>
              <li>Card on file charged the moment the mow completes</li>
              <li>Pay-by-link texts for customers who pay manually</li>
              <li>Overdue invoices chase themselves with reminder texts</li>
              <li>Pause or skip billing for rain-outs and holds in one click</li>
              <li>Season-long schedule from first spring cut to last fall mow</li>
              <li>Summary bar: invoiced, collected, and outstanding for the day</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Recurring Accounts — This Week</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Weekly Mow</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>184 accounts on card-on-file</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$8,280 auto</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#7fb0ff', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Bi-Weekly Mow</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>61 accounts on pay-by-link</div></div>
              <div style={{marginLeft:'auto', background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$3,050 sent</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#b22234', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Overdue Mows</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>9 accounts · reminders running</div></div>
              <div style={{marginLeft:'auto', background:'#b22234', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$405 due</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#b22234', fontSize:'16px', fontWeight:700}}>Set it once. Bill all season.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>No weekly invoicing session, ever.</div>
            </div>
          </div>
        </div>
      </section>

      {/* PAYMENTS */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Payments &amp; Collections</span>
            <h2>Get Paid for Every Mow Without Chasing a Single Customer</h2>
            <p>Cash flow is what kills mowing companies, not a lack of yards. MowBossPro collects automatically: cards on file charge after each visit, pay-by-link texts go to the rest, and overdue invoices chase themselves with reminders. You stop being the bill collector and go back to running the route.</p>
            <ul className="check-list">
              <li>Stripe card-on-file charged after each completed mow</li>
              <li>One-tap pay-by-link texts for manual payers</li>
              <li>Automatic overdue reminder text sequences</li>
              <li>Partial payments and running balances tracked</li>
              <li>Every payment, method, and date logged in one ledger</li>
              <li>Instant alerts on cleared payments and declined cards</li>
              <li>Money-owed report ready for any day of the week</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Collections — June 2026</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>1,042</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Invoices Sent</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>968</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Paid Same Week</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#22c55e', fontSize:'20px', fontWeight:700}}>$46.8K</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Collected</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#b22234', fontSize:'20px', fontWeight:700}}>$3.3K</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Outstanding</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Weekly Mow · 212 Elm St</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Card on file · auto-charged</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$45</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#7fb0ff', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Bi-Weekly Mow · 9 Cedar Ct</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Pay-by-link · paid in 4 min</div></div>
              <div style={{background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$50</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Pricing</span>
          <h2 className="section-title">One Flat Price. Every Invoice Included.</h2>
          <p className="section-sub">We were paying for software that took a cut of every payment and charged extra for a &quot;payments add-on.&quot; We built MowBossPro to be the pricing we always wished existed.</p>
        </div>
        <div style={{maxWidth:'520px', margin:'0 auto'}}>
          <div className="lc-price-card featured">
            <div className="featured-badge">Everything Included</div>
            <div className="price-tier">One Plan. No Surprises.</div>
            <div style={{fontSize:'48px', fontWeight:800, color:'var(--text)', lineHeight:1}}><sup style={{fontSize:'22px', verticalAlign:'super'}}>$</sup>129</div>
            <div style={{color:'var(--muted)', fontSize:'13px', marginBottom:'24px', marginTop:'4px'}}>per month</div>
            <div style={{color:'var(--muted)', fontSize:'14px', marginBottom:'24px', lineHeight:1.5}}>Every feature. Unlimited customers, properties, and invoices. No tiers, no payment-percentage cut, no per-seat fees.</div>
            <ul className="price-features">
              <li>Unlimited Customers, Properties &amp; Invoices</li>
              <li>Unlimited Employees &amp; Users</li>
              <li>Auto-Invoice on Mow Completion</li>
              <li>Recurring Weekly &amp; Bi-Weekly Billing</li>
              <li>Stripe Card-on-File &amp; Pay-by-Link</li>
              <li>Automated Payment Reminder Texts</li>
              <li>Money-Owed &amp; Revenue Reports</li>
              <li>Estimates, Discounts &amp; Sales Tax</li>
              <li>Mobile App for Crews</li>
              <li>500 Outbound SMS/month included</li>
              <li>+$15 per additional 500 SMS after that</li>
            </ul>
            <button onClick={(e) => openSignupModal(2, e.currentTarget as HTMLElement)} className="price-btn price-btn-primary">Start Your 14-Day Free Trial</button>
          </div>
        </div>
        <p style={{textAlign:'center', color:'var(--muted)', fontSize:'13px', marginTop:'32px'}}>No contracts. Cancel anytime. No hidden fees — ever.</p>
      </section>

      {/* FAQ */}
      <section style={{background:'#fff'}}>
        <div style={{maxWidth:'860px', margin:'0 auto', padding:'80px 40px'}}>
          <span className="section-label">FAQ</span>
          <h2 className="section-title" style={{marginBottom:'48px'}}>Lawn Care Invoicing &amp; Payments — Common Questions</h2>
          {[
            {q:'Does MowBossPro invoice each mow automatically?', a:'Yes. The moment a crew marks a mowing stop complete in the mobile app, MowBossPro generates the invoice with the correct service and price and attaches it to the customer. No visit ever goes unbilled because someone forgot to write it down at the end of the week.'},
            {q:'Can it handle recurring weekly and bi-weekly billing?', a:'Yes. Set a mowing account\'s price and cadence once and MowBossPro invoices every visit on schedule for the whole season. Weekly, bi-weekly, or a custom cycle &mdash; you never re-enter a recurring charge by hand.'},
            {q:'How do customers actually pay?', a:'Two ways, both built in through Stripe. You can store a card on file and charge it automatically after each mow, or send a one-tap pay-by-link text that lets the customer settle the invoice from their phone in seconds. Most accounts are on card-on-file so the money collects itself.'},
            {q:'What happens when an invoice goes overdue?', a:'MowBossPro automatically sends a sequence of reminder texts to the customer until the mowing invoice is paid. You never have to make the uncomfortable phone call &mdash; the software handles collections politely and on time.'},
            {q:'Does it replace QuickBooks and a separate card reader?', a:'For your mowing billing, yes. MowBossPro replaces spreadsheet invoicing, manual card processing, and reminder emails in one platform connected to your scheduling and dispatch. Most owners are collecting real payments the same day they sign up.'},
            {q:'How much does MowBossPro cost?', a:'$79/month, all features included. No per-user fees, no add-on for payments, and no percentage cut of what you collect beyond standard Stripe processing. 14-day free trial with no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>Invoicing and payments are just one piece &mdash; MowBossPro also runs your scheduling, routing, dispatch, and crew app from the same platform. <a href="/" style={{color:'#b22234', fontWeight:600}}>See the full MowBossPro overview</a>.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Chasing Checks for Mows<br />You Already Finished.</h2>
        <p>MowBossPro turns every completed mow into an invoice and collects the money for you &mdash; built by someone who actually ran a mowing route. Try it free for 14 days.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(3, e.currentTarget as HTMLElement); }} className="btn-primary" style={{fontSize:'17px', padding:'18px 44px'}}>Start Your 14-Day Free Trial</a>
        </div>
      </div>

      <div id="sbp-backdrop" className="sbp-backdrop" onClick={() => closeAllModals()}></div>
      <SignupForm n={1} />
      <SignupForm n={2} />
      <SignupForm n={3} />
    </>
  );
}
