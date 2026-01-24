/**
 * Utilities for setting cache headers on API responses
 */

import { NextResponse } from "next/server";

export enum CacheDuration {
  SHORT = 300, // 5 minutes
  MEDIUM = 900, // 15 minutes
  LONG = 3600, // 1 hour
  VERY_LONG = 86400, // 1 day
  STATIC = 31536000, // 1 year
}

/**
 * Create response headers for caching
 */
export function getCacheHeaders(duration: CacheDuration = CacheDuration.MEDIUM) {
  return {
    "Cache-Control": `public, max-age=${duration}`,
    "CDN-Cache-Control": `max-age=${duration}`,
  };
}

/**
 * Create response headers for non-cached responses
 */
export function getNoCacheHeaders() {
  return {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };
}

/**
 * Create response headers for private cached responses
 */
export function getPrivateCacheHeaders(duration: CacheDuration = CacheDuration.MEDIUM) {
  return {
    "Cache-Control": `private, max-age=${duration}`,
  };
}

/**
 * Add ETags for conditional requests
 */
export function getETagHeaders(content: string) {
  const crypto = require("crypto");
  const hash = crypto.createHash("md5").update(content).digest("hex");
  return {
    "ETag": `"${hash}"`,
  };
}

/**
 * Create NextResponse with cache headers
 */
export function cacheResponse<T>(
  data: T,
  duration: CacheDuration = CacheDuration.MEDIUM,
  status: number = 200
) {
  return NextResponse.json(data, {
    status,
    headers: getCacheHeaders(duration),
  });
}

/**
 * Create NextResponse with no cache headers
 */
export function noCacheResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: getNoCacheHeaders(),
  });
}

/**
 * Create NextResponse with private cache headers
 */
export function privateCacheResponse<T>(
  data: T,
  duration: CacheDuration = CacheDuration.MEDIUM,
  status: number = 200
) {
  return NextResponse.json(data, {
    status,
    headers: getPrivateCacheHeaders(duration),
  });
}
