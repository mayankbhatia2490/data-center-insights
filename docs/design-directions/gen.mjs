import fs from "fs";
const lead = { t: "VDURA gallops into GPU-using Neocloud and enterprise market", s: "VDURA is entering the Neocloud and enterprise market to support GPU-intensive workloads.", src: "Blocks & Files", ago: "6h ago" };
const more = [
  ["AI","CoreWeave Targets Enterprises with Forge Platform","7h ago"],
  ["AI","Digital Realty Plans Cable Landing Station at Los Angeles Data Center","13h ago"],
  ["AI","NetApp unveils fastest file system on the planet with great raft of other announcements","1d ago"],
  ["M&A","AMD to Acquire World Labs for $8.2B to Advance AI Models and Robotics","1d ago"],
  ["AI","MongoDB accelerates and scales out database, launches Atlas Agent Engine","1d ago"],
];
const brief = [
  ["Sovereign AI capital acceleration","The Middle East is moving from financial backer to active global infrastructure builder, led by the UAE's $10 billion AI infrastructure push and a $46 billion outbound pipeline into German digital infrastructure."],
  ["Regulatory cost-shifting","US state and local authorities are pushing grid and utility upgrade costs onto developers, ending the era of subsidised hyperscale expansion."],
  ["Topology de-concentration","Grid lock and local resistance are shifting builds from massive campuses toward distributed, smaller, high-density metro infill."],
];
const trend = [["Hyperscale expansion","+3"],["AI infrastructure","+5"],["Energy & sustainability","−3"],["Middle East data centers","+5"],["Regulation & policy","−4"]];
const nav = ["News","Intelligence","Data","Leaders","Briefings"];
const head = (css,title)=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>*{box-sizing:border-box;margin:0}body{-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}${css}</style></head><body>`;

// ───────── A: WIRE (editorial, light paper)
const A = head(`
:root{--bg:#f6f3ec;--ink:#14171c;--mut:#4a525c;--line:#d9d3c5;--acc:#0b5d8a;--me:#a1470f;--card:#fffdf8}
body{background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,"Inter",sans-serif}
.w{max-width:1200px;margin:0 auto;padding:0 24px}
.top{border-bottom:3px double var(--ink);padding:14px 0;display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap}
.logo{font:700 28px Georgia,serif;letter-spacing:-.5px}.logo b{color:var(--acc)}
nav{display:flex;gap:24px;font-size:14px;font-weight:600}nav a:hover{color:var(--acc)}
.btn{background:var(--ink);color:#fff;padding:9px 16px;font-weight:700;font-size:14px;border-radius:2px}
.date{font-size:13px;color:var(--mut);padding:10px 0;border-bottom:1px solid var(--line)}
.grid{display:grid;grid-template-columns:2fr 1fr;gap:40px;padding:32px 0}
.k{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--acc)}.k.me{color:var(--me)}
h1{font:800 46px/1.08 Georgia,serif;letter-spacing:-1.2px;margin:10px 0 14px}
.lede{font-size:19px;color:var(--mut);max-width:60ch}.meta{font-size:13px;color:var(--mut);margin-top:12px}
.rail{border-left:1px solid var(--line);padding-left:32px}
.item{padding:14px 0;border-bottom:1px solid var(--line)}.item h3{font:700 17px/1.3 Georgia,serif;margin-top:4px}
.brief{background:var(--card);border:1px solid var(--line);border-top:4px solid var(--ink);padding:28px;margin:8px 0 40px}
.brief h2{font:800 22px Georgia,serif;margin:6px 0 16px}.brief h4{font-size:15px;margin-top:14px}.brief p{color:var(--mut);font-size:15px}
.tr{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.tr span{font-size:13px;border:1px solid var(--line);padding:4px 10px;background:#fff}.tr b{margin-left:6px}
.sub{background:var(--ink);color:#fff;padding:28px;margin:8px 0}.sub h3{font:700 22px Georgia,serif}.sub p{color:#c9ced6;font-size:14px;margin:6px 0 14px}
.sub form{display:flex;gap:8px}.sub input{flex:1;padding:11px;border:0;font-size:15px;border-radius:2px}.sub button{background:var(--acc);color:#fff;border:0;padding:0 18px;font-weight:700;border-radius:2px;font-size:15px}
.sub small{display:block;margin-top:10px;color:#c9ced6;font-size:12px}
.stat{display:flex;gap:28px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:16px 0;margin:8px 0 24px}.stat div{font-size:12px;color:var(--mut)}.stat strong{display:block;font:800 26px Georgia,serif;color:var(--ink)}
footer{border-top:3px double var(--ink);padding:24px 0;font-size:13px;color:var(--mut);display:flex;gap:20px;flex-wrap:wrap}
@media(max-width:800px){.grid{grid-template-columns:1fr}.rail{border:0;padding:0}h1{font-size:32px}nav{display:none}.sub form{flex-direction:column}.sub button{padding:12px}}
`,"A — Wire") + `<div class="w"><div class="top"><span class="logo">Data Center <b>Pulse</b></span><nav>${nav.map(n=>`<a href="#">${n}</a>`).join("")}</nav><a class="btn" href="#">Subscribe free</a></div>
<div class="date">Thursday 1 October 2026 · MENA-first infrastructure intelligence · Updated 6 hours ago</div>
<div class="grid"><main>
<span class="k">Lead story · AI</span><h1>${lead.t}</h1><p class="lede">${lead.s}</p><p class="meta"><strong>${lead.src}</strong> · ${lead.ago} · 2 min read</p>
<div class="brief" style="margin-top:36px"><span class="k">Morning brief · 28 Sep · 18 sources</span><h2>What moved the market</h2>${brief.map(b=>`<h4>${b[0]}</h4><p>${b[1]}</p>`).join("")}<div class="tr">${trend.map(t=>`<span>${t[0]}<b>${t[1]}</b></span>`).join("")}</div></div>
<div class="sub"><h3>The brief, 8 AM Dubai time.</h3><p>One daily email on MENA data-center deals, capacity and policy. Free.</p><form><input placeholder="Work email" aria-label="Work email"><button type="button">Subscribe</button></form><small>We email a confirmation link. Unsubscribe anytime. <u>Privacy</u></small></div>
</main><aside class="rail"><span class="k">Latest</span>${more.map(m=>`<div class="item"><span class="k ${m[0]==='M&A'?'':''}">${m[0]}</span><h3>${m[1]}</h3><div class="meta">${m[2]}</div></div>`).join("")}
<div class="stat" style="margin-top:28px"><div><strong>111</strong>facilities mapped</div><div><strong>5,210 MW</strong>reported capacity</div></div></aside></div>
<footer><span>About &amp; methodology</span><span>Privacy</span><span>Terms</span><span>Contact</span><span>© 2026 Data Center Pulse</span></footer></div></body></html>`;

// ───────── B: TERMINAL (dark, data-forward)
const B = head(`
:root{--bg:#0b1117;--p:#121b24;--p2:#17222d;--line:#26333f;--tx:#e6edf3;--mut:#9fb0bf;--acc:#4cc0f0;--amb:#f2b04a;--up:#4fd18b;--dn:#ff7a7a}
body{background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,"Inter",sans-serif}
.mono{font-family:ui-monospace,"SF Mono",Menlo,monospace}
.bar{display:flex;align-items:center;gap:24px;padding:0 24px;height:56px;border-bottom:1px solid var(--line);background:var(--p);position:sticky;top:0}
.logo{font-weight:800;letter-spacing:-.3px}.logo b{color:var(--acc)}
nav{display:flex;gap:4px;margin-left:12px}nav a{padding:8px 12px;font-size:14px;color:var(--mut);border-radius:4px}nav a:first-child{color:var(--tx);background:var(--p2)}
.sp{flex:1}.btn{background:var(--acc);color:#04202e;font-weight:800;padding:8px 14px;border-radius:4px;font-size:14px}
.kpi{display:grid;grid-template-columns:repeat(5,1fr);border-bottom:1px solid var(--line);background:var(--p)}
.kpi div{padding:14px 24px;border-right:1px solid var(--line)}.kpi div:last-child{border:0}
.kpi small{display:block;font-size:12px;color:var(--mut)}.kpi b{font:700 22px ui-monospace,Menlo,monospace}.up{color:var(--up)}.dn{color:var(--dn)}
.wrap{display:grid;grid-template-columns:1.6fr 1fr;gap:20px;padding:20px 24px;max-width:1440px;margin:0 auto}
.card{background:var(--p);border:1px solid var(--line);border-radius:6px;padding:20px}
.lab{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--acc)}
h1{font-size:34px;line-height:1.15;letter-spacing:-.8px;margin:8px 0 10px}.mut{color:var(--mut)}
.row{display:grid;grid-template-columns:64px 1fr auto;gap:12px;padding:12px 0;border-top:1px solid var(--line);align-items:baseline}
.tag{font:700 12px ui-monospace,Menlo,monospace;color:var(--amb)}.row h3{font-size:15px;font-weight:600}.row small{color:var(--mut);font-size:12px}
.bars div{display:grid;grid-template-columns:170px 1fr 36px;gap:10px;align-items:center;font-size:13px;margin:8px 0}.bars i{display:block;height:8px;border-radius:2px}
.brief p{font-size:14px;color:var(--mut);margin:4px 0 12px}.brief strong{color:var(--tx)}
form{display:flex;gap:8px;margin-top:12px}input{flex:1;min-width:0;background:var(--bg);border:1px solid var(--line);color:var(--tx);padding:10px;border-radius:4px;font-size:15px}button{background:var(--acc);border:0;color:#04202e;font-weight:800;padding:0 16px;border-radius:4px;font-size:15px}
footer{padding:20px 24px;color:var(--mut);font-size:13px;border-top:1px solid var(--line);display:flex;gap:20px;flex-wrap:wrap}
@media(max-width:900px){.bars div{grid-template-columns:120px 1fr 32px}.kpi b{font-size:17px}.row{grid-template-columns:48px 1fr}.row small{grid-column:2}.wrap{grid-template-columns:1fr;min-width:0}.card{min-width:0}.kpi{grid-template-columns:repeat(2,1fr)}nav{display:none}}
`,"B — Terminal") + `<div class="bar"><span class="logo">Data Center <b>Pulse</b></span><nav>${nav.map(n=>`<a href="#">${n}</a>`).join("")}</nav><span class="sp"></span><a class="btn" href="#">Subscribe</a></div>
<div class="kpi"><div><small>Facilities mapped (GCC)</small><b>111</b></div><div><small>Operational</small><b>20</b></div><div><small>Reported capacity</small><b>5,209.6 MW</b></div><div><small>With coordinates</small><b>66 / 111</b></div><div><small>Data as of</small><b>1 Oct 2026</b></div></div>
<div class="wrap"><div style="display:grid;gap:20px">
<div class="card"><span class="lab">Lead · AI</span><h1>${lead.t}</h1><p class="mut">${lead.s}</p><p class="mut" style="font-size:13px;margin-top:10px">${lead.src} · ${lead.ago}</p></div>
<div class="card"><span class="lab">Latest</span>${more.map(m=>`<div class="row"><span class="tag">${m[0]}</span><h3>${m[1]}</h3><small>${m[2]}</small></div>`).join("")}</div></div>
<div style="display:grid;gap:20px;align-content:start">
<div class="card"><span class="lab">Pulse trend direction · morning brief 28 Sep</span><div class="bars">${trend.map(t=>{const v=parseInt(t[1].replace("−","-"));const c=v>=0?"var(--up)":"var(--dn)";return `<div><span>${t[0]}</span><span><i style="width:${Math.abs(v)*18}%;background:${c}"></i></span><b class="mono ${v>=0?'up':'dn'}">${t[1]}</b></div>`}).join("")}</div></div>
<div class="card brief"><span class="lab">Morning brief</span>${brief.map(b=>`<p style="margin-top:12px"><strong>${b[0]}.</strong> ${b[1]}</p>`).join("")}</div>
<div class="card"><span class="lab">Daily brief, 8 AM Dubai</span><form><input placeholder="Work email" aria-label="Work email"><button type="button">Subscribe</button></form><p class="mut" style="font-size:12px;margin-top:10px">Free. Confirmation link by email. Unsubscribe anytime.</p></div></div></div>
<footer><span>About &amp; methodology</span><span>Privacy</span><span>Terms</span><span>Contact</span><span>© 2026 Data Center Pulse</span></footer></body></html>`;

// ───────── C: BRIEFING (brief-first, calm, dark hero + light body)
const C = head(`
:root{--ink:#0d1b2e;--ink2:#14284a;--sand:#f3efe6;--paper:#fbfaf6;--tx:#17202c;--mut:#4d5866;--line:#e2dccd;--teal:#0f766e;--gold:#e0b25a;--goldtx:#8a5a00}
body{background:var(--paper);color:var(--tx);font:16px/1.55 system-ui,"Inter",sans-serif}
.hero{background:linear-gradient(180deg,var(--ink),var(--ink2));color:var(--sand);padding-bottom:56px}
.w{max-width:1100px;margin:0 auto;padding:0 24px}
.bar{display:flex;align-items:center;justify-content:space-between;height:68px;gap:16px}
.logo{font:700 20px Georgia,serif}.logo b{color:var(--gold)}nav{display:flex;gap:26px;font-size:14px;color:#cdd6e2}
.btn{border:1px solid var(--gold);color:var(--gold);padding:8px 16px;border-radius:999px;font-weight:700;font-size:14px}
.eyebrow{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);font-weight:700;margin-top:34px}
.hero h1{font:700 40px/1.12 Georgia,serif;margin:10px 0 28px;max-width:20ch;letter-spacing:-.6px}
.pts{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}.pts h3{font:700 17px Georgia,serif;color:#fff;margin-bottom:6px}.pts p{font-size:15px;color:#cdd6e2}
.pts div{border-top:2px solid var(--gold);padding-top:14px}
.dir{display:flex;gap:10px;flex-wrap:wrap;margin-top:30px}.dir span{font-size:13px;padding:5px 12px;border:1px solid #3a4f73;border-radius:999px;color:#e6ecf5}.dir b{color:var(--gold);margin-left:6px}
.body{display:grid;grid-template-columns:1.7fr 1fr;gap:44px;padding:44px 0}
.sec{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--teal);font-weight:800;margin-bottom:6px}
.lead h2{font:700 30px/1.15 Georgia,serif;letter-spacing:-.5px;margin:6px 0 10px}.lead p{color:var(--mut);font-size:17px}
.it{display:grid;grid-template-columns:1fr auto;gap:16px;padding:16px 0;border-bottom:1px solid var(--line)}.it h3{font:600 17px/1.35 Georgia,serif}.it small{color:var(--mut);font-size:13px}
.k{font-size:12px;font-weight:800;color:var(--goldtx);letter-spacing:.08em;text-transform:uppercase}
.side .box{background:var(--sand);border:1px solid var(--line);border-radius:10px;padding:22px;margin-bottom:20px}
.side h4{font:700 18px Georgia,serif;margin-bottom:6px}.side p{font-size:14px;color:var(--mut)}
form{display:flex;flex-direction:column;gap:8px;margin-top:12px}input{padding:11px;border:1px solid #cfc7b3;border-radius:6px;font-size:15px;background:#fff}button{background:var(--ink);color:#fff;border:0;padding:12px;border-radius:6px;font-weight:700;font-size:15px}
.num{font:700 28px Georgia,serif;color:var(--ink)}.num small{display:block;font:13px system-ui;color:var(--mut)}
footer{border-top:1px solid var(--line);padding:24px 0;font-size:13px;color:var(--mut)}footer .w{display:flex;gap:20px;flex-wrap:wrap}
@media(max-width:800px){.pts{grid-template-columns:1fr}.body{grid-template-columns:1fr}.hero h1{font-size:30px}nav{display:none}}
`,"C — Briefing") + `<div class="hero"><div class="w"><div class="bar"><span class="logo">Data Center <b>Pulse</b></span><nav>${nav.map(n=>`<a href="#">${n}</a>`).join("")}</nav><a class="btn" href="#">Get the brief</a></div>
<div class="eyebrow">Morning brief · 28 September 2026 · 18 sources analysed</div><h1>The Gulf is becoming a builder, not just a backer.</h1>
<div class="pts">${brief.map(b=>`<div><h3>${b[0]}</h3><p>${b[1]}</p></div>`).join("")}</div>
<div class="dir">${trend.map(t=>`<span>${t[0]}<b>${t[1]}</b></span>`).join("")}</div></div></div>
<div class="w body"><main><div class="sec">Lead story</div><div class="lead"><span class="k">AI</span><h2>${lead.t}</h2><p>${lead.s}</p><small style="color:var(--mut)">${lead.src} · ${lead.ago}</small></div>
<div class="sec" style="margin-top:36px">Latest</div>${more.map(m=>`<div class="it"><div><span class="k">${m[0]}</span><h3>${m[1]}</h3></div><small>${m[2]}</small></div>`).join("")}</main>
<aside class="side"><div class="box"><h4>Get this in your inbox</h4><p>Every morning, 8 AM Dubai time. Free.</p><form><input placeholder="Work email" aria-label="Work email"><button type="button">Subscribe</button></form></div>
<div class="box"><div class="sec">GCC data-center map</div><div class="num">111<small>facilities mapped · 20 operational</small></div><div class="num" style="margin-top:12px">5,210 MW<small>reported capacity</small></div></div></aside></div>
<footer><div class="w"><span>About &amp; methodology</span><span>Privacy</span><span>Terms</span><span>Contact</span><span>© 2026 Data Center Pulse</span></div></footer></body></html>`;

fs.writeFileSync("A-wire.html",A);fs.writeFileSync("B-terminal.html",B);fs.writeFileSync("C-briefing.html",C);
