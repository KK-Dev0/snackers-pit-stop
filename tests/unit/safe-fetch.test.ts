import { describe, expect, it, vi } from "vitest";

import {
  fetchPublicPage,
  isPrivateAddress,
  SafeFetchError,
} from "@/server/import/safe-fetch";

type FetchArgs = [input: RequestInfo | URL, init?: RequestInit];

const publicAddresses = async (hostname: string) => {
  void hostname;
  return ["93.184.216.34"];
};

function stubFetch(
  responder: (input: RequestInfo | URL) => Response | Promise<Response>,
) {
  return vi.fn(async (...args: FetchArgs) => {
    void args[1];
    return responder(args[0]);
  });
}

const htmlResponse = (body = '<html><script type="application/ld+json">{}</script></html>') =>
  new Response(body, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });

describe("safe URL fetching", () => {
  it("classifies private and reserved addresses", () => {
    for (const address of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "192.168.1.1",
      "169.254.169.254",
      "::1",
      "fc00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
    ]) {
      expect(isPrivateAddress(address), address).toBe(true);
    }
    expect(isPrivateAddress("93.184.216.34")).toBe(false);
    expect(isPrivateAddress("2606:4700::1111")).toBe(false);
  });

  it("rejects non-http schemes, credentials, loopback and private DNS answers", async () => {
    const fetchImpl = stubFetch(() => htmlResponse());

    await expect(
      fetchPublicPage("file:///etc/passwd", { fetchImpl, resolveHost: publicAddresses }),
    ).rejects.toMatchObject({ code: "invalid_url" } satisfies Partial<SafeFetchError>);
    await expect(
      fetchPublicPage("https://user:pass@example.com", {
        fetchImpl,
        resolveHost: publicAddresses,
      }),
    ).rejects.toMatchObject({ code: "invalid_url" } satisfies Partial<SafeFetchError>);
    await expect(
      fetchPublicPage("http://127.0.0.1/", { fetchImpl, resolveHost: publicAddresses }),
    ).rejects.toMatchObject({ code: "blocked_host" } satisfies Partial<SafeFetchError>);
    await expect(
      fetchPublicPage("http://localhost/", { fetchImpl, resolveHost: publicAddresses }),
    ).rejects.toMatchObject({ code: "blocked_host" } satisfies Partial<SafeFetchError>);
    await expect(
      fetchPublicPage("https://example.com", {
        fetchImpl,
        resolveHost: async () => ["10.0.0.5"],
      }),
    ).rejects.toMatchObject({ code: "blocked_host" } satisfies Partial<SafeFetchError>);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fetches a public page with a manual redirect policy and hard timeout", async () => {
    const fetchImpl = stubFetch(() => htmlResponse());

    const result = await fetchPublicPage("https://example.com/recipe", {
      fetchImpl,
      resolveHost: publicAddresses,
    });

    expect(result.url).toBe("https://example.com/recipe");
    expect(result.html).toContain("application/ld+json");
    const init = fetchImpl.mock.calls[0][1];
    expect(init?.redirect).toBe("manual");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("revalidates redirect targets and rejects private ones", async () => {
    const fetchImpl = stubFetch(() =>
      new Response(null, {
        status: 302,
        headers: { location: "http://169.254.169.254/latest/meta-data" },
      }),
    );

    await expect(
      fetchPublicPage("https://example.com/go", {
        fetchImpl,
        resolveHost: publicAddresses,
      }),
    ).rejects.toMatchObject({ code: "blocked_host" } satisfies Partial<SafeFetchError>);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("follows a safe redirect and returns the final URL", async () => {
    const fetchImpl = stubFetch((input) =>
      String(input).endsWith("/go")
        ? new Response(null, {
            status: 301,
            headers: { location: "https://example.com/recipe" },
          })
        : htmlResponse("final page"),
    );

    const result = await fetchPublicPage("https://example.com/go", {
      fetchImpl,
      resolveHost: publicAddresses,
    });
    expect(result.url).toBe("https://example.com/recipe");
    expect(result.html).toBe("final page");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("enforces content-type and body size limits", async () => {
    const badType = stubFetch(() =>
      new Response("pdf", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      }),
    );
    await expect(
      fetchPublicPage("https://example.com", {
        fetchImpl: badType,
        resolveHost: publicAddresses,
      }),
    ).rejects.toMatchObject({ code: "content_type" } satisfies Partial<SafeFetchError>);

    const declaredLarge = stubFetch(() =>
      new Response("", {
        status: 200,
        headers: { "content-type": "text/html", "content-length": "3000000" },
      }),
    );
    await expect(
      fetchPublicPage("https://example.com", {
        fetchImpl: declaredLarge,
        resolveHost: publicAddresses,
      }),
    ).rejects.toMatchObject({ code: "too_large" } satisfies Partial<SafeFetchError>);

    const streamedLarge = stubFetch(() => htmlResponse("x".repeat(120)));
    await expect(
      fetchPublicPage("https://example.com", {
        fetchImpl: streamedLarge,
        resolveHost: publicAddresses,
        maxBytes: 100,
      }),
    ).rejects.toMatchObject({ code: "too_large" } satisfies Partial<SafeFetchError>);
  });

  it("maps network and timeout failures to typed errors", async () => {
    const network = stubFetch(() => {
      throw new Error("socket hang up");
    });
    await expect(
      fetchPublicPage("https://example.com", {
        fetchImpl: network,
        resolveHost: publicAddresses,
      }),
    ).rejects.toMatchObject({ code: "network" } satisfies Partial<SafeFetchError>);

    const timeout = stubFetch(() => {
      throw new DOMException("expired", "TimeoutError");
    });
    await expect(
      fetchPublicPage("https://example.com", {
        fetchImpl: timeout,
        resolveHost: publicAddresses,
      }),
    ).rejects.toMatchObject({ code: "timeout" } satisfies Partial<SafeFetchError>);
  });
});
