import type { Tool } from "../agent/types.ts";
import type { GitHub } from "./github.ts";

/** The agent's tools. All read-only, all limited to public data or text Ali approved. */
export function createTools(github: GitHub, privateSummary: string): Tool[] {
  return [
    {
      spec: {
        name: "list_repos",
        description: "List Ali's public GitHub repos with language, description, stars and last push date. Call this first to find repo names.",
        input_schema: { type: "object", properties: {} },
      },
      async run() {
        const repos = await github.listRepos();
        return repos
          .map((r) => `${r.name} | ${r.language || "-"} | ${r.stars} stars | pushed ${r.pushedAt.slice(0, 10)} | ${r.description}${r.topics.length ? ` | topics: ${r.topics.join(", ")}` : ""}`)
          .join("\n");
      },
    },
    {
      spec: {
        name: "get_readme",
        description: "Read the README of one of Ali's public repos.",
        input_schema: { type: "object", properties: { repo: { type: "string", description: "Repo name from list_repos" } }, required: ["repo"] },
      },
      run: async ({ repo }) => cleanMarkdown(await github.readme(String(repo))),
    },
    {
      spec: {
        name: "get_languages",
        description: "Languages used in one of Ali's public repos, as percentages of code.",
        input_schema: { type: "object", properties: { repo: { type: "string" } }, required: ["repo"] },
      },
      async run({ repo }) {
        const langs = await github.languages(String(repo));
        const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
        return Object.entries(langs)
          .sort((a, b) => b[1] - a[1])
          .map(([l, n]) => `${l}: ${((100 * n) / total).toFixed(1)}%`)
          .join("\n");
      },
    },
    {
      spec: {
        name: "get_recent_commits",
        description: "The latest commit messages and dates in one of Ali's public repos.",
        input_schema: {
          type: "object",
          properties: { repo: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 10 } },
          required: ["repo"],
        },
      },
      async run({ repo, limit }) {
        const commits = await github.commits(String(repo), Number(limit ?? 5));
        return commits.map((c) => `${c.date.slice(0, 10)} ${c.message}`).join("\n") || "No commits.";
      },
    },
    {
      spec: {
        name: "get_private_work_summary",
        description:
          "Ali's day job and private projects, as a summary he reviewed. Names and details are left out on purpose; do not guess them.",
        input_schema: { type: "object", properties: {} },
      },
      run: async () => privateSummary || "No summary available.",
    },
  ];
}

/** Drops images, HTML tags and badge lines so the model gets the prose. */
export function cleanMarkdown(md: string): string {
  return md
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
