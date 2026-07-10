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
      if (secs <= 0) { clearInterval(iv); window.location.href = 'https://my.mowbosspro.com/dashboard.html' + (typeof signInData!=='undefined'&&signInData&&signInData.session?'#access_token='+encodeURIComponent(signInData.session.access_token)+'&refresh_token='+encodeURIComponent(signInData.session.refresh_token):''); }
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

export default function MowingSchedulingSoftware() {
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
        <div className="hero-badge">Built for Lawn Mowing Crews</div>
        <h1>Mowing Scheduling Software<br /><span>That Builds Your Whole Week in Minutes</span></h1>
        <p>Most field service apps were built for one-off jobs. Mowing is different. You run the same yards every 7 or 14 days, route by route, crew by crew, all season long. <a href="/">MowBossPro</a> is scheduling software built around recurring mowing visits, tight routes, and crews that need to know exactly where to go next.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">7/14</div><div className="hero-stat-lbl">Day Recurring Cycles Automated</div></div>
          <div><div className="hero-stat-val">$79</div><div className="hero-stat-lbl">Flat Monthly — No Add-Ons</div></div>
          <div><div className="hero-stat-val">500+</div><div className="hero-stat-lbl">Customer Texts Included Monthly</div></div>
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
          alt="MowBossPro mowing scheduling software dashboard on a laptop showing the route map and recurring visit calendar, with the crew mobile app on a phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Scheduling Software That Actually<br /><span>Understands Recurring Mowing Routes.</span></h2>
        <p>$79/month sounds modest. But what you&apos;re getting isn&apos;t. MowBossPro was built to schedule the way mowing companies really run &mdash; recurring weekly and biweekly visits, geographic routes, multiple crews, and a calendar that fills itself once you set the cycle. No per-seat fees, no add-ons for the features you use every single day.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">🔁</div><h4>Recurring Visit Engine</h4><p>Set a yard to mow every 7 or 14 days and MowBossPro auto-generates every future visit for the whole season. Skip a rain day, bump the cycle, or pause a stop &mdash; the schedule rebuilds itself without you touching a spreadsheet.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🗺️</div><h4>Route Building</h4><p>Drag-and-drop stop ordering, geographic clustering, and a live map that shows your whole day in driving order. Tighten routes so crews spend the day mowing, not driving across town between yards.</p></div>
          <div className="premium-card"><div className="premium-card-icon">👷</div><h4>Crew Dispatch</h4><p>Assign each route to a crew and a truck, then send the day to their phones. Every crew sees their own stops in order &mdash; no group texts, no paper sheets, no &quot;which yard is next?&quot; calls to the office.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Billing &amp; Payments</h4><p>Per-cut billing, monthly flat-rate, cards on file, and instant invoices through Stripe. Charge after each mow or bill the whole month &mdash; every dollar tracked in one place without a second app.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💬</div><h4>Customer Texts</h4><p>Automatic &quot;crew is on the way&quot; and &quot;mow complete&quot; texts, plus reschedule notices when weather pushes a route. Set it once and MowBossPro keeps every customer in the loop on every visit.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📱</div><h4>Crew Mobile App</h4><p>Your mowing crews get a phone view of the day&apos;s stops in route order. Mark each yard complete, skip, or add a note from the truck &mdash; the office sees it update live without a single phone call.</p></div>
        </div>
      </div>

      {/* LASSO */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Lasso — Map Route Builder</span>
            <h2 style={{color:'#fff'}}>Draw a Circle on the Map. Build a Mowing Route Inside It.</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>Lasso is the fastest way to build a mowing route we&apos;ve ever seen. Draw a circle on your service-area map and MowBossPro instantly surfaces every yard inside that radius that&apos;s due for a cut &mdash; with stop count, route order, and estimated revenue calculated in real time before you commit a single crew to a single day.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>Draw any size circle on the map &mdash; instantly see every yard due inside</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Counts stops and totals the route revenue automatically</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Shows what&apos;s already scheduled vs. what&apos;s still waiting for a cut</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>One click to schedule every selected yard to a date and crew</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Tighten routes geographically &mdash; stop burning the day driving cross-town</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Splits a packed area cleanly across two crews when you need to</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Cuts route building from an hour to under 5 minutes</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>No mowing scheduling software does this. It doesn&apos;t exist anywhere else.</li>
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
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Yards Selected</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#b22234', fontSize:'18px', fontWeight:800}}>19</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Total Stops Due</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#b22234', fontSize:'18px', fontWeight:800}}>$1,140</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Route Revenue</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#b22234', fontSize:'18px', fontWeight:800}}>2</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Crews Needed</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', gridColumn:'span 2'}}>
                <div style={{color:'#fff', fontSize:'13px', fontWeight:600}}>Weekly Mow · 9 &nbsp;|&nbsp; Biweekly Mow · 8 &nbsp;|&nbsp; Cleanup · 2</div>
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
          <h2 className="section-title">The Most Capable Mowing Scheduler Is Also the Easiest to Learn</h2>
          <p className="section-sub" style={{maxWidth:'720px'}}>Most powerful software is complicated. MowBossPro is the exception. Every screen was designed by people who ran mowing routes &mdash; not UX designers who&apos;ve never sat in a truck at 6 a.m. Your crews will be using it confidently on day one.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Set Up in One Afternoon', body:'Add your yards, set each one to a weekly or biweekly cycle, build your routes, and connect Stripe — most owners are scheduling their whole season the same day they sign up. No implementation consultant, no onboarding call, no 90-day setup timeline.'},
            {n:'02', title:'One Screen Runs the Day', body:'Calendar, route map, dispatch board, and crew assignments are all connected. You\'re not jumping between five tabs. Pull up the day and every yard, every crew, and every route is right there in a single view you can dispatch from.'},
            {n:'03', title:'Your Crews Learn It in Minutes', body:'The mobile app your crews use shows them exactly what they need and nothing they don\'t. Their stops for the day, the address, the gate code, the job notes, and the complete button. No training videos, no IT ticket, no frustrated crew leads.'},
            {n:'04', title:'The Schedule Runs Without You', body:'Set each yard\'s mowing cycle and your customer texts once. After that, MowBossPro generates every recurring visit, sends every on-the-way and completion text, and rolls rain days forward automatically — whether you\'re on a route, at home, or asleep.'},
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
          <h2 className="section-title">Generic Scheduling Apps Weren&apos;t Built for Mowing Routes</h2>
          <p className="section-sub">Mowing is not a one-off job. You&apos;re not booking a single appointment for next Tuesday. You&apos;re running the same hundreds of yards on a 7- or 14-day cycle, route by route, crew by crew, week after week &mdash; and a generic calendar app falls apart the moment it rains.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we were running our own mowing routes, we tried every piece of software out there. The big names, the small names, the ones built for &quot;field service.&quot; None of them understood what it meant to have <strong>300 yards on a weekly cycle</strong> and need the next four weeks of routes to build themselves &mdash; and then rebuild when Tuesday gets rained out.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>They don&apos;t have that. Because they weren&apos;t built by someone who runs a mowing business. <strong>We were.</strong> We&apos;ve been in this industry since 2006, and MowBossPro is the scheduling software we always wished existed.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every feature in MowBossPro exists because we needed it on a real mowing route. Not because a product manager in a tech office decided it sounded good. To see how the whole system fits together, start with <a href="/blogs/mowing-scheduling-software-complete-guide" style={{color:'var(--orange)', fontWeight:600}}>Mowing Scheduling Software: The Complete Guide for Lawn Care Businesses</a>.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Built for Mowing</span>
          <h2 className="section-title">Scheduling Features Designed Around Your Routes</h2>
          <p className="section-sub">Every tool in MowBossPro was built with recurring mowing workflows in mind &mdash; not adapted from a one-off appointment app and called good enough.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'🔁', title:'Recurring Visit Scheduling', body:'Set a yard to mow every 7 or 14 days and MowBossPro builds out every future visit automatically. The calendar fills itself for the whole season — no re-entering the same stop fifty times.'},
            {icon:'🗺️', title:'Live Route Map', body:'See every scheduled mow pinned on an interactive map in driving order. Drag to reorder stops, build tight geographic routes, and cut drive time before your crew ever leaves the yard.'},
            {icon:'📅', title:'Season Calendar', body:'A full calendar view of every mowing visit, by day, route, and crew. See the week at a glance, spot gaps, and balance the load so no single day or crew is overbooked.'},
            {icon:'🌧️', title:'Rain-Day Rescheduling', body:'When weather kills a day, push the whole route forward in one click. MowBossPro shifts the visits, keeps the cycle intact, and texts every affected customer the new day automatically.'},
            {icon:'👷', title:'Crew Assignment & Dispatch', body:'Assign each route to a crew and a truck, then send the day to their phones. Every crew sees only their own stops, in order, ready to mow.'},
            {icon:'💬', title:'Automated Visit Texts', body:'Automatically text customers when the crew is on the way and when the mow is done. Set it once — MowBossPro handles the communication for every single visit.'},
            {icon:'💰', title:'Estimates That Close', body:'Build a mowing estimate in minutes from your service catalog, email it from the platform, and let prospects accept with one click. Auto-follow-ups go out if they don\'t respond.'},
            {icon:'💳', title:'Per-Cut & Flat-Rate Billing', body:'Charge per mow or bill a flat monthly rate per yard. Store cards on file via Stripe and collect after every visit — every dollar tracked in one place.'},
            {icon:'🏠', title:'Property Profiles', body:'Every yard has its own record — gate codes, mow notes, service history, GPS coordinates, and photos. Everything tied to the address, so any crew can run the stop cold.'},
            {icon:'💬', title:'Two-Way SMS Inbox', body:'Send and receive texts with customers directly inside MowBossPro. Full conversation history organized by contact — no more switching to your personal phone.'},
            {icon:'⭐', title:'Automated Review Requests', body:'After every completed mow, MowBossPro can send a Google review request to the customer — on your schedule, every time, without you lifting a finger.'},
            {icon:'🔁', title:'Estimate Follow-Up Sequences', body:'3 automated follow-up texts go out if a prospect doesn\'t respond to your mowing estimate. Let MowBossPro chase the deal so you don\'t have to.'},
            {icon:'💳', title:'Payment Follow-Up Sequences', body:'Unpaid invoices trigger 3 automated payment reminder texts. Collect what you\'re owed for the season without making uncomfortable calls.'},
            {icon:'👥', title:'Customer & Lead Management', body:'Manage active mowing customers and new prospects side by side. Track estimates, visit history, and notes tied to each contact — in one searchable database.'},
            {icon:'📄', title:'Invoice Management', body:'Convert accepted estimates to invoices instantly, or batch-bill a month of mows at once. Filter by unpaid, partial, paid, or overdue with full payment history.'},
            {icon:'🏷️', title:'Discount Codes & Sales Tax', body:'Apply percentage or fixed-dollar discounts to any mowing estimate. Set sales tax by jurisdiction and let MowBossPro calculate and track it on every invoice.'},
            {icon:'👑', title:'Role-Based Access', body:'Owner, Manager, Office, Crew Lead, and Mobile roles. Control exactly what each person can see and do — from full access down to field-only stops.'},
            {icon:'🚛', title:'Truck & Equipment Tracking', body:'Create truck profiles, assign vehicles to routes, and track which truck ran each route. Know exactly what crew and truck handled every yard.'},
            {icon:'⏱️', title:'Crew Hour Tracking', body:'Track crew hours per route and generate payroll-ready reports. Know exactly what you owe before payday without running a separate timeclock app.'},
            {icon:'📊', title:'Dashboard & Reports', body:'Stat cards show today\'s mows completed, yards remaining, revenue booked, money owed, and more — all at a glance the moment you log in.'},
            {icon:'🔔', title:'10+ Automated Alert Types', body:'Visit scheduled, on the way, completed, skipped, rescheduled, estimate sent, estimate accepted, review request, payment reminder, inbound text — all automated.'},
            {icon:'👥', title:'Unlimited Users', body:'Add every crew member, office staffer, and crew lead at no extra cost. No per-seat fees. Unlimited users are included in the flat $79/month rate.'},
            {icon:'🏢', title:'Unlimited Yards & Customers', body:'No caps on customers, yards, or leads. Whether you mow 50 lawns or 5,000 — MowBossPro schedules them all at the same flat price.'},
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
            <span className="section-label">Recurring Mowing Schedule</span>
            <h2>Set the Cycle Once. Watch the Whole Season Schedule Itself.</h2>
            <p>This is the feature generic apps don&apos;t have. MowBossPro&apos;s recurring engine doesn&apos;t just book one visit &mdash; you tell it a yard mows every 7 or 14 days and it generates every future visit, slots each one into the right route, and rolls rain days forward without you re-entering a thing. For a full walkthrough of how it works as the daily hub of a mowing business, read <a href="/blogs/mowing-scheduling-software-complete-guide" style={{color:'var(--orange)', fontWeight:600}}>Mowing Scheduling Software: The Complete Guide for Lawn Care Businesses</a>.</p>
            <ul className="check-list">
              <li>Set weekly or biweekly cycles per yard &mdash; visits build automatically</li>
              <li>Schedule directly onto a route in one click</li>
              <li>Assign date, crew, and truck at scheduling time</li>
              <li>Full dispatch board for the day&apos;s scheduled mows</li>
              <li>Drag-and-drop route reordering on the map</li>
              <li>Mark stops complete, skipped, or rescheduled from the field</li>
              <li>One-click rain-day push for an entire route</li>
              <li>Summary bar: total stops, crews, and revenue for the day</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Today&apos;s Routes — By Crew</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Crew A — North Route</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>18 weekly yards due</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>18 stops</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#b22234', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Crew B — East Route</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>16 weekly yards due</div></div>
              <div style={{marginLeft:'auto', background:'#b22234', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>16 stops</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#7fb0ff', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Crew C — South Route</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>14 biweekly yards due</div></div>
              <div style={{marginLeft:'auto', background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>14 stops</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Cleanups &amp; Add-Ons</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>4 one-time visits due</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>4 stops</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#b22234', fontSize:'16px', fontWeight:700}}>Set the cycle once.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>The season schedules itself.</div>
            </div>
          </div>
        </div>
      </section>

      {/* CREW DISPATCH */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Crew Dispatch</span>
            <h2>Every Crew Knows Exactly Where to Mow Next</h2>
            <p>Dispatch a route to a crew and it lands on their phones in driving order. They tap into the next yard, see the gate code and mow notes, mow it, and mark it complete &mdash; and the office watches the route close out live. No group texts, no paper sheets, no calling in for the next address.</p>
            <ul className="check-list">
              <li>Send each route to the assigned crew&apos;s phone in one tap</li>
              <li>Stops appear in driving order &mdash; next yard always on top</li>
              <li>Gate codes, mow notes, and photos attached to every stop</li>
              <li>Crews mark complete, skip, or reschedule from the truck</li>
              <li>Office sees the route close out live, stop by stop</li>
              <li>Reassign a yard between crews mid-day in seconds</li>
              <li>Completed mows trigger the customer&apos;s done text automatically</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Crew App — North Route</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>18</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Stops Today</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>11</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Mowed</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#b22234', fontSize:'20px', fontWeight:700}}>7</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Remaining</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#b22234', fontSize:'20px', fontWeight:700}}>$720</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Route Revenue</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#b22234', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Next: 412 Oak St · Weekly Mow</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Gate code 1845 · Dog in back yard</div></div>
              <div style={{background:'#b22234', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$45</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Done: 388 Oak St · Weekly Mow</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Completed 9:42 AM · Customer texted</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>✓ Paid</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Pricing</span>
          <h2 className="section-title">One Flat Price. Everything Included.</h2>
          <p className="section-sub">We were paying $500–$700 a month for software that nickel-and-dimed us. We built MowBossPro to be the pricing we always wished existed.</p>
        </div>
        <div style={{maxWidth:'520px', margin:'0 auto'}}>
          <div className="lc-price-card featured">
            <div className="featured-badge">Everything Included</div>
            <div className="price-tier">One Plan. No Surprises.</div>
            <div style={{fontSize:'48px', fontWeight:800, color:'var(--text)', lineHeight:1}}><sup style={{fontSize:'22px', verticalAlign:'super'}}>$</sup>79</div>
            <div style={{color:'var(--muted)', fontSize:'13px', marginBottom:'24px', marginTop:'4px'}}>per month</div>
            <div style={{color:'var(--muted)', fontSize:'14px', marginBottom:'24px', lineHeight:1.5}}>Every feature. Unlimited customers, yards, crews, and users. No tiers, no locked features, no per-seat fees.</div>
            <ul className="price-features">
              <li>Unlimited Customers, Yards &amp; Leads</li>
              <li>Unlimited Crews &amp; Users</li>
              <li>Recurring Weekly &amp; Biweekly Scheduling</li>
              <li>Route Map, Dispatch &amp; Crew Assignment</li>
              <li>Rain-Day Rescheduling in One Click</li>
              <li>Estimates, Invoices &amp; Stripe Payments</li>
              <li>Two-Way SMS &amp; Automated Visit Texts</li>
              <li>Per-Cut &amp; Flat-Rate Billing</li>
              <li>Crew Mobile App</li>
              <li>500 Outbound Texts/month included</li>
              <li>+$15 per additional 500 texts after that</li>
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
          <h2 className="section-title" style={{marginBottom:'48px'}}>Mowing Scheduling Software — Common Questions</h2>
          {[
            {q:'Is MowBossPro built for lawn mowing businesses?', a:'Yes. MowBossPro is scheduling software built for recurring mowing routes: weekly and biweekly cycles, geographic route building, crew dispatch, estimate-to-customer conversion, automated visit texts, and per-cut or flat-rate billing. It\'s designed for companies running mowing routes, not general one-off service jobs.'},
            {q:'How does recurring scheduling work for mowing?', a:'You set each yard to a 7- or 14-day cycle, and MowBossPro generates every future visit automatically, slotting each one into the right route. The whole season builds itself — and when a yard pauses or changes cycles, the schedule rebuilds without you re-entering anything.'},
            {q:'Can I run multiple crews and routes from one account?', a:'Yes. MowBossPro supports as many crews and routes as you need. Assign each route to a crew and a truck, dispatch the day to their phones, and reassign yards between crews mid-day in seconds. Every crew sees only their own stops, in driving order.'},
            {q:'What happens when it rains and a route gets pushed?', a:'One click pushes the entire route forward. MowBossPro shifts every visit, keeps each yard\'s cycle intact, and automatically texts every affected customer their new mow day — so you\'re not making thirty phone calls after a storm.'},
            {q:'Does it replace spreadsheets and calendar apps?', a:'Yes. MowBossPro replaces spreadsheet scheduling, route planning, customer tracking, and texting tools in one platform. Most owners are scheduling their whole season the same day they sign up — no onboarding consultant, no implementation timeline.'},
            {q:'How much does MowBossPro cost?', a:'$79/month, all features included. No per-user fees, no add-ons for SMS or route tools, no setup fees. 14-day free trial with no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>MowBossPro schedules, routes, dispatches, and bills your entire mowing operation from one platform &mdash; <a href="/" style={{color:'var(--orange)', fontWeight:600}}>see the full platform overview</a>.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Running Your Mowing Routes<br />on a Calendar App That Wasn&apos;t Built for You.</h2>
        <p>MowBossPro is the only mowing scheduling software built by someone who has actually run a mowing route. Try it free for 14 days.</p>
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
