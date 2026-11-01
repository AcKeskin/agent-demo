import type { AskResponse } from "../worker/handler.ts";

/**
 * Shown when the widget has no endpoint. It is an illustration of the trace
 * format, labelled as such in the UI, not a recorded answer.
 */
export const EXAMPLE: { question: string; result: AskResponse } = {
  question: "What graphics work has he done?",
  result: {
    steps: [
      { tool: "list_repos", input: {}, ok: true, preview: "procedural-planets | C++ | ... canvas-deck | TypeScript | ... contexture | ..." },
      { tool: "get_readme", input: { repo: "procedural-planets" }, ok: true, preview: "Earth and 12 sci-fi planet types generated on the GPU: terrain, biomes, oceans, atmosphere, volumetric clouds..." },
      { tool: "get_private_work_summary", input: {}, ok: true, preview: "At Hololight (Munich, since June 2022) Ali owns what runs on the headset..." },
    ],
    answer:
      "His main graphics project is procedural-planets: Earth and 12 planet types generated on the GPU in C++ and OpenGL, with terrain, oceans, atmosphere and volumetric clouds. At work he built colour and depth frame output through OpenGL and a reprojection testbed for Android.",
    truncated: false,
  },
};
