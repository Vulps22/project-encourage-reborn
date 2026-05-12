type PathParams = Record<string, string | number>;
type QueryParams = Record<string, string | number | boolean>;

export class ClientError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ClientError';
  }
}

export abstract class Client {
  constructor(private baseUrl: string, private token: string) {}

  private buildUrl(path: string, params?: PathParams): string {
    if (!params) return path;
    return Object.entries(params).reduce(
      (url, [key, value]) => url.replace(`:${key}`, encodeURIComponent(String(value))),
      path
    );
  }

  private async request<T>(
    method: string,
    path: string,
    params?: PathParams,
    body?: unknown,
    query?: QueryParams
  ): Promise<T> {
    let url = `${this.baseUrl}${this.buildUrl(path, params)}`;
    if (query) {
      const qs = Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      if (qs) url += `?${qs}`;
    }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
      throw this.makeError(res.status, `${url}: ${payload.error ?? res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  protected makeError(status: number, message: string): ClientError {
    return new ClientError(status, message);
  }

  async get<T>(path: string, params?: PathParams, query?: QueryParams): Promise<T> {
    return this.request<T>('GET', path, params, undefined, query);
  }

  async post<T>(path: string, params?: PathParams, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, params, body);
  }

  async patch<T>(path: string, params?: PathParams, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, params, body);
  }

  async delete<T>(path: string, params?: PathParams): Promise<T> {
    return this.request<T>('DELETE', path, params);
  }
}
