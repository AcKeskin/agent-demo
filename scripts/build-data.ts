// Bundles the reviewed summaries in data/*.md into src/generated/data.json.
// Drafts (*.draft.md) are skipped: rename a draft only after reviewing it.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const files = (await readdir("data")).filter((f) => f.endsWith(".md") && !f.endsWith(".draft.md")).sort();
const parts = await Promise.all(files.map((f) => readFile(join("data", f), "utf8")));
const privateSummary = parts.map(stripFrontMatter).join("\n\n").trim();

await mkdir("src/generated", { recursive: true });
await writeFile("src/generated/data.json", JSON.stringify({ privateSummary }));
console.log(`src/generated/data.json: ${files.join(", ") || "no summaries"}`);

function stripFrontMatter(md: string): string {
  return md.replace(/\r\n/g, "\n").replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
}
