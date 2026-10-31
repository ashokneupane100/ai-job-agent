/**
 * Only allow same-origin, relative redirect targets. Prevents open redirects
 * via a crafted `next` query parameter.
 */
export function safeNextPath(
  value: string | null | undefined,
  fallback = "/dashboard"
) {
  if (!value) {
    return fallback
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback
  }

  return value
}

/**
 * Resolve the public origin of a request, accounting for a load balancer or
 * proxy that terminates TLS.
 */
export function getRequestOrigin(request: Request) {
  const { origin } = new URL(request.url)
  const forwardedHost = request.headers.get("x-forwarded-host")

  if (process.env.NODE_ENV === "development" || !forwardedHost) {
    return origin
  }

  const protocol = request.headers.get("x-forwarded-proto") ?? "https"
  return `${protocol}://${forwardedHost}`
}

export type AuthState = {
  error?: string
  message?: string
}

export type FormActionState = {
  error?: string
  success?: boolean
}
