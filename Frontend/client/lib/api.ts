const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.VERCEL_ENV === "production"
    ? "https://digiwork-platform-cizx.vercel.app"
    : "http://localhost:5000");

export function apiUrl(path: string): string {
  return `${API_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(apiUrl(path), { ...init, credentials: "include" });
}
