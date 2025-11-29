// frontend/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

async function call(path: string, opts: RequestInit = {}, withAuth = false) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };

  if (withAuth) {
    const token = localStorage.getItem("access");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

  if (res.status === 401 && withAuth) {
    const refresh = localStorage.getItem("refresh");
    if (refresh) {
      const rr = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (rr.ok) {
        const data = await rr.json();
        localStorage.setItem("access", data.access_token);
        localStorage.setItem("refresh", data.refresh_token);
        headers["Authorization"] = `Bearer data.access_token`;
        res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
      }
    }
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail) msg = data.detail;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return res.json();
}

export const api = {
  register: (email: string, password: string, name: string, username: string) =>
    call("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, username }),
    }),

  login: (email: string, password: string) =>
    call("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => call("/me", {}, true),

  updateProfile: (payload: any) =>
    call("/me/profile", { method: "PUT", body: JSON.stringify(payload) }, true),

  currentFlow: () => call("/onboarding/flows/current", {}, true),
  questions: (flowId: number) =>
    call(`/onboarding/flows/${flowId}/questions`, {}, true),
  saveAnswer: (question_id: number, answer_json: any) =>
    call(
      "/onboarding/responses",
      {
        method: "POST",
        body: JSON.stringify({ question_id, answer_json }),
      },
      true
    ),
  completeOnboarding: () =>
    call("/onboarding/complete", { method: "POST" }, true),

  logout: (refresh: string) =>
    call("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refresh }),
    }),
};

export const apiGet = (path: string, withAuth = false) =>
  call(path, {}, withAuth);
export const apiPut = (path: string, body: any, withAuth = true) =>
  call(path, { method: "PUT", body: JSON.stringify(body) }, withAuth);
