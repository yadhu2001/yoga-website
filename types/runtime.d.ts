// Runtime bindings are provided by the Sites Cloudflare Worker dispatcher.
declare module 'cloudflare:workers' { export const env: Record<string, any>; }
interface Fetcher { fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>; }
interface D1Database { prepare(query: string): any; batch(statements: any[]): Promise<any[]>; }
