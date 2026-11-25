import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const SAFE_FETCH_TIMEOUT_MS = 8_000;
export const SAFE_FETCH_MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const ALLOWED_CONTENT_TYPE =
  /^(text\/html|application\/xhtml\+xml|application\/json|text\/plain)\b/i;

export type SafeFetchErrorCode =
  | "invalid_url"
  | "blocked_host"
  | "dns"
  | "http"
  | "content_type"
  | "timeout"
  | "too_large"
  | "network";

export class SafeFetchError extends Error {
  constructor(
    readonly code: SafeFetchErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SafeFetchError";
  }
}

export type SafeFetchOptions = {
  fetchImpl?: typeof fetch;
  resolveHost?: (hostname: string) => Promise<string[]>;
  timeoutMs?: number;
  maxBytes?: number;
};

export type SafeFetchResult = {
  url: string;
  html: string;
  contentType: string;
};

/** Private, loopback, link-local, reserved and documentation address ranges. */
export function isPrivateAddress(address: string): boolean {
  const ip = address.replace(/^\[|\]$/g, "");
  const family = isIP(ip);

  if (family === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127 || a >= 224) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 192 && b === 0) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 198 && b === 51 && ip.startsWith("198.51.100.")) return true;
    if (a === 203 && ip.startsWith("203.0.113.")) return true;
    return false;
  }

  if (family === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    if (lower.startsWith("::ffff:")) {
      return isPrivateAddress(lower.slice("::ffff:".length));
    }
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) {
      return true;
    }
    if (lower.startsWith("ff")) return true;
    if (lower.startsWith("2001:db8")) return true;
    return false;
  }

  // Unknown address formats must not slip through.
  return true;
}

function assertSafeHostname(hostname: string): void {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    (!host.includes(".") && isIP(host) === 0)
  ) {
    throw new SafeFetchError("blocked_host", "That host is not allowed.");
  }
}

async function assertSafeUrl(
  rawUrl: string,
  resolveHost: (hostname: string) => Promise<string[]>,
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SafeFetchError("invalid_url", "Enter a valid http(s) URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SafeFetchError("invalid_url", "Only http(s) URLs are supported.");
  }
  if (url.username || url.password) {
    throw new SafeFetchError("invalid_url", "URLs with credentials are not allowed.");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");
  assertSafeHostname(host);
  if (isIP(host)) {
    if (isPrivateAddress(host)) {
      throw new SafeFetchError("blocked_host", "Private addresses are not allowed.");
    }
    return url;
  }

  let addresses: string[];
  try {
    addresses = await resolveHost(host);
  } catch {
    throw new SafeFetchError("dns", "Could not resolve that hostname.");
  }
  if (addresses.length === 0) {
    throw new SafeFetchError("dns", "That hostname has no addresses.");
  }
  if (addresses.some(isPrivateAddress)) {
    throw new SafeFetchError("blocked_host", "That hostname resolves to a private address.");
  }
  return url;
}

async function readBody(response: Response, maxBytes: number): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new SafeFetchError("too_large", "That page is too large to import.");
  }

  if (!response.body) {
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      throw new SafeFetchError("too_large", "That page is too large to import.");
    }
    return text;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new SafeFetchError("too_large", "That page is too large to import.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Fetch a public recipe page with SSRF guards, redirects revalidated, a hard
 * timeout and a 2 MB body cap. Checks are repeated for every redirect hop.
 */
export async function fetchPublicPage(
  rawUrl: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const resolveHost =
    options.resolveHost ??
    (async (hostname: string) => {
      const records = await lookup(hostname, { all: true });
      return records.map((record) => record.address);
    });
  const timeoutMs = options.timeoutMs ?? SAFE_FETCH_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? SAFE_FETCH_MAX_BYTES;
  const signal = AbortSignal.timeout(timeoutMs);

  let current = await assertSafeUrl(rawUrl, resolveHost);

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    let response: Response;
    try {
      response = await fetchImpl(current, {
        method: "GET",
        redirect: "manual",
        signal,
        headers: {
          accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          "user-agent": "SnackersPitStop/1.0 (recipe import)",
        },
      });
    } catch (error) {
      if (signal.aborted || (error instanceof Error && error.name === "TimeoutError")) {
        throw new SafeFetchError("timeout", "That site took too long to respond.");
      }
      throw new SafeFetchError("network", "Could not reach that site.");
    }

    if (REDIRECT_STATUSES.has(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new SafeFetchError("http", "Redirect without a location.");
      current = await assertSafeUrl(new URL(location, current).toString(), resolveHost);
      continue;
    }

    if (!response.ok) {
      throw new SafeFetchError("http", `That site returned ${response.status}.`);
    }

    const contentType = response.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!ALLOWED_CONTENT_TYPE.test(contentType)) {
      throw new SafeFetchError(
        "content_type",
        "That URL did not return a supported page type.",
      );
    }

    return {
      url: current.toString(),
      html: await readBody(response, maxBytes),
      contentType,
    };
  }

  throw new SafeFetchError("http", "That page redirected too many times.");
}
