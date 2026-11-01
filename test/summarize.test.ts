import { describe, expect, it } from "vitest";
import { detectStack, renderSummary, topLanguages, type PrivateRepoFacts } from "../src/private/summarize.ts";

const repo = (over: Partial<PrivateRepoFacts> = {}): PrivateRepoFacts => ({
  languages: { "C#": 900, ShaderLab: 80, HLSL: 20 },
  rootEntries: ["Assets", "ProjectSettings", ".github", "secret-client-notes.md"],
  npmDeps: [],
  cmakePackages: [],
  createdAt: "2024-03-01T00:00:00Z",
  pushedAt: "2025-06-01T00:00:00Z",
  ...over,
});

describe("private summary", () => {
  it("keeps languages above 5%", () => {
    expect(topLanguages({ "C#": 900, ShaderLab: 80, HLSL: 20 })).toEqual(["C#", "ShaderLab"]);
    expect(topLanguages({})).toEqual([]);
  });

  it("detects the stack from root files and well-known libraries only", () => {
    expect(detectStack(repo({ npmDeps: ["react", "@acme/internal-sdk"], cmakePackages: ["OpenXR", "AcmeCore"] }))).toEqual([
      "GitHub Actions",
      "OpenXR",
      "Unity",
      "react",
    ]);
  });

  it("numbers repos newest first and never prints names or file names", () => {
    const md = renderSummary([repo(), repo({ pushedAt: "2026-01-01T00:00:00Z", createdAt: "2026-01-01T00:00:00Z", languages: { Go: 1 }, rootEntries: ["go.mod"] })]);
    expect(md).toContain("Ali also has 2 private repos.");
    expect(md).toContain("- Private project 1 (2026): Go; uses Go modules.");
    expect(md).toContain("- Private project 2 (2024 to 2025): C#, ShaderLab; uses GitHub Actions, Unity.");
    expect(md).not.toMatch(/secret-client|Assets|acme/i);
  });
});
