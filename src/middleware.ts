import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routing, type AppLocale } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_PATH_PREFIXES = ['/login', '/share'];
const SESSION_COOKIE_NAMES = ['better-auth.session_token', '__Secure-better-auth.session_token'];

function isLocale(value: string | undefined): value is AppLocale {
  return Boolean(value) && routing.locales.includes(value as AppLocale);
}

function getLocaleFromPath(pathname: string): AppLocale {
  const localeSegment = pathname.split('/')[1];
  return isLocale(localeSegment) ? localeSegment : routing.defaultLocale;
}

function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split('/');
  const localeSegment = segments[1];

  if (!isLocale(localeSegment)) {
    return pathname;
  }

  const rest = segments.slice(2).join('/');
  return rest ? `/${rest}` : '/';
}

function isPublicPath(pathname: string): boolean {
  const normalizedPath = stripLocalePrefix(pathname);

  return PUBLIC_PATH_PREFIXES.some((prefix) => {
    return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
  });
}

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((cookieName) => Boolean(request.cookies.get(cookieName)?.value));
}

export function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname) || hasSessionCookie(request)) {
    return intlResponse;
  }

  const locale = getLocaleFromPath(pathname);
  const loginUrl = new URL(`/${locale}/login`, request.url);
  loginUrl.searchParams.set('redirectTo', `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
