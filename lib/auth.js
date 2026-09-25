import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'lilie_session';
const ADMIN_COOKIE_NAME = 'lilie_admin';

export function signSession(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '180d' });
}

export function verifySession(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

export function getSessionFromCookies() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function setSessionCookie(res, payload) {
  const token = signSession(payload);
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180
  });
}

export function clearSessionCookie(res) {
  res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

export function getAdminFromCookies() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = verifySession(token);
  return !!(payload && payload.admin === true);
}

export function setAdminCookie(res) {
  const token = signSession({ admin: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8
  });
}
