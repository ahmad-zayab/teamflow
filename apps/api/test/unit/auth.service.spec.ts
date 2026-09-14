import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should prevent duplicate registration by throwing ConflictException', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: '1', email: 'test@teamflow.dev' } as any);

    await expect(
      authService.register({
        email: 'test@teamflow.dev',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      })
    ).rejects.toThrow(ConflictException);
  });
});
