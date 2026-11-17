import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { CalcService } from './calc.service';
import { AuthController } from './auth';
import { MasterController } from './master.controller';
import { HargaController, RabController } from './rab.controller';

@Module({
  imports: [JwtModule.register({ global: true, secret: process.env.JWT_SECRET || 'dev-secret', signOptions: { expiresIn: '8h' } })],
  controllers: [AuthController, MasterController, HargaController, RabController],
  providers: [PrismaService, CalcService],
})
export class AppModule {}
