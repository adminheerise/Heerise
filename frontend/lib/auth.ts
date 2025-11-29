export function saveTokens(access: string, refresh: string) {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
}
export function getAccess(): string | null { return localStorage.getItem("access"); }
export function getRefresh(): string | null { return localStorage.getItem("refresh"); }
export function clearTokens() { localStorage.removeItem("access"); localStorage.removeItem("refresh"); }
