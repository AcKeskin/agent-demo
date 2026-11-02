// Matches the "machine" HUD look of ackeskin.github.io: program panel,
// tool calls as a status feed, typed-out answers.
export const STYLES = `
:host{--bg:#17181a;--line:#34363b;--ink:#e9e6df;--mute:#9a978f;--accent:#f0a23b;
  --k-w:#f2f2f2;--k-r:#ff4040;--k-b:#3d86ff;--k-g:#46d651;--k-y:#f5d63a;
  --mono:"DM Mono",ui-monospace,monospace;--sans:"Barlow",system-ui,sans-serif;--poi:"Jost","Barlow",system-ui,sans-serif;
  display:block;color:var(--ink);font:16px/1.55 var(--sans)}
*{box-sizing:border-box;margin:0;padding:0}
[hidden]{display:none!important}
.box{position:relative;background:color-mix(in srgb,var(--bg) 80%,#000);border:1.5px solid var(--ink);border-radius:4px;padding:16px 18px 18px;display:grid;gap:14px;overflow:hidden}
.box::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.14) 0 1px,transparent 1px 3px)}
.top{display:flex;justify-content:space-between;align-items:center;gap:8px 16px;flex-wrap:wrap;text-transform:uppercase;letter-spacing:.04em}
.mx-t{display:flex;align-items:center;gap:10px;font:500 18px/1.2 var(--poi)}
.mx-d{flex:none;width:9px;height:9px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent);animation:pulse 2s ease-in-out infinite}
.mx-s{display:flex;align-items:center;gap:10px;font:500 14px/1 var(--poi)}
.mx-s b{font-weight:500;background:var(--ink);color:var(--bg);padding:3px 7px}
.mx-s span{color:var(--accent)}
.log{display:grid;gap:18px;max-height:480px;overflow-y:auto;scrollbar-color:var(--line) transparent}
.entry{display:grid;gap:10px;min-width:0}
.q{font:500 14px/1.4 var(--poi);text-transform:uppercase;letter-spacing:.06em;color:var(--k-y);overflow-wrap:anywhere}
.q::before{content:"Query // ";color:var(--mute)}
.a{overflow-wrap:anywhere}
.a.wait{font:500 12px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}
.a.wait::after,.a.typing::after{content:"";display:inline-block;width:.55em;height:1em;background:var(--accent);margin-left:4px;vertical-align:-2px;animation:blink 1s steps(1) infinite}
.cite{display:inline-block;border:1.5px dashed var(--k-y);border-radius:3px;color:var(--k-y);font:500 10px/1.3 var(--mono);padding:0 3px;margin-left:3px;vertical-align:2px;cursor:default}
.src{display:flex;flex-wrap:wrap;gap:6px}
.src a,.src span{border:1.5px dashed var(--k-b);border-radius:4px;color:var(--k-b);font:500 11px/1.4 var(--mono);text-transform:uppercase;letter-spacing:.06em;padding:3px 7px;text-decoration:none}
.src a:hover,.src a:focus-visible{border-style:solid;outline:none}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chips button{font:500 12px/1.3 var(--poi);text-transform:uppercase;letter-spacing:.06em;color:var(--mute);background:none;border:1.5px dashed var(--line);border-radius:4px;padding:6px 10px;cursor:pointer;text-align:left}
.chips button:hover,.chips button:focus-visible{color:var(--k-w);border-color:var(--k-w);outline:none}
form{display:flex;gap:10px;align-items:stretch}
form::before{content:">";font:500 16px/42px var(--mono);color:var(--accent)}
input{flex:1;min-width:0;background:none;color:var(--ink);border:0;border-bottom:1.5px solid var(--line);padding:10px 2px;font:15px var(--mono)}
input::placeholder{color:var(--mute);text-transform:uppercase;letter-spacing:.06em;font-size:12px}
input:focus{outline:none;border-color:var(--accent)}
form button{background:var(--ink);color:var(--bg);border:0;padding:0 16px;font:500 14px var(--poi);text-transform:uppercase;letter-spacing:.08em;cursor:pointer}
form button:hover,form button:focus-visible{background:var(--accent);outline:none}
form button:disabled{opacity:.5;cursor:wait}
@keyframes blink{50%{opacity:0}}
@keyframes pulse{50%{opacity:.35;box-shadow:none}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important}}
/* v2: closer to the reference frames */
.box{border:2px solid var(--ink);border-radius:5px;background:color-mix(in srgb,var(--bg) 70%,#000)}
.mx-t{font-size:19px;letter-spacing:.05em}
.mx-d{background:var(--mute);box-shadow:none;animation:none}
.mx-s b{padding:3px 8px;letter-spacing:.05em}
.mx-s span{color:var(--mute)}
.mx-s span.on{color:var(--ink)}
.cam{position:absolute;top:12px;right:16px;font:500 12px/1.3 var(--mono);letter-spacing:.14em;color:var(--ink);text-align:right;pointer-events:none}
.top{padding-right:120px;flex-direction:column;align-items:flex-start;gap:8px}
.a.wait{display:inline-block;justify-self:start;font:500 13px/1 var(--poi);letter-spacing:.08em;color:var(--ink);border:1.5px solid var(--ink);border-radius:4px;padding:7px 12px;background:color-mix(in srgb,var(--bg) 60%,#000)}
.a.wait::after{width:auto;height:auto;background:none;content:"...";margin-left:1px;animation:blink 1s steps(1) infinite}
.src a,.src span{position:relative;border:1.5px dashed var(--k-w);color:var(--k-w);border-radius:3px}
.src a::before,.src span::before{content:"";position:absolute;inset:-1.5px;border:1.5px solid currentColor;border-radius:3px;pointer-events:none;
  -webkit-mask:linear-gradient(#000 0 0) top left/7px 7px no-repeat,linear-gradient(#000 0 0) top right/7px 7px no-repeat,linear-gradient(#000 0 0) bottom left/7px 7px no-repeat,linear-gradient(#000 0 0) bottom right/7px 7px no-repeat;
  mask:linear-gradient(#000 0 0) top left/7px 7px no-repeat,linear-gradient(#000 0 0) top right/7px 7px no-repeat,linear-gradient(#000 0 0) bottom left/7px 7px no-repeat,linear-gradient(#000 0 0) bottom right/7px 7px no-repeat}
.src a:first-child,.src span:first-child{border-color:var(--k-y);color:var(--k-y)}
@media (max-width:420px){.top{padding-right:0}.cam{position:static;text-align:left}}
.note{font:500 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--mute);border:1.5px dashed var(--line);border-radius:4px;padding:4px 8px;justify-self:start}
ol{list-style:none;display:grid;gap:6px;border-left:1.5px solid var(--line);padding-left:12px}
li{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font:12px/1.5 var(--mono);min-width:0}
li .n{color:var(--k-g)}
li .n::before{content:"[ OK ] "}
li.err .n{color:var(--k-r)}
li.err .n::before{content:"[FAIL] "}
li code{color:var(--ink);overflow-wrap:anywhere}
li .pv{grid-column:2;color:var(--mute);overflow-wrap:anywhere}
li.err code{color:var(--k-r)}
li .n{color:var(--k-g)}
`;
