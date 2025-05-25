import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Modules
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { CalendarModule } from './calendar/calendar.module';
import { UserModule } from './user/user.module';
import { HealthModule } from './health/health.module';

// Entities
import { User } from './user/entities/user.entity';
import { Tenant } from './tenant/entities/tenant.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: +configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [User, Tenant],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    
    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') || '7d' },
      }),
      inject: [ConfigService],
    }),
    
    // Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // Feature modules
    AuthModule,
    TenantModule,
    CalendarModule,
    UserModule,
    HealthModule,
  ],
})
export class AppModule {}