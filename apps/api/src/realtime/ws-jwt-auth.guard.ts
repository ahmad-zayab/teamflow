/**
 * @file ws-jwt-auth.guard.ts
 * @description Authentication guard for WebSocket connections and incoming messages.
 * Validates JWT access tokens passed via Socket.IO handshake auth, headers, or cookies.
 */

import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';

/**
 * Guard that verifies JWT tokens on WebSocket message events and connections.
 * Caches authenticated user information on `client.data.user` to avoid redundant validations.
 */
@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Determines whether the incoming WebSocket message or connection is authorized.
   * If the client was already authenticated during handshake, authorization succeeds immediately.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();

    // If client.data.user is already attached (from connection handshake), permit
    if (client.data?.user?.id) {
      return true;
    }

    const token = this.extractToken(client);
    if (!token) {
      throw new WsException('Unauthorized: Missing authentication token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'super-secret',
      });
      client.data = client.data || {};
      client.data.user = { id: payload.sub };
      return true;
    } catch (err) {
      this.logger.warn(`WebSocket authentication failed: ${(err as Error).message}`);
      throw new WsException('Unauthorized: Invalid or expired token');
    }
  }

  /**
   * Extracts a JWT access token from the socket client handshake.
   * Checks multiple sources in priority order:
   * 1. Handshake auth payload (`token` or `accessToken`)
   * 2. Handshake `Authorization: Bearer <token>` header
   * 3. Cookies (`accessToken` cookie)
   *
   * @param client Socket client instance
   * @returns Extracted JWT string or null if not found
   */
  public extractToken(client: Socket): string | null {
    // 1. Check handshake auth payload
    const auth = client.handshake?.auth;
    if (auth?.token && typeof auth.token === 'string') {
      return auth.token.startsWith('Bearer ') ? auth.token.slice(7) : auth.token;
    }
    if (auth?.accessToken && typeof auth.accessToken === 'string') {
      return auth.accessToken;
    }

    // 2. Check Authorization header
    const authHeader = client.handshake?.headers?.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token;
      }
    }

    // 3. Check cookies
    const cookieHeader = client.handshake?.headers?.cookie;
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce<Record<string, string>>((acc, cookie) => {
        const [key, ...val] = cookie.trim().split('=');
        if (key) {
          acc[key] = decodeURIComponent(val.join('='));
        }
        return acc;
      }, {});

      if (cookies['accessToken']) {
        return cookies['accessToken'];
      }
    }

    return null;
  }
}
