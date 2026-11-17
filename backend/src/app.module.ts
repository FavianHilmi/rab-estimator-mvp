import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { CalcService } from './calc.service';
import { AuthController } from './auth';
import { MasterController } from './master.controller';
import { HargaController, RabController } from './rab.controller';

const isProd = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || 'dev-secret';

if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret')) {
  console.warn('⚠️ PERINGATAN KEAMANAN: JWT_SECRET wajib diatur dengan nilai rahasia di environment produksi!');
}

@Module({
  imports: [JwtModule.register({ global: true, secret: jwtSecret, signOptions: { expiresIn: '8h' } })],
  controllers: [AuthController, MasterController, HargaController, RabController],
  providers: [PrismaService, CalcService],
})
export class AppModule {}
