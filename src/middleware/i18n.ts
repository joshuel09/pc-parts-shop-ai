import type { Context, Next } from 'hono';
import type { Language } from '../types';
import { detectLanguage, t } from '../utils/i18n';

export async function i18nMiddleware(c: Context, next: Next) {
  const lang = detectLanguage(c.req.raw);
  
  c.set('lang', lang);
  c.set('t', (key: string) => t(key, lang));
  
  return next();
}