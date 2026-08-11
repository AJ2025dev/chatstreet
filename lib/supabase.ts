type SupabaseOptions = {
  admin?: boolean;
  headers?: HeadersInit;
};

export class SupabaseError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "SupabaseError";
    this.status = status;
    this.code = code;
  }
}

function configuration(admin = false) {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = admin ? secretKey : publishableKey;
  if (!url || !key) {
    throw new Error(admin ? "Supabase admin configuration is unavailable" : "Supabase configuration is unavailable");
  }
  return { url: url.replace(/\/$/, ""), key };
}

export function hasSupabase(admin = false) {
  try {
    configuration(admin);
    return true;
  } catch {
    return false;
  }
}

export async function supabaseRest<T>(path: string, init: RequestInit = {}, options: SupabaseOptions = {}): Promise<{ data: T; headers: Headers }> {
  const { url, key } = configuration(options.admin);
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...options.headers,
      ...init.headers,
    },
    cache: "no-store",
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new SupabaseError(payload?.message || `Supabase request failed (${response.status})`, response.status, payload?.code);
  }
  return { data: payload as T, headers: response.headers };
}

export async function supabaseCount(path: string) {
  const { headers } = await supabaseRest<unknown[]>(path, {}, {
    admin: true,
    headers: { Prefer: "count=exact", Range: "0-0" },
  });
  const range = headers.get("content-range") || "*/0";
  return Number(range.split("/")[1] || 0);
}
