import { hc } from "hono/client";
import type { AppType } from "@repo/api";

export const client = hc<AppType>(import.meta.env.VITE_API_URL ?? "http://localhost:3000");
