import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

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
