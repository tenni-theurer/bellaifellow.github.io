const fs = require('fs');

// ---- Event definitions (single source of truth) ----
const TRACKS = {
  civ:     { name: 'AI and Civilization', cls: 'civ' },
  shaping: { name: 'How Society Shapes Technology', cls: 'shaping' },
  hac:     { name: 'Homebrew AI Club', cls: 'hac' },
};

const SERIES = [
  { track:'civ', label:'AI and Civilization', short:'Civilization', time:'4:00–6:00pm',
    mode:'in person', wait:false,
    dates:['2026-09-27','2026-10-04','2026-10-11','2026-10-18','2026-10-25','2026-11-01'] },
  { track:'shaping', label:'How Society Shapes Technology — video', short:'Shaping Tech', time:'6:30–8:30pm',
    mode:'video', wait:false,
    dates:['2026-09-30','2026-10-07','2026-10-14','2026-10-21','2026-10-28','2026-11-04'] },
  { track:'hac', label:'HAC Advanced', short:'HAC Adv', time:'5:00–6:30pm',
    mode:'hybrid', wait:false,
    dates:['2026-10-01','2026-10-15','2026-10-29','2026-11-12','2026-12-03','2026-12-17'] },
  { track:'hac', label:'HAC Intermediate', short:'HAC Int', time:'5:00–6:30pm',
    mode:'video', wait:false,
    dates:['2026-10-08','2026-10-22','2026-11-05','2026-11-19','2026-12-10'] },
];
// Sections decided 2026-09-23: Monday Shaping in person, the Wednesday Civilization video cohort,
// and both HAC lunch cohorts did not fill and are not running this fall.

// index by date
const byDate = {};
for (const s of SERIES) {
  for (const d of s.dates) {
    (byDate[d] = byDate[d] || []).push(s);
  }
}
// sort each day's entries by start time (lunch first, then evening)
for (const d in byDate) {
  byDate[d].sort((a,b) => (a.time.startsWith('12') ? 0 : 1) - (b.time.startsWith('12') ? 0 : 1));
}

// ---- Sanity check: verify weekday expectations ----
const EXPECT = { civ_sun:0, shaping_mon:1, wed:3, thu:4 };
const problems = [];
for (const s of SERIES) {
  for (const d of s.dates) {
    const wd = new Date(d + 'T12:00:00').getDay();
    let want;
    if (s.label.startsWith('AI and Civilization') && s.mode === 'in person') want = 0;
    else if (s.label.startsWith('How Society') && s.mode === 'in person') want = 1;
    else if (s.label.includes('lunch') || (s.mode === 'video' && s.track !== 'hac')) want = 3;
    else want = 4;
    if (wd !== want) problems.push(`${s.label} ${d} is weekday ${wd}, expected ${want}`);
  }
}
if (problems.length) { console.error('DATE PROBLEMS:\n' + problems.join('\n')); process.exit(1); }
console.log('All dates verified against expected weekdays.');

// ---- Calendar rendering ----
const MONTHS = [
  { y:2026, m:8,  name:'September 2026' },
  { y:2026, m:9,  name:'October 2026' },
  { y:2026, m:10, name:'November 2026' },
  { y:2026, m:11, name:'December 2026' },
];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function iso(y,m,d){ return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

function renderMonth(mo) {
  const first = new Date(mo.y, mo.m, 1);
  const startPad = first.getDay();
  const days = new Date(mo.y, mo.m + 1, 0).getDate();
  let cells = '';
  for (let i = 0; i < startPad; i++) cells += '<div class="cal-cell empty"></div>\n';
  for (let d = 1; d <= days; d++) {
    const key = iso(mo.y, mo.m, d);
    const evs = byDate[key] || [];
    const chips = evs.map(e =>
      `<span class="chip ${e.track}${e.wait ? ' wait' : ''}${e.tbd ? ' tbd' : ''}"><b>${e.short}</b> ${e.time.split('–')[0]}</span>`
    ).join('');
    cells += `<div class="cal-cell${evs.length ? ' has' : ''}"><span class="dnum">${d}</span>${chips}</div>\n`;
  }
  const head = DOW.map(d => `<div class="cal-dow">${d}</div>`).join('');
  return `<div class="cal">
  <h3 class="cal-month">${mo.name}</h3>
  <div class="cal-grid">
${head}
${cells}  </div>
</div>`;
}

const calendars = MONTHS.map(renderMonth).join('\n\n');

// ---- Page ----
const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="Fall 2026 schedule for the Bell AI Fellowship — every section of the Homebrew AI Club, AI and Civilization, and How Society Shapes Technology in one calendar." />
<link rel="icon" href="../favicon.png" type="image/png">
<title>Fall 2026 Schedule — Bell AI Fellowship</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,300;1,6..72,400&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="../assets/site.css">
<style>
  :root { --accent: #1a1a1a; --accent-soft: #666; }
  .container { max-width: 860px; }
  .civ-c { color: #7a2e1d; } .shaping-c { color: #2b5e8c; } .hac-c { color: #1f8f5f; }

  /* legend */
  .legend { display: flex; flex-wrap: wrap; gap: 10px 22px; margin: 4px 0 8px; }
  .legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.92rem; color: var(--ink-soft); }
  .swatch { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
  .sw-civ { background: #7a2e1d; } .sw-shaping { background: #2b5e8c; } .sw-hac { background: #1f8f5f; }
  .sw-wait { background: repeating-linear-gradient(45deg, #999, #999 3px, transparent 3px, transparent 6px); border: 1px solid #bbb; }
  .sw-tbd { background: #fff; border: 1px dotted #555; }

  /* week rhythm */
  .rhythm { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 0.95rem; }
  .rhythm th, .rhythm td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--rule); vertical-align: top; }
  .rhythm th { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-faint); font-weight: 600; }
  .rhythm td.day { font-weight: 700; color: var(--ink); white-space: nowrap; }

  /* calendar */
  .cal { margin-bottom: 34px; }
  .cal-month { font-family: var(--serif); font-size: 1.2rem; margin-bottom: 10px; font-weight: 600; }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--rule); border: 1px solid var(--rule); border-radius: 6px; overflow: hidden; }
  .cal-dow { background: var(--panel); padding: 7px 6px; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-faint); font-weight: 600; text-align: center; }
  .cal-cell { background: #fff; min-height: 76px; padding: 6px 6px 8px; }
  .cal-cell.empty { background: var(--panel); opacity: 0.45; }
  .cal-cell.has { background: #fffdf9; }
  .dnum { display: block; font-size: 0.72rem; color: var(--ink-faint); margin-bottom: 4px; font-family: var(--mono); }
  .chip { display: block; font-size: 0.66rem; line-height: 1.35; padding: 2px 5px; margin-bottom: 3px; border-radius: 3px; color: #fff; }
  .chip b { font-weight: 700; }
  .chip.civ { background: #7a2e1d; }
  .chip.shaping { background: #2b5e8c; }
  .chip.hac { background: #1f8f5f; }
  .chip.wait { background: #fff; border: 1px dashed currentColor; }
  .chip.tbd { background: #fff; border: 1px dotted currentColor; }
  .chip.civ.tbd { color: #7a2e1d; }
  .chip.shaping.tbd { color: #2b5e8c; }
  .chip.civ.wait { color: #7a2e1d; }
  .chip.shaping.wait { color: #2b5e8c; }
  .chip.hac.wait { color: #1f8f5f; }

  @media (max-width: 700px) {
    .cal-cell { min-height: 62px; padding: 4px 3px 6px; }
    .chip { font-size: 0.58rem; padding: 1px 3px; }
    .dnum { font-size: 0.65rem; }
  }
</style>
</head>
<body>

<nav class="band">
  <div class="band-inner">
    <a href="../"><img src="../images/bellai-logo.png" alt="" class="band-logo"></a>
    <a href="../" class="band-brand">Bell AI Fellowship</a>
    <div class="band-tracks">
      <a href="../hac/">Homebrew AI Club</a>
      <a href="../civilization/">AI and Civilization</a>
      <a href="../shaping/">How Society Shapes Technology</a>
      <a href="./" class="current">Schedule</a>
      <a href="https://tally.so/r/Pd7d75" target="_blank" rel="noopener" class="band-apply">Apply</a>
    </div>
  </div>
</nav>

<div class="container">

  <header class="page">
    <div class="eyebrow">Fall 2026</div>
    <h1>The Schedule</h1>
    <p class="standfirst">Four cohorts run this fall: AI and Civilization on Sundays in person, How Society Shapes Technology on Wednesday evenings by video, and the Homebrew AI Club's Advanced and Intermediate cohorts, each every other Thursday.</p>
  </header>

  <section>
    <h2>The four cohorts</h2>
    <table class="rhythm">
      <tr><th>Day</th><th>Cohort</th><th>Cadence</th><th>Where</th></tr>
      <tr><td class="day">Sunday</td><td><a href="../civilization/" class="civ-c"><strong>AI and Civilization</strong></a> · 4:00–6:00pm</td><td>Every week, six sessions, Sept 27 to Nov 1</td><td>In person, SF</td></tr>
      <tr><td class="day">Wednesday</td><td><a href="../shaping/" class="shaping-c"><strong>How Society Shapes Technology</strong></a> · 6:30–8:30pm</td><td>Every week, six sessions, Sept 30 to Nov 4</td><td>Video</td></tr>
      <tr><td class="day">Thursday</td><td><a href="../hac/" class="hac-c"><strong>Homebrew AI Club — Advanced</strong></a> · 5:00–6:30pm</td><td>Every other week, six sessions, Oct 1 to Dec 17</td><td>In person, SF, with remote seats</td></tr>
      <tr><td class="day">Thursday</td><td><a href="../hac/" class="hac-c"><strong>Homebrew AI Club — Intermediate</strong></a> · 5:00–6:30pm</td><td>Every other week, five sessions, Oct 8 to Dec 10, on the Thursdays Advanced doesn't meet</td><td>Video</td></tr>
    </table>
  </section>

  <section>
    <h2>The calendar</h2>
    <div class="legend">
      <span class="legend-item"><span class="swatch sw-civ"></span> AI and Civilization</span>
      <span class="legend-item"><span class="swatch sw-shaping"></span> Shaping Technology</span>
      <span class="legend-item"><span class="swatch sw-hac"></span> Homebrew AI Club</span>
    </div>

${calendars}

    <p class="cta-note">Times shown are start times, Pacific.</p>
  </section>

  <section class="cta">
    <h2>Applying</h2>
    <p class="lede">Each path takes applications separately. Each one is read, and admission isn't automatic — places go to the people who will make the strongest cohort. Five minutes each. The September 22 deadline has passed; late applications are read while seats remain. Tuition is $180 a path.</p>
    <p>
      <a href="../hac/" class="hac-c"><strong>Homebrew AI Club</strong></a> — build judgment through demos.<br>
      <a href="../civilization/" class="civ-c"><strong>AI and Civilization</strong></a> — think through the original texts.<br>
      <a href="../shaping/" class="shaping-c"><strong>How Society Shapes Technology</strong></a> — understand the historical record.
    </p>
    <p>If a fee would keep you out, say so in your application. We set places aside for exactly that.</p>
    <a class="btn" href="https://tally.so/r/Pd7d75" target="_blank" rel="noopener">Apply →</a>
    <p class="cta-note">One application covers every section — pick the ones you want on the form. Opens in a new tab.</p>
  </section>

  <footer class="page">
    The Schedule is part of the <a href="../">Bell AI Fellowship</a>.
  </footer>

</div>

</body>
</html>
`;

fs.writeFileSync(process.argv[2], page);
console.log('Wrote ' + process.argv[2]);
