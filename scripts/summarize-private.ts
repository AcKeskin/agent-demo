// Run on your own machine to draft data/private-repos.draft.md:
//   GITHUB_TOKEN=<token with repo read access> npm run summarize-private
// It reads your private repos and keeps only languages, detected stack and
// years. Review the draft, edit it, then rename it to data/private-repos.md.
// The token is used only here and is never stored.
import { writeFile } from "node:fs/promises";
import { renderSummary, type PrivateRepoFacts } from "../src/private/summarize.ts";

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("Set GITHUB_TOKEN to a token that can read your private repos.");
  process.exit(1);
}
const OUT = "data/private-repos.draft.md";

const repos = await gh<RawRepo[]>("/user/repos?visibility=private&affiliation=owner&per_page=100");
const facts: PrivateRepoFacts[] = [];
for (const r of repos) {
  const root = await gh<{ name: string }[]>(`/repos/${r.full_name}/contents`).catch(() => []);
  const names = root.map((e) => e.name);
  facts.push({
    languages: await gh<Record<string, number>>(`/repos/${r.full_name}/languages`).catch(() => ({})),
    rootEntries: names,
    npmDeps: names.includes("package.json") ? await npmDeps(r.full_name) : [],
    cmakePackages: names.includes("CMakeLists.txt") ? await cmakePackages(r.full_name) : [],
    createdAt: r.created_at,
    pushedAt: r.pushed_at,
  });
}

await writeFile(OUT, renderSummary(facts));
console.log(`${OUT}: ${facts.length} repos. Review it before renaming to data/private-repos.md.`);

async function npmDeps(repo: string): Promise<string[]> {
  try {
    const pkg = JSON.parse(await raw(repo, "package.json")) as Record<string, Record<string, string> | undefined>;
    return Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  } catch {
    return [];
  }
}

async function cmakePackages(repo: string): Promise<string[]> {
  const text = await raw(repo, "CMakeLists.txt");
  return [...text.matchAll(/find_package\(\s*([A-Za-z0-9_]+)/g)].map((m) => m[1]!);
}

async function raw(repo: string, path: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github.raw+json" },
  });
  return res.ok ? res.text() : "";
}

async function gh<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}`);
  return (await res.json()) as T;
}

interface RawRepo {
  full_name: string;
  created_at: string;
  pushed_at: string;
}
