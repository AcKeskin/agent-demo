// Bundles the chat widget and demo page into dist/.
// WORKER_URL, if set, is written into the demo page as the API endpoint.
import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";

await mkdir("dist", { recursive: true });
await build({
  entryPoints: ["src/web/widget.ts"],
  outfile: "dist/widget.js",
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2022",
});
const html = await readFile("web/index.html", "utf8");
const endpoint = process.env.WORKER_URL ?? "";
await writeFile("dist/index.html", html.replace('data-endpoint=""', `data-endpoint="${endpoint}"`));
console.log(`dist/: widget.js, index.html (${endpoint ? `endpoint ${endpoint}` : "offline"})`);
