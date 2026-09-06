'use client';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import SignupModal from '../components/SignupModal';
import HeroDemo from '../components/HeroDemo';

/* Canada landing page — long-form, homepage-depth. Everything on this page is a claim the
   product actually delivers: CAD customer billing is native (Country = Canada in Company Info,
   billing runs through the owner's own Canadian Stripe account), the subscription itself bills
   in USD (stated plainly in the FAQ), and Canadian SMS requires carrier registration set up
   during onboarding (also stated plainly). No invented customers, no invented certifications. */

const faqs = [
  {
    q: 'Does MowBossPro actually work for a Canadian mowing company?',
    a: 'Yes — today, not "coming soon." Customer records, weekly and bi-weekly cut schedules, the route map, estimates, invoicing in Canadian dollars, the crew app, and the customer app all work in Canada right now. You connect your own Canadian Stripe account and your customers are billed in CAD.',
  },
  {
    q: 'Do my customers get billed in Canadian dollars?',
    a: 'Yes. Set your country to Canada on the Company Info page and every invoice, card-on-file charge, and Pay Now link goes out in Canadian dollars automatically, through your own Canadian Stripe account. Your customers see a plain CAD amount — no US dollars, no conversion line on their statement.',
  },
  {
    q: 'Can I bill per cut, or a flat monthly amount?',
    a: 'Both. Invoice each cut as it happens, or set a customer up on flat monthly card-on-file billing and let the charge run itself. Either way it bills in CAD, and spring or fall cleanups can be added to the same customer without setting anything up twice.',
  },
  {
    q: 'What does the subscription itself cost in Canada?',
    a: 'The plan is $79 USD a month with every feature included — no tiers, no per-user fees. The subscription is priced in US dollars, so your card is charged in USD and your bank converts it. We say that plainly because a surprise conversion on your statement is exactly the kind of thing software companies bury.',
  },
  {
    q: 'Does the automated texting work in Canada?',
    a: 'It works, but it is not instant. Sending automated texts in Canada requires registering a Canadian sending number with the carriers, which we set up with you during onboarding — it takes some lead time, not a flipped switch on day one. Email alerts and customer-app notifications work everywhere from your first day.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes — 14 days, full access, no credit card required to start. Set your country to Canada during setup and your account bills customers in CAD from the very first invoice.',
  },
  {
    q: 'Do I have to book a demo call first?',
    a: 'No. The demo at the top of this page is the real software connected to a live demo company — office dashboard, crew app, and customer app. Nobody is notified that you looked, and nobody will call you.',
  },
];

function openTrial(el: HTMLElement) {
  (window as any).__openSignup?.(1, el);
}

export default function Page() {
  /* FAQPage structured data, built from the same array rendered below so they can't drift. */
  useEffect(() => {
    const ID = 'canada-faq-ld';
    if (document.getElementById(ID)) return;
    const s = document.createElement('script');
    s.id = ID;
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
    document.head.appendChild(s);
    return () => { document.getElementById(ID)?.remove(); };
  }, []);

  return (
    <>
      <Navbar onTrialClick={openTrial} />

      {/* ═══ PRICE + LIVE DEMO — same fold order as the homepage ═══ */}
      <div style={{background:'linear-gradient(135deg, #04162e 0%, #06203f 60%, #0a3161 100%)', padding:'clamp(76px,7vw,80px) clamp(14px,4vw,40px) 0', textAlign:'center'}}>
        <div style={{textAlign:'center', marginBottom:'clamp(22px,3vw,32px)'}}>
          <div style={{display:'inline-flex', alignItems:'baseline', gap:'12px', flexWrap:'wrap', justifyContent:'center', color:'#fff'}}>
            <span style={{fontSize:'clamp(30px,4.6vw,46px)', fontWeight:800, lineHeight:1}}>$79<span style={{fontSize:'.46em', fontWeight:700, color:'rgba(255,255,255,.6)'}}>/month</span></span>
            <span style={{fontSize:'clamp(16px,2.2vw,22px)', fontWeight:800, color:'var(--orange)'}}>&middot; 14-Day Free Trial</span>
          </div>
          <div style={{color:'rgba(255,255,255,.6)', fontSize:'13px', fontWeight:600, marginTop:'7px', letterSpacing:'.3px'}}>No credit card required &middot; Cancel anytime &middot; Bills your customers in CAD</div>
        </div>
        <HeroDemo />
      </div>

      {/* ═══ HERO ═══ */}
      <div className="hero" style={{paddingTop:'clamp(44px,5vw,60px)'}}>
        <div className="hero-badge">Works in Canada &middot; CAD Invoicing Built In</div>
        <h1>Lawn Mowing Software<br /><span>Built for the Canadian Season</span></h1>
        <p>A Canadian mowing season is a sprint &mdash; first cuts around the May long weekend, last cuts and fall cleanups racing the leaves in October, and every rained-out Tuesday in between has to land somewhere. MowBossPro holds your weekly routes together through all of it, and bills your customers in Canadian dollars while it does. The demo above is the real software &mdash; go click it.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openTrial(e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$79/mo</b> after</div>
        </div>
      </div>

      {/* ═══ MOST DEMOS ARE A PHONE CALL ═══ */}
      <div className="vs-band">
        <div className="vs-inner" style={{textAlign:'center'}}>
          <span className="section-label">The Difference</span>
          <h2 className="section-title">Most &ldquo;Demos&rdquo; Are a Phone Call</h2>
          <p className="section-sub" style={{margin:'0 auto 44px'}}>
            Search for mowing software from anywhere in Canada and every demo button wants your name, your number, and a slot on a salesperson&apos;s calendar. Ours is the thing at the top of this page &mdash; it is already running.
          </p>
          <table className="vs-table">
            <thead>
              <tr>
                <th></th>
                <th className="sbp-col">MowBossPro</th>
                <th className="other-col">Typical mowing software</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>See the software</td><td className="sbp-col">Right now</td><td className="other-col">After a scheduled call</td></tr>
              <tr><td>Give your phone number</td><td className="sbp-col">Never</td><td className="other-col">Required</td></tr>
              <tr><td>Bill customers in CAD</td><td className="sbp-col">Built in</td><td className="other-col">Workarounds, or USD</td></tr>
              <tr><td>Credit card for the trial</td><td className="sbp-col">Never</td><td className="other-col">Often</td></tr>
              <tr><td>Data in the demo</td><td className="sbp-col">A full company</td><td className="other-col">Empty, or a slide deck</td></tr>
              <tr><td>Crew &amp; customer apps</td><td className="sbp-col">Both, live</td><td className="other-col">Screenshots</td></tr>
              <tr><td>Sales follow-up</td><td className="sbp-col">None</td><td className="other-col">Expect it</td></tr>
            </tbody>
          </table>
          <p className="vs-note">No form stands between you and the demo above. There is nothing to fill in.</p>
        </div>
      </div>

      {/* ═══ SIX FEATURE CARDS — the quick tour ═══ */}
      <div style={{background:'#fff', padding:'96px 40px'}}>
        <div style={{maxWidth:'1200px', margin:'0 auto', textAlign:'center'}}>
          <span className="section-label">Built for a Short Season</span>
          <h2 className="section-title">Twenty-Some Weeks to Make the Whole Year</h2>
          <p className="section-sub" style={{margin:'0 auto 56px'}}>
            When the mowing season opens on the May long weekend and shuts down when the leaves come, there is no slack in the calendar. Every piece of MowBossPro exists to keep those weeks full and paid for.
          </p>
          <div className="feat-grid">
            <div className="feat-card"><span className="feat-icon">🇨🇦</span><h3>Bill in Canadian dollars, natively</h3><p>Set your country to Canada in Company Info and every invoice, card charge, and Pay Now link bills your customers in CAD through your own Canadian Stripe account. No USD on their statements, no conversion complaints, nothing to configure per customer.</p></div>
            <div className="feat-card"><span className="feat-icon">📅</span><h3>Cut schedules that hold their day</h3><p>Put a lawn on weekly or bi-weekly and it keeps its route day &mdash; the Tuesday yards stay Tuesday yards. Visits generate themselves all season, so your week fills in without you rebuilding it every Sunday night.</p></div>
            <div className="feat-card"><span className="feat-icon">🏘️</span><h3>Neighbourhood route density</h3><p>Draw a circle around a crescent on the map and see every property, service, and lawn square foot inside it before you commit a truck. Stack whole streets into one trailer drop instead of criss-crossing town.</p></div>
            <div className="feat-card"><span className="feat-icon">🌧️</span><h3>Rain weeks without the phone chaos</h3><p>When Tuesday washes out, push the day&apos;s stops instead of calling forty customers. Reschedule alerts go out automatically, and the cut cycle stays intact underneath &mdash; next week is still next week.</p></div>
            <div className="feat-card"><span className="feat-icon">🍂</span><h3>Spring &amp; fall cleanups, same customer</h3><p>The opening cleanup and the October leaf race live on the same customer and property as the weekly cut &mdash; estimate it, schedule it, and invoice it alongside the mowing without duplicate records.</p></div>
            <div className="feat-card"><span className="feat-icon">📱</span><h3>A crew app and a customer app</h3><p>Your crew gets the day&apos;s stop list with gate notes on their phones; your customers get their own app for skip requests, invoices, and payments. Both included, both working in Canada today.</p></div>
          </div>
        </div>
      </div>

      {/* ═══ DEEP DIVE: CUT SCHEDULES / ROUTE DAYS ═══ */}
      <section id="schedules">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Cut Schedules</span>
            <h2>The Tuesday Yards Stay Tuesday Yards</h2>
            <p>A mowing route only makes money when it holds its shape. MowBossPro pins every recurring lawn to its cycle and its route day, then generates the visits for you week after week &mdash; so a season that only runs twenty-some weeks doesn&apos;t leak any of them to scheduling drift.</p>
            <ul className="check-list">
              <li>Weekly, bi-weekly, monthly, or fully custom cut cycles per property</li>
              <li>Visits generate automatically and land on the right route day</li>
              <li>Bi-weekly lawns alternate correctly without a spreadsheet tracking whose week it is</li>
              <li>Skip a visit for weather or vacation without breaking the cycle</li>
              <li>See the week&apos;s visits before they hit the schedule</li>
              <li>Renewal reminders so seasonal agreements don&apos;t quietly lapse over winter</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>This Week &mdash; Recurring Cuts</div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">Tuesday &mdash; Weekly route</div><div className="mock-sub">32 lawns &middot; holds its day all season</div></div><div className="mock-badge green-badge">Set</div></div>
            <div className="mock-item"><div className="mock-dot blue"></div><div><div className="mock-label">Wednesday &mdash; Bi-weekly A</div><div className="mock-sub">18 lawns &middot; alternates with week B</div></div><div className="mock-badge blue-badge">Set</div></div>
            <div className="mock-item"><div className="mock-dot orange"></div><div><div className="mock-label">Thursday &mdash; Weekly route</div><div className="mock-sub">27 lawns &middot; generated automatically</div></div><div className="mock-badge">Set</div></div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'var(--orange)', fontSize:'16px', fontWeight:700}}>Nothing rebuilt by hand.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>The cycle generates the week; you just run it.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DEEP DIVE: NEIGHBOURHOOD DENSITY ═══ */}
      <section id="density" style={{background:'var(--light-bg)'}}>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Route Density</span>
            <h2>Whole Crescents, One Trailer Drop</h2>
            <p>The most profitable hour in mowing is the one where the trailer never moves. On the MowBossPro map you can draw a circle around any neighbourhood &mdash; a crescent, a subdivision, a corridor &mdash; and instantly see every property, every service, and the total lawn square footage sitting inside it.</p>
            <p style={{marginTop:'12px'}}>That turns route building into a density decision instead of a guess: see which streets are worth a truck, quote the neighbours around your existing stops, and drop the whole circle onto the dispatch board at once.</p>
            <ul className="check-list">
              <li>Circle any area on the map and see every property inside it</li>
              <li>Total lawn square footage and service counts for the circled area</li>
              <li>Schedule everything in the circle at once &mdash; straight to the dispatch board</li>
              <li>Drag-and-drop stop ordering so crews mow down the street, not across town</li>
              <li>Full Google mapping on Canadian streets and postal-code addresses</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Circle Selection &mdash; One Crescent</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}><div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>11</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Properties Inside</div></div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}><div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>1</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Trailer Drop</div></div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}><div style={{color:'var(--orange)', fontSize:'20px', fontWeight:700}}>84,600</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Lawn Sq Ft</div></div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}><div style={{color:'var(--orange)', fontSize:'20px', fontWeight:700}}>0 km</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Driving Between Stops</div></div>
            </div>
            <button style={{width:'100%', background:'var(--orange)', color:'#fff', border:'none', borderRadius:'8px', padding:'13px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit'}}>Schedule These 11 Stops →</button>
            <div style={{marginTop:'10px', textAlign:'center', color:'rgba(255,255,255,.35)', fontSize:'11px'}}>Drops to the dispatch board with a full route map</div>
          </div>
        </div>
      </section>

      {/* ═══ DEEP DIVE: RAIN WEEKS ═══ */}
      <section id="rain" className="dark-section">
        <div className="highlight-row" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <div className="highlight-text">
            <span className="section-label" style={{color:'var(--orange)'}}>Rain Weeks</span>
            <h2 style={{color:'#fff'}}>When Tuesday Washes Out,<br />Nobody Has to Work the Phones</h2>
            <p style={{color:'rgba(255,255,255,.7)'}}>Every Canadian mowing company loses days to rain. What it doesn&apos;t have to lose is the evening spent calling every customer on the route. In MowBossPro you push the washed-out stops to another day, the reschedule alerts go out on their own, and the recurring cycle underneath doesn&apos;t move &mdash; next week&apos;s cut is still next week&apos;s cut.</p>
            <ul className="check-list">
              <li style={{color:'rgba(255,255,255,.75)'}}>Move a full day of stops without touching each one</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Automatic reschedule alerts to every affected customer</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Skip a cut entirely without breaking the cycle</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>The dispatch board shows what got absorbed where</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Rained Out &mdash; Tuesday</div>
            <div className="mock-item"><span style={{fontSize:'20px'}}>🌧️</span><div><div className="mock-label">Tuesday route &mdash; 32 stops</div><div className="mock-sub">Pushed to Wednesday &amp; Thursday</div></div><div className="mock-badge">Moved</div></div>
            <div className="mock-item"><span style={{fontSize:'20px'}}>💬</span><div><div className="mock-label">Reschedule alerts</div><div className="mock-sub">Sent to all 32 customers automatically</div></div><div className="mock-badge green-badge">Sent</div></div>
            <div className="mock-item"><span style={{fontSize:'20px'}}>🔁</span><div><div className="mock-label">Cut cycles</div><div className="mock-sub">Unchanged &mdash; next week generates as normal</div></div><div className="mock-badge blue-badge">Intact</div></div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'var(--orange)', fontSize:'16px', fontWeight:700}}>Zero phone calls made.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>The rained-out day gets absorbed, not re-negotiated.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DEEP DIVE: SPRING & FALL CLEANUPS ═══ */}
      <section id="cleanups">
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Cleanups</span>
            <h2>The Season Opens and Closes<br />on the Same Customer Record</h2>
            <p>Spring cleanups kick the season off and the October leaf race closes it out &mdash; and both belong to the same customers you mow all summer. In MowBossPro a cleanup is just another service on the property: estimate it, drop it on the schedule, and invoice it next to the weekly cut without creating anything twice.</p>
            <ul className="check-list">
              <li>Add cleanup services to an existing customer and property in seconds</li>
              <li>Estimate the cleanup, get one-click acceptance, convert to an invoice</li>
              <li>Fall cleanups schedule onto the same routes and crews as the mowing</li>
              <li>Service history keeps cuts and cleanups on one property timeline</li>
              <li>Fully custom service types &mdash; name them the way your operation talks</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>One Property &mdash; Full Season</div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">Spring Cleanup</div><div className="mock-sub">May &middot; opens the season</div></div><div className="mock-badge green-badge">Done</div></div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">Weekly Mowing &times; 22</div><div className="mock-sub">May &rarr; October &middot; holds its route day</div></div><div className="mock-badge green-badge">Running</div></div>
            <div className="mock-item"><div className="mock-dot orange"></div><div><div className="mock-label">Fall Cleanup</div><div className="mock-sub">October &middot; racing the leaves</div></div><div className="mock-badge">Booked</div></div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'var(--orange)', fontSize:'16px', fontWeight:700}}>One customer. One record.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>Cuts and cleanups share the property, the history, and the card on file.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DEEP DIVE: CAD BILLING ═══ */}
      <section id="cad-billing" style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Canadian Billing</span>
            <h2>Per Cut or Flat Monthly &mdash;<br />Either Way, It Bills in CAD</h2>
            <p>Set your country to Canada on the Company Info page and MowBossPro bills your customers in Canadian dollars from that moment on &mdash; every invoice, every card-on-file charge, every Pay Now link, all through your own Canadian Stripe account. Charge per cut as the season runs, or put steady customers on a flat monthly amount and let the charge run itself.</p>
            <ul className="check-list">
              <li>Every customer invoice and card charge in Canadian dollars</li>
              <li>Your own Canadian Stripe account &mdash; your money never routes through us</li>
              <li>Per-cut invoicing or flat monthly card-on-file billing per customer</li>
              <li>Pay Now links customers settle from their phone</li>
              <li>Automated payment follow-ups chase unpaid invoices for you</li>
              <li>Full payment history &mdash; method, date, and reference on every dollar</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Invoice #0187 &mdash; Billed in CAD</div>
            <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', marginBottom:'10px'}}>
              <div style={{display:'flex', justifyContent:'space-between', color:'rgba(255,255,255,.85)', fontSize:'13px', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                <span>Weekly Mowing &mdash; 4 cuts</span><span>$220.00</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', color:'rgba(255,255,255,.85)', fontSize:'13px', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                <span>Fall Cleanup</span><span>$140.00</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', color:'#fff', fontSize:'14px', fontWeight:700, paddingTop:'8px', marginTop:'4px'}}>
                <span>Total</span><span style={{color:'var(--orange)'}}>$360.00 CAD</span>
              </div>
            </div>
            <div style={{display:'flex', gap:'8px', marginTop:'4px'}}>
              <div style={{flex:1, background:'#16a34a', borderRadius:'6px', padding:'10px', textAlign:'center', color:'#fff', fontSize:'13px', fontWeight:700}}>Card on File Charged</div>
              <div style={{flex:1, background:'rgba(255,255,255,.08)', borderRadius:'6px', padding:'10px', textAlign:'center', color:'rgba(255,255,255,.5)', fontSize:'13px'}}>Pay Now Link</div>
            </div>
            <div style={{marginTop:'12px', textAlign:'center', color:'rgba(255,255,255,.35)', fontSize:'11px'}}>Through your own Canadian Stripe account &mdash; customers see plain CAD.</div>
          </div>
        </div>

        {/* Real product proof — an actual Stripe payment page from a Canada-set company on the
            platform (the founder's own lawn company). Not a mockup; not edited. */}
        <div style={{maxWidth:'860px', margin:'64px auto 0', textAlign:'center'}}>
          <img
            src="/cad-checkout.png"
            alt="Stripe payment page from MowBossPro showing Hamann Lawn Care — Invoice #459 for CA$9.74, with card fields and a Pay button"
            style={{width:'100%', maxWidth:'860px', height:'auto', borderRadius:'14px', border:'1.5px solid var(--border)', boxShadow:'0 12px 40px rgba(4,22,46,.14)', background:'#fff'}}
          />
          <p style={{color:'var(--muted)', fontSize:'13px', lineHeight:1.6, marginTop:'14px', maxWidth:'640px', marginLeft:'auto', marginRight:'auto'}}>
            A real payment page from the platform &mdash; a Canada-set company&apos;s customer pays in Canadian dollars. (The founder&apos;s own company.) The country selector is Stripe&apos;s standard field; customers pick their own country at checkout.
          </p>
        </div>
      </section>

      {/* ═══ DEEP DIVE: CREW APP ═══ */}
      <section id="crew-app">
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">The Crew App</span>
            <h2>The Day&apos;s Stops, the Gate Notes,<br />and Nothing Else</h2>
            <p>Your crew doesn&apos;t need the office software &mdash; they need today. The MowBossPro crew app puts the stop list on their phones in route order, with the property notes and gate details attached to each address, and one big button to mark the yard done and roll to the next one.</p>
            <ul className="check-list">
              <li>Today&apos;s stop list in route order, per crew</li>
              <li>Gate notes and property details attached to every stop</li>
              <li>One tap to mark complete, skip, or add a note</li>
              <li>What the crew finishes shows up in the office instantly</li>
              <li>Role-based access &mdash; crews see their stops, not your books</li>
              <li>Try it live in the demo at the top of this page &mdash; tap the crew app tab</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Crew Phone &mdash; Stop 6 of 27</div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">14 Birchwood Cres.</div><div className="mock-sub">Weekly cut &middot; gate code 4418 &middot; dog in yard</div></div><div className="mock-badge blue-badge">Up Next</div></div>
            <div className="mock-item"><div className="mock-dot orange"></div><div><div className="mock-label">18 Birchwood Cres.</div><div className="mock-sub">Bi-weekly &middot; side gate latch sticks</div></div><div className="mock-badge">Queued</div></div>
            <div className="mock-item"><div className="mock-dot blue"></div><div><div className="mock-label">22 Birchwood Cres.</div><div className="mock-sub">Weekly cut &middot; leave clippings bagged</div></div><div className="mock-badge">Queued</div></div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'var(--orange)', fontSize:'16px', fontWeight:700}}>Mark done. Next stop.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>Built for a phone in a truck, not a desk in an office.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DEEP DIVE: CUSTOMER APP ═══ */}
      <section id="customer-app" style={{background:'linear-gradient(135deg,#04162e,#06203f)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto', textAlign:'center'}}>
          <span className="section-label">The Customer App</span>
          <h2 className="section-title" style={{color:'#fff'}}>Your Customers Get Their Own App &mdash;<br />Skips, Invoices, and Payments Included</h2>
          <p className="section-sub" style={{color:'rgba(255,255,255,.7)', margin:'0 auto 48px'}}>Every customer gets a branded app on their phone &mdash; no app store, no password to remember. Going to the lake for two weeks? They request the skip themselves instead of leaving a voicemail. And you decide feature by feature what each customer can see.</p>
        </div>
        <div style={{maxWidth:'1000px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'14px 40px'}}>
          {[
            'Request a skip or reschedule a visit without calling the office',
            'See upcoming cuts and full service history for their property',
            'View and pay invoices in CAD from their phone — card on file, one-tap Pay Now',
            'Update their card, contact you, or refer a neighbour',
            'Get alerts their way — email or app notification from day one',
            'You flip any feature on or off per customer with a single switch',
          ].map((t, i) => (
            <div key={i} style={{display:'flex', gap:'10px', alignItems:'flex-start', color:'rgba(255,255,255,.82)', fontSize:'15px', lineHeight:1.6}}>
              <span style={{color:'var(--orange)', fontWeight:800, flexShrink:0}}>✓</span><span>{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ OFFICE / CREW / CUSTOMER — THREE APPS ═══ */}
      <div style={{background:'var(--light-bg)', padding:'96px 40px'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto', textAlign:'center'}}>
          <span className="section-label">All Three, in the Demo</span>
          <h2 className="section-title">Office, Crew, and Customer &mdash; One Backend</h2>
          <p className="section-sub" style={{margin:'0 auto 56px'}}>
            The picker above the demo at the top of this page swaps between the three apps that make up the system. They share one backend, so a lawn your crew finishes on a crescent in Moncton or Medicine Hat shows up in the office and on the customer&apos;s phone at the same moment.
          </p>
          <div className="steps-grid">
            <div className="step-box">
              <div className="step-circle">1</div>
              <h3>The office</h3>
              <p>Scheduling, the circle-map route builder, estimates, CAD invoicing, and the dispatch board. What you run the business from.</p>
            </div>
            <div className="step-box">
              <div className="step-circle">2</div>
              <h3>The crew app</h3>
              <p>Today&apos;s stop list in route order, gate notes, property details, and one-tap complete or skip.</p>
            </div>
            <div className="step-box">
              <div className="step-circle">3</div>
              <h3>The customer app</h3>
              <p>What your customers get &mdash; visits, skip requests, invoices in CAD, and one-tap payment.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" style={{background:'#fff'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Simple Pricing</span>
          <h2 className="section-title">One Flat Price. Every Feature. No Per-User Fees.</h2>
          <p className="section-sub" style={{margin:'0 auto 56px'}}>The plan is $79 USD a month with everything included &mdash; and to be plain about it up front: the subscription itself bills in US dollars and your bank converts, while everything your <em>customers</em> see bills in Canadian dollars. Full detail in the FAQ below.</p>
        </div>
        <div style={{maxWidth:'520px', margin:'0 auto'}}>
          <div className="price-card featured" style={{width:'100%'}}>
            <div className="featured-badge">Everything Included</div>
            <div className="price-tier">One Plan. No Surprises.</div>
            <div className="price-amount"><sup>$</sup>79</div>
            <div className="price-period">per month (USD) &middot; customers billed in CAD</div>
            <div className="price-desc">Every feature. Unlimited clients, properties, employees, and users. No tiers, no locked features, no per-seat fees.</div>
            <ul className="price-features">
              <li>Customer invoicing &amp; card charges in CAD</li>
              <li>Unlimited Clients, Properties &amp; Leads</li>
              <li>Unlimited Employees &amp; Users</li>
              <li>Full Scheduling, Dispatch &amp; Route Map</li>
              <li>Recurring Visits &amp; Cut Cycles</li>
              <li>Estimates, Invoices &amp; Stripe Payments</li>
              <li>Crew App &amp; Customer App</li>
              <li>Automated Email &amp; App Alerts</li>
              <li>Canadian SMS after carrier registration</li>
            </ul>
            <a href="#" onClick={(e) => { e.preventDefault(); openTrial(e.currentTarget as HTMLElement); }} className="price-btn price-btn-primary">Start Your 14-Day Free Trial</a>
          </div>
        </div>
        <p style={{textAlign:'center', color:'var(--muted)', fontSize:'13px', marginTop:'32px'}}>No contracts. Cancel anytime. No hidden fees &mdash; ever.</p>
      </section>

      {/* ═══ FAQ ═══ */}
      <div style={{background:'var(--light-bg)', padding:'96px 40px'}}>
        <div style={{maxWidth:'820px', margin:'0 auto'}}>
          <div style={{textAlign:'center'}}>
            <span className="section-label">Questions</span>
            <h2 className="section-title">Straight Answers for Canadian Operators</h2>
          </div>
          <div style={{marginTop:'48px'}}>
            {faqs.map(f => (
              <div key={f.q} style={{borderBottom:'1px solid var(--border)', padding:'22px 0'}}>
                <h3 style={{fontSize:'17px', fontWeight:700, color:'var(--text)', marginBottom:'10px'}}>{f.q}</h3>
                <p style={{color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CTA ═══ */}
      <div className="cta-band">
        <h2>The Season Is Short.<br />The Setup Isn&apos;t.</h2>
        <p>Set your country to Canada, connect your Stripe account, and bill your first customer in CAD before the next cut. 14 days free, every feature, no card up front.</p>
        <div className="hero-btns">
          <button className="btn-primary" style={{fontSize:'17px', padding:'18px 44px'}} onClick={(e) => openTrial(e.currentTarget as HTMLElement)}>Start Your 14-Day Free Trial</button>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$79/mo</b> after</div>
        </div>
      </div>

      <SignupModal />
    </>
  );
}
