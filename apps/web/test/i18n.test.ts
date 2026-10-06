import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { localeCookieString, localeDir, parseLocale } from '../lib/i18n/locale';
import { dictionaries } from '../lib/i18n/messages';

function lookup(messages: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = messages;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

describe('locale helpers', () => {
  it('defaults unknown values to English LTR', () => {
    assert.equal(parseLocale(undefined), 'en');
    assert.equal(parseLocale('fr'), 'en');
    assert.equal(parseLocale('ar'), 'ar');
    assert.equal(localeDir('ar'), 'rtl');
    assert.equal(localeDir('en'), 'ltr');
  });

  it('writes a first-party locale cookie without Secure (not a secret)', () => {
    const cookie = localeCookieString('ar');
    assert.match(cookie, /^hospital_locale=ar;/);
    assert.match(cookie, /SameSite=Lax/);
    assert.doesNotMatch(cookie, /Secure/);
  });

  it('ships Arabic and English dictionaries for authentication', () => {
    assert.equal(lookup(dictionaries.ar as Record<string, unknown>, 'auth.signIn'), 'تسجيل الدخول');
    assert.equal(lookup(dictionaries.en as Record<string, unknown>, 'auth.signIn'), 'Sign in');
  });
});
