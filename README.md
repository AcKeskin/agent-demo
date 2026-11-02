# agent-demo

An AI agent that answers questions about my work by calling tools on my GitHub. Runs on Cloudflare Workers with Claude. Each answer shows the tool calls behind it.

Built to be embedded on [ackeskin.github.io](https://ackeskin.github.io).

## How it works

```mermaid
sequenceDiagram
  participant W as Widget
  participant K as Worker
  participant C as Claude
  participant G as GitHub API
  W->>K: question
  loop up to 5 turns
    K->>C: question + tool results so far
    C-->>K: tool calls, or the answer
    K->>G: run tool (read-only)
  end
  K-->>W: answer + steps
```

The loop is in `src/agent/loop.ts`: ask the model, run the tools it asks for, send the results back, repeat. On the last turn the tools are withheld, so the model has to answer. Tool errors go back to the model as results instead of failing the request.

### Tools

| Tool | Does |
| --- | --- |
| `list_repos` | My public, non-fork repos with language, stars, last push |
| `get_readme` | A repo's README, with images and HTML removed |
| `get_languages` | A repo's languages in percent |
| `get_recent_commits` | Last 1 to 10 commit messages |
| `get_private_work_summary` | Text about my day job and private repos that I reviewed |

All tools are read-only. The agent only sees the repos in `ALLOWED_REPOS` (`wrangler.toml`), and every repo argument is checked against that list, so it can't be pointed at other accounts, private repos or repos I left out.

## Private work without leaking it

The live agent never sees a private repo or a token with private access. Instead:

1. `npm run summarize-private` runs on my machine with my own token. It keeps only languages, a detected stack (Unity, CMake, well-known libraries) and years. No names, descriptions, file paths or code.
2. It writes `data/private-repos.draft.md`, which git ignores.
3. I edit it, then rename it to `data/private-repos.md`. Only reviewed files in `data/` are bundled.

`data/hololight.md` was written the same way from a work-history export.

## Cost and abuse controls

| Control | Where |
| --- | --- |
| API key stays in a Worker secret | `wrangler secret put` |
| Requests must come from a listed origin | `ALLOWED_ORIGINS` |
| 5 questions per minute per IP, 20 across all visitors | `[[ratelimits]]` in `wrangler.toml` |
| At most 5 model calls per question, 600 tokens each, 15 s timeout | `src/worker/handler.ts`, `src/agent/claude.ts` |
| At most 4 tool calls per turn | `src/agent/loop.ts` |
| Tool output cut to 4,000 characters | `src/agent/loop.ts` |
| GitHub responses cached for 10 minutes | `src/tools/github.ts` |
| Monthly spend limit | Set it in the Claude Console |

The origin check only keeps other websites from using the API, since a script can fake the header. The rate limits and the spend limit are what cap the bill. Cloudflare counts rate limits per location, so the global limit is approximate; the spend limit is the hard cap.

## Run it

Needs Node 22.18 or later.

```sh
npm install
npm run check        # typecheck + tests
npm run build        # dist/ with an example run (no Worker needed)
```

Local Worker:

```sh
echo "ANTHROPIC_API_KEY=sk-ant-..." > .dev.vars
npm run dev
curl -X POST localhost:8787/api/ask -H 'origin: https://ackeskin.github.io' -H 'content-type: application/json' -d '{"question":"What graphics work has he done?"}'
```

## Deploy

1. `npx wrangler login`, then `npx wrangler secret put ANTHROPIC_API_KEY` and `npx wrangler secret put GITHUB_TOKEN`. The GitHub token needs no scopes (a fine-grained token with public read only). Without it GitHub allows 60 requests per hour per IP, and Worker IPs are shared, so the agent fails fast.
2. In the GitHub repo settings add variables `CLOUDFLARE_ACCOUNT_ID` and `WORKER_URL`, and secret `CLOUDFLARE_API_TOKEN` (Workers Scripts edit).
3. Set Pages source to GitHub Actions.

## Embed

```html
<div data-agent-demo data-endpoint="https://agent-demo.<you>.workers.dev"></div>
<script type="module" src="https://ackeskin.github.io/agent-demo/widget.js"></script>
```

## API

`POST /api/ask` with `{ "question": string }`

```json
{
  "answer": "His main graphics project is procedural-planets ...",
  "steps": [{ "tool": "get_readme", "input": { "repo": "procedural-planets" }, "ok": true, "preview": "..." }],
  "truncated": false
}
```

Errors: `400` bad input, `403` origin, `429` rate limited, `502` model unavailable.

## Layout

```
data/            Reviewed summaries bundled into the Worker
scripts/         build-data.ts, build-web.ts, summarize-private.ts
src/agent/       Agent loop, Claude client, system prompt
src/tools/       GitHub client and tool definitions
src/private/     Private repo summarizer (runs locally only)
src/worker/      Cloudflare Worker: routes, CORS, rate limit
src/web/         Chat widget with tool trace
test/            Vitest tests
```

## License

MIT
