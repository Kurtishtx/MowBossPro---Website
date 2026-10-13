'use client';

/* Three plans, compared side by side. Ported from sprayboss-website, the suite's reference
 * implementation - same structure and behaviour, this trade's wording.
 *
 * Original note follows.
 *
 * Three plans, compared side by side.
 *
 * The point of the table is that a solo operator can see a door in at $59 without the $199 plan
 * looking padded — so what Start LACKS is shown, greyed and struck, rather than hidden. Someone
 * comparing wants to know what they give up, and a feature list that only ever says "yes" reads
 * as marketing.
 *
 * Only OUTBOUND is metered. Inbound replies cost us a fraction of a cent and are the whole
 * point of the product - charging for them would train people not to use it. Extra blocks are
 * 500 for $15 on every plan and do NOT roll over; the block price comes from pricing.html,
 * which still claims they roll over and needs correcting.
 *
 * NOT collapsed behind a "compare features" toggle, deliberately. The owner - who is the buyer
 * this page is written for - wants every line visible at a glance so a reader can see what the
 * software does without clicking. Left open on purpose; do not "tidy" it into an accordion.
 */

type Cell = string | boolean;

const PLANS = [
  { key: 'start', name: 'Start', price: 59,  tag: 'Solo mower, one truck' },
  /* Named Pro, not Solo, for the same reason Crew is not called Unlimited: the plan carries
     3 users and 3 trucks, which is not one person however you read it. A name the
     table contradicts costs more trust than a plain one ever earns. */
  { key: 'solo',  name: 'Pro',   price: 89,  tag: 'Small crew, fully equipped', featured: true },
  /* Named Crew, not Unlimited. Texts are capped on every plan, and a plan called
     Unlimited that stops sending in week three reads as a bait-and-switch however fair the
     cap is. Users and trucks ARE unlimited here (employees are unlimited on every plan) - that belongs in the table as a
     line you can check, not in the name as a promise the texting row contradicts. */
  { key: 'unl',   name: 'Crew',  price: 199, tag: 'Multiple crews and routes' },
];

/* Ordered so the ticks stack into solid blocks rather than scattering.
 *
 *   1. the numbers — what each plan lets you have
 *   2. everything on ALL THREE plans — Start's column is an unbroken run of ticks
 *   3. everything Solo and up — an unbroken run of dashes beneath it
 *
 * A reader can then see where Start stops by looking for the line, instead of tracking a
 * checkerboard down twenty rows. */
const ROWS: { label: string; note?: string; cells: [Cell, Cell, Cell] }[] = [
  /* ── What each plan lets you have ── */
  { label: 'Users', note: 'Office logins - the people who schedule, invoice and see the money',
                                                     cells: ['2', '3', 'Unlimited'] },
  { label: 'Employees', note: 'Crew-app seats - they run the route and complete jobs, they never see the money. Unlimited on every plan.',
                                                     cells: ['Unlimited', 'Unlimited', 'Unlimited'] },
  /* Trucks move separately from users: a second user on Start is the spouse doing the books,
     not a second truck in the field. Pricing them together priced the wrong thing. */
  { label: 'Trucks',                                 cells: ['1', '2', 'Unlimited'] },
  { label: 'Clients & properties',                   cells: ['Unlimited', 'Unlimited', 'Unlimited'] },
  { label: 'Texts included (sent + received, US & Canada)', note: '[[500 extra texts for $15]] on any plan. Sent and received both count. A text is 160 characters; a longer one counts as two.',
                                                     cells: ['500 / month', '1,000 / month', '2,000 / month'] },
  { label: 'Smart Lasso map selections',             cells: ['Unlimited', 'Unlimited', 'Unlimited'] },
  { label: 'Auto-routing', note: '[[250 extra auto-routes for $5]] on any plan, added automatically when you need them.',
                                                     cells: ['50 / month', '100 / month', '1,000 / month'] },

  /* ── On every plan ── */
  { label: 'Scheduling, waiting list & job board',   cells: [true, true, true] },
  { label: 'Package plans & recurring services',     cells: [true, true, true] },
  { label: 'Estimates, templates & follow-ups',      cells: [true, true, true] },
  { label: 'Invoicing',                              cells: [true, true, true] },
  { label: 'Card on file & customer payments',       cells: [true, true, true] },
  { label: 'Client app', note: 'Your customer signs in by text — sees their schedule, invoices, pays, and sets their own alert preferences',
                                                     cells: [true, true, true] },
  /* On Start the operator IS the crew, so the field app is the half they use most — routing the
     day, starting and finishing jobs from the truck. Holding it back would leave the cheapest
     plan as an office tool for someone who is not in an office. */
  { label: 'Crew app', note: 'Route the day, start and complete jobs, before/after photos, area treated',
                                                     cells: [true, true, true] },
  { label: 'Schedule alerts',                        cells: [true, true, true] },
  { label: 'Estimate alerts',                        cells: [true, true, true] },
  { label: 'Receive customer replies',               cells: [true, true, true] },
  { label: 'Web lead forms',                         cells: [true, true, true] },
  { label: 'Sales tax & reporting',                  cells: [true, true, true] },
  { label: 'QuickBooks export',                      cells: [true, true, true] },
  { label: 'Import your existing customers', note: 'Including Real Green and Service Autopilot exports',
                                                     cells: [true, true, true] },
  /* Compliance is a legal obligation, not a convenience: a licensed applicator has to produce
     records on a state request whatever they pay us, and the crew app was already recording the
     applications on Start - the gate only withheld the report from the tenant's own data. */
  /* Employees are uncapped on every plan, so the clock is on everywhere - gating it never sold a Pro plan, it just left the
     smallest shops keeping hours on paper. */
  { label: 'Employee time clock & hours',            cells: [true, true, true] },
  /* The one alert on every plan besides scheduling: on Start the owner IS the crew, and this is
     the text that stops the "nobody told me you were coming" call. It spends the plan's own
     text allowance, so a busy Start account pays for the volume through blocks. */
  { label: '"On the way" text', note: 'Your crew sends it from the truck when the customer is next up',
                                                     cells: [true, true, true] },

  /* ── Solo and up ── */
  { label: 'Reply back to customers',                cells: [false, true, true] },
  { label: 'All other automated alerts', note: 'Arrived, completed, follow-up, review request and the rest',
                                                     cells: [false, true, true] },
  { label: 'Automated invoice sending',              cells: [false, true, true] },
  { label: 'Automatic card charging',                cells: [false, true, true] },

];

/* A note can mark the part that matters with [[double brackets]] and it renders in brand
   orange. Orange rather than yellow: orange already means "look here" on this page (the badge,
   the featured column), while yellow reads as a warning about a charge rather than a plain
   fact about one. */
/* On a phone the table has to FIT, not scroll - a comparison you have to drag sideways stops
   being a comparison, because you can never see the column you are comparing against. Three
   things make it fit at 360px: the label column narrows, the notes drop away, and the wide
   values abbreviate.

   Both forms are rendered and CSS picks one, rather than measuring the viewport in JS: the table
   is server-rendered, and a JS-chosen variant would flash the wrong one on first paint. */
function abbreviate(v: string): string {
  if (v === 'Unlimited') return '\u221e';
  return v.replace(/\s*\/\s*month$/, '').replace(/^(\d[\d,]*)\s.*$/, '$1');
}

const RESPONSIVE_CSS = `
  .pc-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .pc-table { width: 100%; border-collapse: collapse; color: var(--text); min-width: 560px; }
  .pc-abbr { display: none; }
  @media (max-width: 600px) {
    .pc-wrap  { overflow-x: visible; }
    .pc-table { min-width: 0; }
    .pc-label { width: 46% !important; padding: 8px 6px !important; font-size: 12px !important; }
    .pc-note  { display: none; }
    .pc-cell  { padding: 8px 2px !important; font-size: 12px !important; }
    .pc-head  { padding: 10px 2px 12px !important; }
    .pc-name  { font-size: 12px !important; }
    .pc-price { font-size: 19px !important; }
    .pc-per, .pc-tag { display: none; }
    .pc-full  { display: none; }
    .pc-abbr  { display: inline; }
  }
`;

function NoteText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\[\[(.+?)\]\]/).map((part, k) =>
        k % 2
          ? <b key={k} style={{ color: 'var(--orange)' }}>{part}</b>
          : <span key={k}>{part}</span>
      )}
    </>
  );
}


function Mark({ v }: { v: Cell }) {
  if (v === true)  return <span style={{ color: '#27a567', fontWeight: 800, fontSize: 17 }}>✓</span>;
  if (v === false) return <span style={{ color: '#b5b5c2', fontWeight: 700, fontSize: 15 }} title="Not on this plan">—</span>;
  const short = abbreviate(v);
  if (short === v) return <span style={{ fontWeight: 700 }}>{v}</span>;
  return (
    <span style={{ fontWeight: 700 }}>
      <span className="pc-full">{v}</span>
      <span className="pc-abbr">{short}</span>
    </span>
  );
}

export default function PlanCompare({ onTrial }: { onTrial?: (el: HTMLElement) => void }) {
  return (
    <section id="plans" style={{ background: '#faf9fc', padding: 'clamp(48px,6vw,72px) clamp(14px,4vw,24px)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 'clamp(24px,3vw,34px)' }}>
          <span className="section-label">Pricing</span>
          <h2 style={{ fontSize: 'clamp(26px,3.4vw,40px)', fontWeight: 800, color: 'var(--text)', margin: '8px 0 10px' }}>
            Pick the size you actually are
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 620, margin: '0 auto', lineHeight: 1.6 }}>
            Every plan is the same software. The bigger plans lift the limits and turn on the
            automation — you are never paying for seats you do not have.
          </p>
        </div>

        {/* The table scrolls sideways on a phone rather than squeezing three price columns
            into 360px, which is how comparison tables normally become unreadable. */}
        <style>{RESPONSIVE_CSS}</style>
        <div className="pc-wrap">
          <table className="pc-table">
            <thead>
              <tr>
                <th className="pc-label" style={{ textAlign: 'left', padding: '0 12px 16px', width: '34%' }} />
                {PLANS.map(p => (
                  <th key={p.key} className="pc-head" style={{
                    padding: '18px 12px 16px', textAlign: 'center', verticalAlign: 'bottom',
                    background: p.featured ? 'rgba(224,120,32,.10)' : 'transparent',
                    borderTop: p.featured ? '2px solid var(--orange)' : '2px solid transparent',
                    borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
                    borderRadius: '10px 10px 0 0',
                  }}>
                    {p.featured && (
                      <div style={{ color: 'var(--orange)', fontSize: 11, fontWeight: 800, letterSpacing: '.08em', marginBottom: 6 }}>
                        MOST POPULAR
                      </div>
                    )}
                    <div className="pc-name" style={{ fontSize: 15, fontWeight: 800, letterSpacing: '.04em' }}>{p.name}</div>
                    <div className="pc-price" style={{ fontSize: 'clamp(28px,3.2vw,38px)', fontWeight: 900, lineHeight: 1.1, marginTop: 4 }}>
                      <sup style={{ fontSize: '.5em', verticalAlign: 'super' }}>$</sup>{p.price}
                    </div>
                    <div className="pc-per" style={{ fontSize: 12, color: 'var(--muted)' }}>per month</div>
                    <div className="pc-tag" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, minHeight: 32 }}>{p.tag}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.label} style={{ background: i % 2 ? 'rgba(0,0,0,.02)' : 'transparent' }}>
                  <td className="pc-label" style={{ padding: '11px 12px', fontSize: 14, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600 }}>{r.label}</div>
                    {r.note && (
                      <div className="pc-note" style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2, lineHeight: 1.45 }}><NoteText text={r.note} /></div>
                    )}
                  </td>
                  {r.cells.map((c, ci) => (
                    <td key={ci} className="pc-cell" style={{
                      padding: '11px 12px', textAlign: 'center', fontSize: 13.5,
                      borderTop: '1px solid var(--border)',
                      borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
                      background: PLANS[ci].featured ? 'rgba(224,120,32,.06)' : 'transparent',
                      color: c === false ? '#9a9aa8' : 'var(--text)',
                    }}>
                      <Mark v={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 18, lineHeight: 1.7 }}>
          14-day free trial on every plan &middot; no card to start &middot; cancel anytime &middot; move up or down whenever you like.
          <br />
          Need more? <b style={{ color: 'var(--orange)' }}>500 extra texts for $15</b> on any plan &middot; counted sent and received, 160 characters per text.
        </p>
      </div>
    </section>
  );
}
