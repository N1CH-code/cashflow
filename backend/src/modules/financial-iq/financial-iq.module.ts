import { Module } from '@nestjs/common';
import { FinancialIQController } from './financial-iq.controller';
import { FinancialIQService } from './financial-iq.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FinancialIQController],
  providers: [FinancialIQService],
  exports: [FinancialIQService],
})
export class FinancialIQModule {}
