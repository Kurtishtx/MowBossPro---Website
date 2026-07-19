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

export default function MowingRoutesSoftware() {
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
        <div className="hero-badge">Mowing Routes &amp; Dispatch Software</div>
        <h1>Mowing Routes &amp; Dispatch Software<br /><span>Built Around the Way Crews Actually Run</span></h1>
        <p>Running a mowing operation is a routing problem first. You have hundreds of recurring yards on a weekly or bi-weekly cycle, two or three crews, and a map that changes every time a customer signs on or cancels. MowBossPro builds tight mowing routes, dispatches them to the right truck, and keeps the whole week organized so no lawn gets skipped and no crew burns an hour driving in circles.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$79/mo</b> after</div>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">Routes</div><div className="hero-stat-lbl">Built in Minutes, Not Hours</div></div>
          <div><div className="hero-stat-val">$79</div><div className="hero-stat-lbl">Flat Monthly — No Add-Ons</div></div>
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
          alt="MowBossPro mowing route and dispatch software showing the circle-map route builder, the day's dispatch board, and the crew mobile app on a phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Affordable Doesn&apos;t Mean Cheap.<br /><span>This Is Enterprise-Level Routing &amp; Dispatch.</span></h2>
        <p>$79/month sounds modest. But the routing engine inside MowBossPro is built to the same standard as software that costs ten times more. The difference is we built it ourselves, for our own mowing crews, and we don&apos;t charge a $300/month add-on for the route map or a per-truck fee for dispatch. To see how the whole platform fits together, start at <a href="/">MowBossPro</a> and then dig into routing here.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">🗺️</div><h4>Route Intelligence</h4><p>Live route maps, drag-and-drop stop ordering, and geographic clustering that pulls scattered yards into one efficient loop. See drive time drop before your crew ever leaves the shop.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📅</div><h4>Recurring Visit Engine</h4><p>Set a yard to weekly, bi-weekly, or every-ten-days and MowBossPro rolls it forward automatically. The next visit lands on the calendar the moment a crew marks the last one complete.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🚚</div><h4>Crew Dispatch Board</h4><p>One board for the whole day. Assign stops to trucks, balance the load across crews, reorder the run, and push the route straight to every driver&apos;s phone.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💬</div><h4>Customer Texts</h4><p>Two-way SMS inbox plus automated &quot;crew is on the way&quot; and &quot;your lawn is done&quot; alerts. All built in at the flat price — no Twilio account, no third-party setup.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Billing &amp; Payments</h4><p>Cards on file, invoicing, charge-after-mow, and overdue reports through Stripe. Bill recurring mowing accounts without chasing anyone down a single phone line.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📱</div><h4>Mobile App for Your Crew</h4><p>Each crew gets their stops for the day in route order. Complete, skip, or reschedule a yard and log a note — all from the truck, without one call to the office.</p></div>
        </div>
      </div>

      {/* LASSO */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Lasso — Circle Map Routing</span>
            <h2 style={{color:'#fff'}}>Draw a Circle on the Map. Build a Mowing Route Inside It.</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>Lasso is the fastest way to build a mowing route we&apos;ve ever seen. Draw a circle on your service-area map and MowBossPro instantly surfaces every yard inside that radius that&apos;s due this week — with stop count, estimated drive time, and route revenue calculated in real time before you commit a single truck to the day.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>Draw any size circle on the map — instantly see every yard due inside</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Counts stops and totals route revenue automatically</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Shows what&apos;s already routed vs. what&apos;s still waiting to be mowed</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>One click to assign every selected yard to a day and a crew</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Tighten routes geographically — no more scattered stops burning fuel</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Re-order the run with drag-and-drop and push it to the truck</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Cuts route-building time from an hour to under 5 minutes</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>No competitor has this. It doesn&apos;t exist anywhere else in mowing software.</li>
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
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Stops This Run</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#b22234', fontSize:'18px', fontWeight:800}}>2h 40m</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Est. Drive Time</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#b22234', fontSize:'18px', fontWeight:800}}>$1,140</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Route Revenue</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', gridColumn:'span 2'}}>
                <div style={{color:'#fff', fontSize:'13px', fontWeight:600}}>Weekly · 9 &nbsp;|&nbsp; Bi-Weekly · 7 &nbsp;|&nbsp; One-Time · 3</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Breakdown by Visit Cycle</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EASIER TO USE */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto 56px'}}>
          <span className="section-label">Simplicity</span>
          <h2 className="section-title">The Most Capable Routing Software Is Also the Easiest to Run</h2>
          <p className="section-sub" style={{maxWidth:'720px'}}>Most powerful software is complicated. MowBossPro is the exception. Every screen was designed by people who actually built mowing routes and dispatched crews — not UX designers who&apos;ve never sat in a truck. Your office and your drivers will be running it confidently on day one.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Set Up in One Afternoon', body:'Import your customers and yards, set each one to its mowing cycle, and connect Stripe. Most owners have their first week of routes built the same day they sign up — no implementation consultant, no 90-day setup timeline.'},
            {n:'02', title:'One Screen Runs the Day', body:'Route map, dispatch board, and the day\'s stop list are all connected. You\'re not jumping between five modules or browser tabs. Pull up the board and everything the crews need for the day is in a single view.'},
            {n:'03', title:'Your Crews Learn It in Minutes', body:'The mobile app shows each driver their stops in route order and nothing they don\'t need. Open it, mow, hit complete, drive to the next pin. No training videos, no IT ticket, no frustrated crew.'},
            {n:'04', title:'Recurring Routes Run Themselves', body:'Set the visit cycle once. After that MowBossPro rolls every weekly and bi-weekly yard forward automatically, rebuilds next week\'s route, and fires the customer texts — whether you\'re on a mower, at home, or on vacation.'},
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
          <p className="section-sub">Mowing is not plumbing. You&apos;re not sending one tech to one job for two hours. You&apos;re running the same hundreds of yards over and over on a tight weekly cycle, across multiple crews, and one badly ordered route can cost you an entire truck-day in wasted drive time.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we were running our own mowing crews, we tried every piece of software out there. The big names, the small names, the ones built for &quot;field service.&quot; None of them understood what it meant to have <strong>600 recurring yards</strong> that all need to be visited this week and need to be ordered into routes that don&apos;t send a truck back and forth across town.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>They don&apos;t have a real routing engine. Because they weren&apos;t built by someone who dispatches mowing crews. <strong>We were.</strong> We&apos;ve been in this industry since 2006, and MowBossPro is the routing and dispatch software we always wished existed.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every feature in MowBossPro exists because we needed it to keep crews moving on a real mowing route. Not because a product manager in a tech office decided it sounded good.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Built for Mowing Routes</span>
          <h2 className="section-title">Routing &amp; Dispatch Features Designed Around Your Operation</h2>
          <p className="section-sub">Every tool in MowBossPro was built with mowing route workflows in mind — not adapted from a plumbing app and called good enough.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'🗺️', title:'Live Route Map', body:'See every scheduled yard pinned on an interactive map. Drag to reorder stops, build tight geographic loops, and cut drive time before your crew ever pulls out of the yard.'},
            {icon:'⭕', title:'Lasso Route Builder', body:'Draw a circle on the map and every yard due inside it is selected and routed in one motion. Stops, drive time, and revenue update live before you commit a truck.'},
            {icon:'📅', title:'Recurring Visit Cycles', body:'Set any yard to weekly, bi-weekly, every-ten-days, or custom. MowBossPro rolls the next visit onto the calendar automatically the moment the crew marks the last one done.'},
            {icon:'🚚', title:'Crew Dispatch Board', body:'Assign stops to trucks, balance the day across crews, and reorder the run from one board. Push the finished route straight to every driver\'s phone.'},
            {icon:'📱', title:'Mobile App for Crews', body:'Drivers get their stops for the day in route order. Mark a yard complete, skip, or reschedule — right from the truck without calling the office.'},
            {icon:'💬', title:'On-the-Way & Done Texts', body:'Automatically text customers when the crew is on the way and when their lawn is finished. Set it once and MowBossPro handles the message for every single stop.'},
            {icon:'🏠', title:'Property Profiles', body:'Every yard has its own record — gate codes, mowing notes, service history, GPS pin, and photos. Everything tied to the address, so a fill-in driver mows it right the first time.'},
            {icon:'🔁', title:'Skip & Reschedule Handling', body:'A yard rained out or skipped? Bump it to the next run in one tap and MowBossPro keeps the recurring cycle on track without throwing off the rest of the route.'},
            {icon:'💰', title:'Estimates That Close', body:'Build a mowing estimate in minutes from your service catalog, email it from the platform, and let customers accept with one click. Auto-follow-ups go out if they don\'t respond.'},
            {icon:'💳', title:'Card-on-File Payments', body:'Store cards on file via Stripe and charge after each mow or bill the month. Collect on recurring accounts without chasing anyone down.'},
            {icon:'📄', title:'Recurring Invoicing', body:'Convert routes and visits into invoices automatically. Filter by unpaid, partial, paid, or overdue. Every dollar tracked with full payment history, method, and date.'},
            {icon:'💬', title:'Two-Way SMS Inbox', body:'Send and receive texts with customers inside MowBossPro. Full conversation history organized by contact — no more switching to your personal phone.'},
            {icon:'⭐', title:'Automated Review Requests', body:'After a completed mow, MowBossPro can automatically send a Google review request — on your schedule, every time, without you lifting a finger.'},
            {icon:'🔁', title:'Estimate Follow-Up Sequences', body:'3 automated follow-up texts go out if a customer doesn\'t respond to your mowing estimate. Let MowBossPro chase the deal so you don\'t have to.'},
            {icon:'💳', title:'Payment Follow-Up Sequences', body:'Unpaid invoices trigger 3 automated payment reminder texts. Collect what you\'re owed without making uncomfortable calls.'},
            {icon:'👥', title:'Customer & Lead Management', body:'Manage active mowing customers and new prospects side by side. Track estimates, route history, and notes tied to each contact in one searchable database.'},
            {icon:'🏷️', title:'Discount Codes & Sales Tax', body:'Apply percentage or fixed-dollar discounts to any estimate. Set sales tax by jurisdiction and let MowBossPro calculate and track tax on every invoice automatically.'},
            {icon:'👑', title:'Role-Based Access', body:'Owner, Manager, Office, Crew Lead, and Mobile roles. Control exactly what each person sees and does — from full access down to field-only.'},
            {icon:'🚛', title:'Truck & Equipment Management', body:'Create truck profiles, assign crews to trucks, and track which truck ran each route. Know exactly what\'s on every truck every day.'},
            {icon:'⏱️', title:'Crew Hour Tracking', body:'Track crew hours per route and generate payroll-ready reports. Know exactly what you owe before payday without running a separate system.'},
            {icon:'📊', title:'Dashboard &amp; Reports', body:'Stat cards show today\'s routed stops, yards mowed, revenue, and money owed — all at a glance the moment you log in.'},
            {icon:'🔔', title:'10+ Automated Alert Types', body:'Visit scheduled, on the way, completed, skipped, rescheduled, estimate sent, estimate accepted, review request, payment declined, inbound text — all automated and customizable.'},
            {icon:'👥', title:'Unlimited Users', body:'Add every crew member, office staffer, and driver at no extra cost. No per-seat fees. Unlimited users are included in the flat $79/month rate.'},
            {icon:'🏢', title:'Unlimited Customers & Yards', body:'No caps on customers, properties, or leads. Whether you mow 50 yards or 5,000 — MowBossPro routes them all at the same flat price.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DISPATCH */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Dispatch &amp; Scheduling</span>
            <h2>See the Whole Week of Routes Before a Single Crew Pulls Out</h2>
            <p>This is where the routing engine earns its keep. MowBossPro&apos;s dispatch board doesn&apos;t just list which yards need mowing — it groups them by crew and day, totals stops, drive time, and revenue per route, and lets you balance the load across trucks before anyone leaves the shop. For a full walkthrough of building, ordering, and dispatching your routes, read <a href="/blogs/mowing-route-software-complete-guide" style={{color:'var(--orange)', fontWeight:600}}>Mowing Route &amp; Dispatch Software: The Complete Guide for Lawn Care Businesses</a>.</p>
            <ul className="check-list">
              <li>Daily board grouped by crew and truck</li>
              <li>Assign yards to a day and crew in one click</li>
              <li>Drag-and-drop route reordering on the map</li>
              <li>Live totals: stops, drive time, and revenue per route</li>
              <li>Balance the load evenly across multiple crews</li>
              <li>Mark stops complete, skipped, or rescheduled from the field</li>
              <li>Print or push route sheets to every driver</li>
              <li>Recurring yards roll onto next week&apos;s board automatically</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Dispatch Board — Tuesday</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Crew 1 — North Route</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>22 yards · weekly cycle</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$1,320</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#b22234', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Crew 2 — West Route</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>18 yards · weekly cycle</div></div>
              <div style={{marginLeft:'auto', background:'#b22234', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$1,080</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#7fb0ff', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Crew 3 — South Route</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>16 yards · bi-weekly cycle</div></div>
              <div style={{marginLeft:'auto', background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$960</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Unrouted — Waiting</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>7 yards due this week</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$420</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#b22234', fontSize:'16px', fontWeight:700}}>Balanced before you roll out.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>No other mowing software dispatches like this.</div>
            </div>
          </div>
        </div>
      </section>

      {/* RECURRING VISITS */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Recurring Visits</span>
            <h2>Recurring Mowing Cycles That Manage Themselves</h2>
            <p>Mowing lives or dies on the recurring cycle. MowBossPro tracks every yard&apos;s visit interval and rebuilds next week&apos;s routes automatically — so the same lawn gets mowed on schedule, week after week, without anyone re-entering it by hand.</p>
            <ul className="check-list">
              <li>Set weekly, bi-weekly, every-ten-days, or custom per yard</li>
              <li>Next visit auto-schedules the moment the last one is completed</li>
              <li>Seasonal start and stop dates per customer</li>
              <li>Skipped visits bump forward without breaking the cycle</li>
              <li>See every upcoming visit on the route calendar</li>
              <li>Recurring yards flow straight onto the dispatch board</li>
              <li>Pause or resume an account in one click for the off-season</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Recurring Cycles — This Week</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>248</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Yards Due</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>11</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Routes Built</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#b22234', fontSize:'20px', fontWeight:700}}>184</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Weekly</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#b22234', fontSize:'20px', fontWeight:700}}>64</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Bi-Weekly</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>412 Maple Ave · Weekly</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Next: Tue · Crew 1 · gate code on file</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Routed</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#b22234', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>9 Oak Court · Bi-Weekly</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Next: Thu · Crew 3 · back gate</div></div>
              <div style={{background:'#b22234', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Waiting</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Pricing</span>
          <h2 className="section-title">One Flat Price. Everything Included.</h2>
          <p className="section-sub">We were paying $500–$700 a month for software that nickel-and-dimed us for the route map and the dispatch board. We built MowBossPro to be the pricing we always wished existed.</p>
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
              <li>Full Routing, Dispatch &amp; Route Map</li>
              <li>Lasso Circle-Map Route Builder</li>
              <li>Recurring Visit Cycles &amp; Auto-Scheduling</li>
              <li>Estimates, Invoices &amp; Stripe Payments</li>
              <li>Two-Way SMS &amp; Automated Customer Texts</li>
              <li>Crew Dispatch Board &amp; Truck Management</li>
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
          <h2 className="section-title" style={{marginBottom:'48px'}}>Mowing Routes &amp; Dispatch Software — Common Questions</h2>
          {[
            {q:'Is MowBossPro built for mowing route businesses?', a:'Yes. MowBossPro is a routing and dispatch platform for lawn mowing operations: recurring visit cycles, circle-map route building, a crew dispatch board, customer texts, estimate-to-service conversion, and card-on-file payments. It\'s designed for companies running weekly and bi-weekly mowing routes, not general service businesses.'},
            {q:'How does route building work for mowing?', a:'You open the circle-map lasso tool, draw a circle around an area, and every yard due inside is selected and added to a route. Stop count, estimated drive time, and route revenue update in real time. You then drag stops into the most efficient order and push the route to the crew. Route planning that takes 30 minutes in a spreadsheet takes 5 minutes on the map.'},
            {q:'Can MowBossPro handle recurring weekly and bi-weekly mowing?', a:'Yes. Set each yard to weekly, bi-weekly, every-ten-days, or a custom interval, and MowBossPro auto-schedules the next visit the moment a crew marks the last one complete. Next week\'s routes rebuild themselves, so the same lawns get mowed on schedule without re-entering anything.'},
            {q:'How does crew dispatch work?', a:'The dispatch board groups the day\'s stops by crew and truck, totals stops, drive time, and revenue per route, and lets you balance the load across crews before anyone leaves the shop. Each driver gets their stops in route order on the mobile app and marks them complete, skipped, or rescheduled from the truck.'},
            {q:'Does it text my customers automatically?', a:'Yes. MowBossPro sends automated on-the-way and lawn-is-done texts for every stop, plus a two-way SMS inbox for replies. 500 outbound texts are included each month, with more available at $15 per additional 500.'},
            {q:'How much does MowBossPro cost?', a:'$79/month, all features included — routing, dispatch, the mobile app, customer texts, and payments. No per-user fees, no add-ons for the route map or dispatch board, no setup fees. 14-day free trial with no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>Routing and dispatch is one piece of how MowBossPro runs your mowing business — for the full picture of scheduling, billing, and crews, <a href="/" style={{color:'var(--orange)', fontWeight:600}}>see the full platform overview</a>.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Building Mowing Routes<br />in a Spreadsheet at 9pm.</h2>
        <p>MowBossPro is the only mowing routes and dispatch software built by someone who has actually run crews and ordered the routes. Try it free for 14 days.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(3, e.currentTarget as HTMLElement); }} className="btn-primary" style={{fontSize:'17px', padding:'18px 44px'}}>Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$79/mo</b> after</div>
        </div>
      </div>

      <div id="sbp-backdrop" className="sbp-backdrop" onClick={() => closeAllModals()}></div>
      <SignupForm n={1} />
      <SignupForm n={2} />
      <SignupForm n={3} />
    </>
  );
}
