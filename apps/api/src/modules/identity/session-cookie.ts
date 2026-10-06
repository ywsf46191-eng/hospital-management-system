import { Inject, Injectable } from '@nestjs/common';
import type { Response } from 'express';
import type { AppConfig } from '../../config/app-config';
import { APP_CONFIG } from '../../config/config.module';
import { SESSION_COOKIE } from './session-token';

/** Secure + HttpOnly + SameSite=Lax session cookie (P3-D4). Never readable by JavaScript. */
@Injectable()
export class SessionCookie {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  set(response: Response, token: string, expiresAt: Date): void {
    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: this.config.session.cookieSecure,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
  }

  clear(response: Response): void {
    response.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: this.config.session.cookieSecure,
      sameSite: 'lax',
      path: '/',
    });
  }
}
