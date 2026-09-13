export class FetchJsonError extends Error {}

/**
 * fetch() + JSON parsing with a friendly failure mode.
 *
 * If the server times out (Vercel returns its own 504 HTML/plain-text error
 * page) or the response otherwise isn't JSON, calling `res.json()` directly
 * throws a cryptic "Unexpected token '<'... is not valid JSON" error. This
 * wrapper reads the body as text first, so it can tell the difference
 * between "server sent us broken JSON" and "server (or a proxy in front of
 * it) sent us something that was never JSON to begin with", and surfaces a
 * clear, user-facing message either way instead of a raw parser error.
 */
export async function fetchJson<T = any>(
  input: string,
  init?: RequestInit,
  timeoutMs = 55000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new FetchJsonError(
        "Permintaan memakan waktu terlalu lama dan dibatalkan di sisi browser. Coba lagi - graf yang kompleks kadang butuh beberapa kali percobaan."
      );
    }
    throw new FetchJsonError("Tidak bisa terhubung ke server. Periksa koneksi internetmu lalu coba lagi.");
  } finally {
    clearTimeout(timeoutId);
  }

  const raw = await res.text();
  let data: unknown = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      if (res.status === 504) {
        throw new FetchJsonError(
          "Server memakan waktu terlalu lama untuk merespons (timeout). Coba lagi dalam beberapa saat, atau coba keputusan yang lebih singkat."
        );
      }
      throw new FetchJsonError(`Respons server tidak valid (status ${res.status}).`);
    }
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof (data as any).error === "string"
        ? (data as any).error
        : `Permintaan gagal (status ${res.status}).`;
    throw new FetchJsonError(message);
  }

  return data as T;
}
