export const STYLES = `
:host{--bg:#17181a;--panel:#1f2023;--line:#34363b;--ink:#e9e6df;--mute:#9a978f;--accent:#f0a23b;--on-accent:#1a1205;--bad:#e5735c;
  --mono:"DM Mono",ui-monospace,monospace;--sans:"Barlow",system-ui,sans-serif;
  display:block;color:var(--ink);font:16px/1.55 var(--sans)}
*{box-sizing:border-box;margin:0;padding:0}
[hidden]{display:none!important}
.box{background:var(--panel);border:1px solid var(--line);padding:20px;display:grid;gap:14px}
.hud{font:500 12px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
.top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--accent);margin-right:8px;vertical-align:1px}
.log{display:grid;gap:18px;max-height:520px;overflow-y:auto}
.entry{display:grid;gap:10px;min-width:0}
.q{color:var(--accent);font:500 14px var(--mono)}
.note{font:500 11px var(--mono);color:var(--mute);border:1px dashed var(--line);padding:4px 8px;justify-self:start}
ol{list-style:none;display:grid;gap:6px;border-left:1px solid var(--line);padding-left:12px}
li{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font:12px/1.5 var(--mono);min-width:0}
li .n{color:var(--mute)}
li code{color:var(--ink);overflow-wrap:anywhere}
li .pv{grid-column:2;color:var(--mute);overflow-wrap:anywhere}
li.err code{color:var(--bad)}
li.pending code{color:var(--mute)}
.a.wait{color:var(--mute)}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chips button{font:500 12px var(--mono);color:var(--ink);background:none;border:1px solid var(--line);padding:6px 10px;cursor:pointer}
.chips button:hover,.chips button:focus-visible{border-color:var(--accent);outline:none}
form{display:flex;gap:8px}
input{flex:1;min-width:0;background:var(--bg);color:var(--ink);border:1px solid var(--line);padding:10px 12px;font:15px var(--sans)}
input:focus{outline:none;border-color:var(--accent)}
form button{background:var(--accent);color:var(--on-accent);border:0;padding:0 16px;font:600 13px var(--mono);text-transform:uppercase;cursor:pointer}
form button:disabled{opacity:.5;cursor:wait}
`;
