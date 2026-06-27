import "server-only";

const PROVIDER_TIMEOUT_MS = 6_000;
const MAX_PROVIDER_RESPONSE_BYTES = 2_000_000;

export class ProviderRequestError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "ProviderRequestError";
  }
}

export async function fetchProviderJson(
  url: URL,
  headers?: HeadersInit,
): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new ProviderRequestError("network_error");
  }

  if (!response.ok) {
    throw new ProviderRequestError(`http_${response.status}`);
  }

  const declaredLength = Number(response.headers.get("content-length"));

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_PROVIDER_RESPONSE_BYTES
  ) {
    throw new ProviderRequestError("response_too_large");
  }

  const body = await response.text();

  if (body.length > MAX_PROVIDER_RESPONSE_BYTES) {
    throw new ProviderRequestError("response_too_large");
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new ProviderRequestError("invalid_json");
  }
}
