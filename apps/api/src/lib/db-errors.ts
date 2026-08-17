// https://www.postgresql.org/docs/current/errcodes-appendix.html
// 23503 = foreign_key_violation (INSERT/UPDATE referencing a missing row)
// 23001 = restrict_violation (DELETE/UPDATE blocked by an ON DELETE RESTRICT reference)
const FOREIGN_KEY_VIOLATION_CODES = new Set(["23503", "23001"]);

function getPgErrorCode(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  if ("code" in err && typeof err.code === "string") return err.code;
  if ("cause" in err) return getPgErrorCode((err as { cause?: unknown }).cause);
  return undefined;
}

export function isForeignKeyViolation(err: unknown): boolean {
  const code = getPgErrorCode(err);
  return code !== undefined && FOREIGN_KEY_VIOLATION_CODES.has(code);
}
