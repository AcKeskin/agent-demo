/** What we keep about a private repo. No name, description, paths or code. */
export interface PrivateRepoFacts {
  languages: Record<string, number>;
  /** File and folder names at the repo root. Used only to detect the stack. */
  rootEntries: string[];
  /** Dependency names from package.json, if any. */
  npmDeps: string[];
  /** Package names from find_package() in CMakeLists.txt, if any. */
  cmakePackages: string[];
  createdAt: string;
  pushedAt: string;
}

const ROOT_MARKERS: [RegExp, string][] = [
  [/^ProjectSettings$/, "Unity"],
  [/\.uproject$/, "Unreal Engine"],
  [/^project\.godot$/, "Godot"],
  [/^CMakeLists\.txt$/, "CMake"],
  [/^Cargo\.toml$/, "Cargo"],
  [/^go\.mod$/, "Go modules"],
  [/^(pyproject\.toml|requirements\.txt)$/, "Python packaging"],
  [/^(build\.gradle(\.kts)?|settings\.gradle(\.kts)?)$/, "Gradle"],
  [/\.sln$/, ".NET"],
  [/^Dockerfile$/, "Docker"],
  [/^wrangler\.toml$/, "Cloudflare Workers"],
  [/^\.github$/, "GitHub Actions"],
];

/** Well-known libraries worth naming. Anything else is left out, since it may be internal. */
const KNOWN_LIBS = new Set([
  "react", "vue", "svelte", "next", "express", "fastify", "three", "electron", "vite", "typescript",
  "obsidian", "firebase", "socket.io", "ws", "vitest", "jest", "tailwindcss",
  "OpenGL", "Vulkan", "OpenXR", "glfw3", "glm", "SDL2", "OpenCV", "Qt6", "Qt5", "Boost", "GTest", "imgui", "assimp", "OpenSSL",
]);

export function detectStack(f: PrivateRepoFacts): string[] {
  const stack = new Set<string>();
  for (const entry of f.rootEntries) for (const [re, name] of ROOT_MARKERS) if (re.test(entry)) stack.add(name);
  for (const dep of [...f.npmDeps, ...f.cmakePackages]) if (KNOWN_LIBS.has(dep)) stack.add(dep);
  return [...stack].sort();
}

export function topLanguages(langs: Record<string, number>, n = 3): string[] {
  const total = Object.values(langs).reduce((a, b) => a + b, 0);
  return Object.entries(langs)
    .filter(([, bytes]) => total > 0 && bytes / total >= 0.05)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([l]) => l);
}

function years(f: PrivateRepoFacts): string {
  const a = f.createdAt.slice(0, 4);
  const b = f.pushedAt.slice(0, 4);
  return a === b ? a : `${a} to ${b}`;
}

/**
 * Writes the draft summary. Repos are numbered, never named, and listed
 * newest first. The output is a draft: Ali edits and approves it by hand.
 */
export function renderSummary(repos: PrivateRepoFacts[]): string {
  const sorted = [...repos].sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));
  const lines = sorted.map((r, i) => {
    const langs = topLanguages(r.languages);
    const stack = detectStack(r);
    const parts = [langs.length ? langs.join(", ") : "no detected language", stack.length ? `uses ${stack.join(", ")}` : ""];
    return `- Private project ${i + 1} (${years(r)}): ${parts.filter(Boolean).join("; ")}.`;
  });
  return [
    "---",
    "title: Private projects",
    "---",
    "",
    "## Private projects",
    "",
    `Ali also has ${repos.length} private repos. Names and details are not shared. What they show:`,
    "",
    ...lines,
    "",
  ].join("\n");
}
