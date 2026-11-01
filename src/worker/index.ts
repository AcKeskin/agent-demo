import data from "../generated/data.json";
import type { Env } from "./env.ts";
import { createHandler } from "./handler.ts";

const handle = createHandler({ privateSummary: data.privateSummary });

export default {
  fetch: (req: Request, env: Env) => handle(req, env),
};
