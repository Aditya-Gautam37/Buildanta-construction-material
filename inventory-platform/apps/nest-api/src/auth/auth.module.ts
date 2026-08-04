import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt.auth.guard';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
    imports: [ConfigModule, DatabaseModule],
    providers: [JwtAuthGuard],
    exports: [JwtAuthGuard]
})
export class AuthModule {}
