import {
  BadRequestException,
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  HttpException,
  HttpStatus,
  Injectable,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  createParamDecorator,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from './prisma.service';
import { AuthUser } from './util';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwt: JwtService) {}
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    try {
      const p = this.jwt.verify((req.headers.authorization || '').replace('Bearer ', ''));
      req.user = { id: p.sub, role: p.role, bumdesId: p.bumdesId ?? null } as AuthUser;
      return true;
    } catch {
      throw new UnauthorizedException('Sesi tidak valid atau telah berakhir');
    }
  }
}
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user as AuthUser);

// In-memory rate limiter per IP/email untuk mencegah brute force login
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

@Controller()
export class AuthController {
  constructor(private db: PrismaService, private jwt: JwtService) {}

  @Get('/')
  health() {
    return { status: 'ok', service: 'rab-mvp-backend' };
  }

  @Post('auth/login')
  async login(@Body() b: { email?: string; password?: string }, @Req() req: any) {
    const email = String(b?.email ?? '').trim().toLowerCase();
    const password = String(b?.password ?? '');

    if (!email || !password) {
      throw new BadRequestException('Email dan password wajib diisi');
    }

    // Identifikasi IP client
    const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || 'unknown';
    const key = `${ip}:${email}`;
    const now = Date.now();

    const record = failedAttempts.get(key);
    if (record && now < record.resetAt && record.count >= 5) {
      const waitSec = Math.ceil((record.resetAt - now) / 1000);
      throw new HttpException(
        `Terlalu banyak percobaan masuk yang gagal. Silakan coba lagi dalam ${waitSec} detik.`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    const u = await this.db.user.findUnique({ where: { email }, include: { bumdes: true } });
    const isPasswordValid = u ? await bcrypt.compare(password, u.password) : false;

    if (!u || !isPasswordValid) {
      // Catat kegagalan
      const current = failedAttempts.get(key);
      if (!current || now >= current.resetAt) {
        failedAttempts.set(key, { count: 1, resetAt: now + 60_000 }); // window 60 detik
      } else {
        current.count += 1;
      }
      throw new UnauthorizedException('Email atau password salah');
    }

    // Login sukses: bersihkan catatan kegagalan
    failedAttempts.delete(key);

    const token = this.jwt.sign({ sub: u.id, role: u.role, bumdesId: u.bumdesId });
    return {
      token,
      user: {
        nama: u.nama,
        email: u.email,
        role: u.role,
        bumdes: u.bumdes ? { uuid: u.bumdes.uuid, nama: u.bumdes.nama } : null,
      },
    };
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async me(@CurrentUser() u: AuthUser) {
    const x = await this.db.user.findUnique({ where: { id: u.id }, include: { bumdes: true } });
    if (!x) {
      throw new UnauthorizedException('Pengguna tidak ditemukan atau telah dinonaktifkan');
    }
    return {
      nama: x.nama,
      email: x.email,
      role: x.role,
      bumdes: x.bumdes ? { uuid: x.bumdes.uuid, nama: x.bumdes.nama } : null,
    };
  }
}
