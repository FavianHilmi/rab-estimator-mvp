import { Body, CanActivate, Controller, ExecutionContext, Get, Injectable, Post, UnauthorizedException, UseGuards, createParamDecorator } from '@nestjs/common';
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
    } catch { throw new UnauthorizedException(); }
  }
}
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user as AuthUser);

@Controller()
export class AuthController {
  constructor(private db: PrismaService, private jwt: JwtService) {}

  @Post('auth/login')
  async login(@Body() b: { email: string; password: string }) {
    const u = await this.db.user.findUnique({ where: { email: String(b.email ?? '') }, include: { bumdes: true } });
    if (!u || !(await bcrypt.compare(String(b.password ?? ''), u.password))) throw new UnauthorizedException('Email atau password salah');
    const token = this.jwt.sign({ sub: u.id, role: u.role, bumdesId: u.bumdesId });
    return { token, user: { nama: u.nama, role: u.role, bumdes: u.bumdes ? { uuid: u.bumdes.uuid, nama: u.bumdes.nama } : null } };
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async me(@CurrentUser() u: AuthUser) {
    const x = await this.db.user.findUnique({ where: { id: u.id }, include: { bumdes: true } });
    return { nama: x!.nama, role: x!.role, bumdes: x!.bumdes ? { uuid: x!.bumdes.uuid, nama: x!.bumdes.nama } : null };
  }
}
