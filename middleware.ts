import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

class EdgeRateLimiter {
  private requests = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs = 60000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requests = this.requests.get(key) ?? [];
    const recentRequests = requests.filter((time) => time > windowStart);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter((time) => time > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requests = this.requests.get(key) ?? [];
    const recentRequests = requests.filter((time) => time > windowStart);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  getResetTime(key: string): number {
    const requests = this.requests.get(key) ?? [];
    if (requests.length === 0) return Date.now();
    return Math.min(...requests) + this.windowMs;
  }
}

const rateLimiter = new EdgeRateLimiter(60000, 100); // 100 requests per minute

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const vercelIP = request.headers.get("x-vercel-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  if (realIP) {
    return realIP;
  }

  if (vercelIP) {
    return vercelIP;
  }

  return "unknown";
}

function createRateLimitResponse(resetTime: number) {
  return new NextResponse(
    JSON.stringify({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      resetTime: new Date(resetTime).toISOString(),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
        "X-RateLimit-Reset": resetTime.toString(),
      },
    },
  );
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const clientIP = getClientIP(request);
    const key = `${clientIP}:${request.nextUrl.pathname}`;

    if (!rateLimiter.isAllowed(key)) {
      const resetTime = rateLimiter.getResetTime(key);
      return createRateLimitResponse(resetTime);
    }

    const remaining = rateLimiter.getRemainingRequests(key);
    const response = NextResponse.next();

    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Limit", "100");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
