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

export default function LawnCareSoftware() {
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
        <div className="hero-badge">Built Specifically for Lawn Mowing Businesses</div>
        <h1>Lawn Care Software<br /><span>Built for How Mowing Crews Actually Run</span></h1>
        <p>Most field service software is built for plumbers and HVAC crews. <a href="/">MowBossPro</a> is built from the ground up for lawn mowing businesses &mdash; the way you schedule recurring visits, route your crews, dispatch trucks, and bill for weekly cuts is completely different, and your software should be too.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">Routes</div><div className="hero-stat-lbl">Built on the Map in Minutes</div></div>
          <div><div className="hero-stat-val">$79</div><div className="hero-stat-lbl">Flat Monthly &mdash; No Add-Ons</div></div>
          <div><div className="hero-stat-val">500+</div><div className="hero-stat-lbl">SMS Alerts Included Monthly</div></div>
          <div><div className="hero-stat-val">2006</div><div className="hero-stat-lbl">In the Industry Since</div></div>
        </div>
      </div>

      {/* HERO IMAGE */}
      <div style={{background:'var(--purple-dark)', padding:'0 40px 60px', textAlign:'center'}}>
        <img
          src="/dashboard-mockup.webp"
          width={1200}
          height={800}
          fetchPriority="high"
          decoding="async"
          alt="MowBossPro lawn care software dashboard on laptop showing route builder and weekly mowing schedule, with crew mobile app on phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Affordable Doesn&apos;t Mean Cheap.<br /><span>This Is Enterprise-Level Lawn Care Software.</span></h2>
        <p>$79/month sounds modest. But what you&apos;re getting isn&apos;t modest at all. MowBossPro is built to the same standard as software that costs 10 times more &mdash; the difference is we built it ourselves, for ourselves, and we don&apos;t have a sales team, investor overhead, or a $500/month add-on for every feature you actually need to run mowing routes. New here? Start with <a href="/blogs/lawn-care-software-complete-guide">Lawn Care Software: The Complete Guide for Lawn Mowing Businesses</a>.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">🗺️</div><h4>Route Intelligence</h4><p>Live route maps, drag-and-drop stop ordering, and geographic clustering so your mowing crews drive less and cut more. Tighten every route on the map before a truck ever leaves the yard.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔁</div><h4>Recurring Visit Engine</h4><p>Weekly, biweekly, and every-other-week mowing schedules generate themselves. Set the cadence once and MowBossPro builds every future visit, keeps each property on its day, and never lets a cut slip.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💬</div><h4>Communication Suite</h4><p>Two-way SMS inbox, 10+ automated alert types, estimate follow-up sequences, payment reminders, review requests &mdash; all built in at the flat price. No Twilio account, no Mailchimp, no third-party setup.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Stripe Payments</h4><p>Cards on file, invoicing, charge after the cut, payment tracking, overdue reports &mdash; the full Stripe integration is wired in. Your customers can pay instantly and you can see every dollar collected in one place.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔐</div><h4>Role-Based Access</h4><p>Owner, Manager, Office Staff, Crew Lead, and Mobile-only roles. Granular permission control so your mowing crews only see what they need and your office manager can&apos;t accidentally delete a client record.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📱</div><h4>Mobile App for Your Crew</h4><p>Your crews get a mobile-optimized dashboard with their mowing stops for the day. Complete, skip, reschedule, and add notes &mdash; all from the truck without calling the office once.</p></div>
        </div>
      </div>

      {/* LASSO */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Lasso — Circle Map Scheduling</span>
            <h2 style={{color:'#fff'}}>Draw a Circle on the Map. See Every Lawn Inside It.</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>Lasso is the fastest way to build a mowing route we&apos;ve ever seen. Draw a circle on your service area map and MowBossPro instantly surfaces every property inside that radius that&apos;s due for a cut &mdash; with stop count, square footage, and estimated revenue all calculated in real time before you commit to a single schedule.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>Draw any size circle on the map &mdash; instantly see all lawns inside</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Breaks out stops, sq ft, and revenue automatically</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Shows you what&apos;s already scheduled vs. what&apos;s still waiting for a cut</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>One click to schedule all selected lawns to a date and crew</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Tighten your routes geographically &mdash; no more scattered stops burning fuel</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Keeps recurring weekly customers grouped on the same route day</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Cuts route-building time from an hour to under 5 minutes</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>No competitor has this. It doesn&apos;t exist anywhere else in lawn care software.</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Lasso — Route Selector</div>
            <div style={{background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'10px', padding:'20px', marginBottom:'14px', position:'relative', minHeight:'130px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
              <div style={{position:'absolute', top:'14px', left:'18px', right:'18px', bottom:'14px', border:'2.5px dashed #b22234', borderRadius:'50%', opacity:.7}}></div>
              <div style={{display:'flex', gap:'12px', flexWrap:'wrap', justifyContent:'center', position:'relative', zIndex:1}}>
                {['s','s','u','s','s','s','u','s','s','u','s','s','s','u','s','s','s','u','s'].map((t,i) => (
                  <div key={i} style={{width:'11px', height:'11px', borderRadius:'50%', flexShrink:0, background: t==='s' ? '#b22234' : 'rgba(255,255,255,.2)', boxShadow: t==='s' ? '0 0 0 3px rgba(178,34,52,.3)' : 'none'}}></div>
                ))}
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#b22234', fontSize:'18px', fontWeight:800}}>14</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Stops Selected</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#b22234', fontSize:'18px', fontWeight:800}}>19</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Lawns in Radius</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#b22234', fontSize:'18px', fontWeight:800}}>118,400</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Sq Ft (Turf)</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#b22234', fontSize:'18px', fontWeight:800}}>$1,260</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Est. Route Revenue</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', gridColumn:'span 2'}}>
                <div style={{color:'#fff', fontSize:'13px', fontWeight:600}}>Weekly Mow · 8 &nbsp;|&nbsp; Biweekly · 4 &nbsp;|&nbsp; Trim &amp; Edge · 2</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Breakdown by Visit Type</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EASIER TO USE */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto 56px'}}>
          <span className="section-label">Simplicity</span>
          <h2 className="section-title">The Most Capable Lawn Care Software Is Also the Easiest to Learn</h2>
          <p className="section-sub" style={{maxWidth:'720px'}}>Most powerful software is complicated. MowBossPro is the exception. Every screen was designed by people who ran mowing routes &mdash; not UX designers who&apos;ve never sat behind a mower. Your crew will be using it confidently on day one.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Set Up in One Afternoon', body:'Add your services, import your clients and properties, set your recurring mow cadences, turn on automated alerts, and connect Stripe &mdash; most owners are fully operational the same day they sign up. No implementation consultant, no onboarding call, no 90-day setup timeline.'},
            {n:'02', title:'One Screen Does Everything', body:'Scheduling, dispatch, the job board, and the route map are all connected. You’re not jumping between five different modules or browser tabs. Pull up the dispatch board and everything your crews need for the day is right there in a single view.'},
            {n:'03', title:'Your Crews Learn It in Minutes', body:'The mobile app your crews use shows them exactly what they need and nothing they don’t. Their mowing stops for the day, the property info, the gate codes and notes, and the complete button. No training videos, no IT ticket, no frustrated crew members.'},
            {n:'04', title:'Automation Runs Without You', body:'Set up your SMS alerts, estimate follow-ups, and payment reminders once. After that, MowBossPro handles every notification, every follow-up, and every review request automatically &mdash; whether you’re on a route, at home, or on vacation.'},
          ].map(({n, title, body}) => (
            <div key={n} style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'30px 26px'}}>
              <div style={{fontSize:'40px', fontWeight:800, color:'var(--orange)', opacity:.25, lineHeight:1, marginBottom:'12px'}}>{n}</div>
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
          <h2 className="section-title">Generic Software Wasn&apos;t Built for Mowing Routes</h2>
          <p className="section-sub">Lawn mowing is not plumbing. You&apos;re not sending one tech to one job for two hours. You&apos;re running recurring weekly routes across hundreds of properties, juggling crews and trucks, and managing a job board of new lawns that never stops growing.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we were running our own mowing routes, we tried every piece of software out there. The big names, the small names, the ones built for &quot;field service.&quot; None of them understood what it meant to have <strong>800 lawns on a recurring schedule</strong> and need to re-route an entire crew the morning rain pushes everything a day.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>They don&apos;t handle that. Because they weren&apos;t built by someone who runs a mowing business. <strong>We were.</strong> We&apos;ve been in this industry since 2006, and MowBossPro is the software we always wished existed.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every feature in MowBossPro exists because we needed it on a real mowing route. Not because a product manager in a tech office decided it sounded good.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Built for Mowing</span>
          <h2 className="section-title">Features Designed Around Your Operation</h2>
          <p className="section-sub">Every tool in MowBossPro was built with mowing workflows in mind &mdash; not adapted from a plumbing app and called good enough.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'🔁', title:'Recurring Mow Scheduling', body:'Set a lawn to weekly, biweekly, or every-other-week and MowBossPro generates every future visit automatically. Each property stays on its assigned route day and crew without you rebuilding the schedule each week.'},
            {icon:'🗺️', title:'Live Route Map', body:'See every scheduled mowing stop pinned on an interactive map. Drag to reorder stops, build tight geographic routes, and cut drive time before your crew ever leaves the yard.'},
            {icon:'📋', title:'Square Footage for New Lawns', body:'Every new mowing prospect lands on a job board with stop count and square footage. See exactly how much new work you can slot into an existing route before you make a single call.'},
            {icon:'🚛', title:'Crew Dispatch Board', body:'Assign every stop to a crew and truck for the day. The dispatch board shows each crew’s full route in order so nobody starts the morning wondering where to go first.'},
            {icon:'💬', title:'Automated Service Alerts', body:'Automatically text customers when their mow is scheduled, when the crew is on the way, and when the job is done. Set it once &mdash; MowBossPro handles the communication for every single stop.'},
            {icon:'💰', title:'Estimates That Close', body:'Build a mowing estimate in minutes with your service catalog, email it directly from the platform, and let clients accept with one click. Auto-follow-ups go out if they don’t respond.'},
            {icon:'💳', title:'Card-on-File Payments', body:'Store cards on file via Stripe. Charge after each cut, send invoices, and collect payments without chasing anyone down. Every dollar tracked in one place.'},
            {icon:'📱', title:'Mobile App for Crews', body:'Your crews get a mobile-optimized view of their mowing stops for the day. Mark jobs complete, skip, or reschedule &mdash; right from the truck without calling the office.'},
            {icon:'🏠', title:'Property Profiles', body:'Every property has its own record &mdash; square footage, mow history, gate codes, crew notes, GPS coordinates, and photos. Everything tied to the address, not just the customer.'},
            {icon:'💬', title:'Two-Way SMS Inbox', body:'Send and receive text messages with customers directly inside MowBossPro. Full conversation history organized by contact &mdash; no more switching to your personal phone.'},
            {icon:'⭐', title:'Automated Review Requests', body:'After every completed mow, MowBossPro automatically sends a Google review request to the customer &mdash; on your schedule, every time, without you lifting a finger.'},
            {icon:'🔁', title:'Estimate Follow-Up Sequences', body:'3 automated follow-up texts go out if a client doesn’t respond to your mowing estimate. Let MowBossPro chase the deal so you don’t have to.'},
            {icon:'💳', title:'Payment Follow-Up Sequences', body:'Unpaid invoices trigger 3 automated payment reminder texts. Collect what you’re owed without making uncomfortable calls.'},
            {icon:'👥', title:'Client & Lead Management', body:'Manage existing clients and active prospects side by side. Track estimates, mow history, and notes all tied to each contact &mdash; with a full searchable database.'},
            {icon:'📄', title:'Invoice Management', body:'Convert accepted estimates to invoices instantly. Filter by unpaid, partial, paid, or overdue. Every dollar tracked with full payment history, method, and date.'},
            {icon:'🏷️', title:'Discount Codes & Sales Tax', body:'Apply percentage or fixed-dollar discounts to any estimate. Set sales tax rates by jurisdiction and let MowBossPro calculate and track tax on every invoice automatically.'},
            {icon:'👑', title:'Role-Based Access', body:'Owner, Manager, Office, Crew Lead, and Mobile roles. Control exactly what each person on your team can see and do &mdash; from full access down to field-only.'},
            {icon:'🚛', title:'Truck & Equipment Management', body:'Create truck profiles, assign crews to trucks, and track which truck handled each stop. Know exactly what’s on every truck every day.'},
            {icon:'⏱️', title:'Employee Hour Tracking', body:'Track crew hours per job and generate payroll-ready reports. Know exactly what you owe before payday without running a separate system.'},
            {icon:'📊', title:'Dashboard & Reports', body:'Custom stat cards on your dashboard show today’s revenue, mows completed, properties served, money owed, and more &mdash; all at a glance the moment you log in.'},
            {icon:'🔔', title:'10+ Automated Alert Types', body:'Mow scheduled, completed, skipped, rescheduled, estimate sent, estimate accepted, review request, payment declined, inbound text &mdash; all automated, all customizable.'},
            {icon:'👥', title:'Unlimited Users', body:'Add every crew member, office staff member, and crew lead at no extra cost. No per-seat fees. Unlimited users are included in the flat $79/month rate.'},
            {icon:'🏢', title:'Unlimited Clients & Properties', body:'No caps on clients, properties, or leads. Whether you have 50 lawns or 5,000 &mdash; MowBossPro handles it all at the same flat price.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCHEDULING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Mowing Scheduling</span>
            <h2>Know Exactly What&apos;s Due Before You Send a Single Crew Out</h2>
            <p>This is where MowBossPro earns its keep. Recurring schedules generate every future mow automatically, and the job board shows you the new lawns ready to slot into a route &mdash; with stop counts and square footage &mdash; so you know exactly how much you can fit in a day before you start dispatching. For a closer look at how recurring scheduling and the route map work together as the daily hub for a mowing business, read <a href="/blogs/lawn-care-software-complete-guide" style={{color:'var(--orange)', fontWeight:600}}>Lawn Care Software: The Complete Guide for Lawn Mowing Businesses</a>.</p>
            <ul className="check-list">
              <li>Recurring weekly, biweekly &amp; monthly mow cadences</li>
              <li>Job board of new lawns with sq ft and stop counts</li>
              <li>Schedule directly from the job board in one click</li>
              <li>Assign date, crew, and truck at scheduling time</li>
              <li>Full dispatch board for the day&apos;s scheduled mows</li>
              <li>Drag-and-drop route reordering on the map</li>
              <li>Mark stops complete, skipped, or rescheduled from the field</li>
              <li>Summary bar: total stops, sq ft, revenue for the day</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Today&apos;s Routes — By Crew</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Crew A — North Route</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>22 weekly mows</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>384,200 ft²</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#b22234', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Crew B — East Route</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>18 weekly mows</div></div>
              <div style={{marginLeft:'auto', background:'#b22234', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>246,500 ft²</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#7fb0ff', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Crew C — South Route</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>14 biweekly mows</div></div>
              <div style={{marginLeft:'auto', background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>118,000 ft²</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Square Footage — New Lawns</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>15 properties ready to route</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>42,300 ft²</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#b22234', fontSize:'16px', fontWeight:700}}>Know before you dispatch.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>No other lawn care software shows you this.</div>
            </div>
          </div>
        </div>
      </section>

      {/* DISPATCH */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Crews &amp; Dispatch</span>
            <h2>Dispatch Every Crew and Reroute the Whole Day in Seconds</h2>
            <p>Rain pushes the week. A mower goes down. A customer wants their cut moved. MowBossPro makes the messy parts of running mowing crews simple &mdash; reassign stops between crews, slide a route to tomorrow, and the dispatch board updates instantly for everyone in the field.</p>
            <ul className="check-list">
              <li>Assign every stop to a crew and truck for the day</li>
              <li>Drag stops between crews to balance the workload</li>
              <li>Reschedule a whole route to a new day in one move</li>
              <li>Crews see updates live in the mobile app</li>
              <li>Track who completed each stop and when</li>
              <li>Skip-and-reschedule handling for rained-out days</li>
              <li>Print or text dispatch sheets to each crew lead</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Dispatch Board — This Week</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>218</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Mows Scheduled</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>134</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Completed</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#b22234', fontSize:'20px', fontWeight:700}}>4</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Active Crews</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#b22234', fontSize:'20px', fontWeight:700}}>$14,820</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Week Revenue</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Crew A · Stop 12 of 22</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>On route · last update 9:41 AM</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>On time</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#b22234', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Crew B · Rerouted from Tue</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Rain delay · moved 6 stops</div></div>
              <div style={{background:'#b22234', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Updated</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Pricing</span>
          <h2 className="section-title">One Flat Price. Everything Included.</h2>
          <p className="section-sub">We were paying $500&ndash;$700 a month for software that nickel-and-dimed us. We built MowBossPro to be the pricing we always wished existed.</p>
        </div>
        <div style={{maxWidth:'520px', margin:'0 auto'}}>
          <div className="lc-price-card featured">
            <div className="featured-badge">Everything Included</div>
            <div className="price-tier">One Plan. No Surprises.</div>
            <div style={{fontSize:'48px', fontWeight:800, color:'var(--text)', lineHeight:1}}><sup style={{fontSize:'22px', verticalAlign:'super'}}>$</sup>79</div>
            <div style={{color:'var(--muted)', fontSize:'13px', marginBottom:'24px', marginTop:'4px'}}>per month</div>
            <div style={{color:'var(--muted)', fontSize:'14px', marginBottom:'24px', lineHeight:1.5}}>Every feature. Unlimited clients, properties, crews, and users. No tiers, no locked features, no per-seat fees.</div>
            <ul className="price-features">
              <li>Unlimited Clients, Properties &amp; Leads</li>
              <li>Unlimited Crews &amp; Users</li>
              <li>Full Scheduling, Dispatch &amp; Route Map</li>
              <li>Recurring Weekly &amp; Biweekly Mow Cadences</li>
              <li>Square Footage for New Lawns</li>
              <li>Estimates, Invoices &amp; Stripe Payments</li>
              <li>Two-Way SMS &amp; Automated Alerts</li>
              <li>Crew Dispatch &amp; Live Route Map</li>
              <li>Mobile App for Crews</li>
              <li>500 Outbound SMS/month included</li>
              <li>+$15 per additional 500 SMS after that</li>
            </ul>
            <button onClick={(e) => openSignupModal(2, e.currentTarget as HTMLElement)} className="price-btn price-btn-primary">Start Your 14-Day Free Trial</button>
          </div>
        </div>
        <p style={{textAlign:'center', color:'var(--muted)', fontSize:'13px', marginTop:'32px'}}>No contracts. Cancel anytime. No hidden fees &mdash; ever.</p>
      </section>

      {/* FAQ */}
      <section style={{background:'#fff'}}>
        <div style={{maxWidth:'860px', margin:'0 auto', padding:'80px 40px'}}>
          <span className="section-label">FAQ</span>
          <h2 className="section-title" style={{marginBottom:'48px'}}>Lawn Care Software &mdash; Common Questions</h2>
          {[
            {q:'Is MowBossPro built for lawn mowing businesses?', a:'Yes. MowBossPro handles the full mowing operation: recurring weekly and biweekly scheduling, map-based route building, crew dispatch, estimate-to-service conversion, automated customer SMS, and card-on-file payments. It’s designed for companies running mowing routes, not general service businesses.'},
            {q:'How do recurring mow schedules work?', a:'You set each lawn to weekly, biweekly, or every-other-week and MowBossPro generates every future visit automatically. Each property stays on its assigned route day and crew, so your whole season is built without you rebuilding the schedule each week.'},
            {q:'How does route building work for mowing?', a:'You open the circle-map lasso tool, draw a circle around a geographic area, and every mowing account due inside is selected and added to your route. Stop count, sq ft totals, and estimated revenue update in real time. Route planning that takes 30 minutes in a spreadsheet takes 5 minutes on the map.'},
            {q:'Can I dispatch multiple crews and trucks?', a:'Yes. Assign every stop to a crew and truck, and the dispatch board shows each crew’s route in order. When rain or a breakdown hits, drag stops between crews or slide a whole route to a new day and every crew sees the update live in the mobile app.'},
            {q:'Does it replace spreadsheets and scheduling apps?', a:'Yes. MowBossPro replaces spreadsheet scheduling, route planning, customer tracking, and SMS communication tools in one platform. Most owners are fully operational the same day they sign up &mdash; no onboarding consultant, no implementation timeline.'},
            {q:'How much does MowBossPro cost?', a:'$79/month, all features included. No per-user fees, no add-ons for SMS or route tools, no setup fees. 14-day free trial with no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>MowBossPro runs your entire mowing operation &mdash; recurring routes, crew dispatch, payments, and customer texts &mdash; all from one platform. <a href="/" style={{color:'var(--orange)', fontWeight:600}}>See the full platform overview</a>.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Running Your Mowing Business<br />on Software Built for Plumbers.</h2>
        <p>MowBossPro is the only lawn care software built by someone who has actually run a mowing route. Try it free for 14 days.</p>
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
