// https://www.postgresql.org/docs/current/errcodes-appendix.html
// 23503 = foreign_key_violation (INSERT/UPDATE referencing a missing row)
const FOREIGN_KEY_VIOLATION = "23503";

function getPgErrorCode(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  if ("code" in err && typeof err.code === "string") return err.code;
  if ("cause" in err) return getPgErrorCode((err as { cause?: unknown }).cause);
  return undefined;
}

export function isForeignKeyViolation(err: unknown): boolean {
  return getPgErrorCode(err) === FOREIGN_KEY_VIOLATION;
}
