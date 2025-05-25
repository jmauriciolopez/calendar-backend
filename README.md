# Calendar Management API - Backend

NestJS-based REST API for multi-tenant calendar management with Google Calendar integration.

## 🏗️ Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT + Google OAuth 2.0
- **APIs**: Google Calendar API
- **Architecture**: Multi-tenant with tenant isolation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Google Cloud Console project with Calendar API enabled

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Environment setup**
```bash
cp .env.example .env
# Configure your environment variables (see below)
```

3. **Database setup**
```bash
# Create database
createdb calendar_db

# Run migrations
npm run migration:run
```

4. **Start development server**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3001`

## 📦 Dependencies

### Package.json
```json
{
  "name": "calendar-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "build": "nest build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "migration:generate": "typeorm-ts-node-esm migration:generate",
    "migration:run": "typeorm-ts-node-esm migration:run",
    "migration:revert": "typeorm-ts-node-esm migration:revert"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "typeorm": "^0.3.0",
    "pg": "^8.8.0",
    "googleapis": "^126.0.0",
    "passport": "^0.6.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-jwt": "^4.0.0",
    "bcrypt": "^5.1.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.2.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.13",
    "@types/jest": "^29.0.0",
    "@types/node": "^20.0.0",
    "@types/passport-google-oauth20": "^2.0.0",
    "@types/passport-jwt": "^3.0.6",
    "@types/bcrypt": "^5.0.0",
    "jest": "^29.0.0",
    "source-map-support": "^0.5.20",
    "supertest": "^6.1.3",
    "ts-jest": "^29.0.0",
    "ts-loader": "^9.2.3",
    "ts-node": "^10.0.0",
    "tsconfig-paths": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=calendar_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
JWT_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Application Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 🗄️ Database Schema

### Entities

**Tenant Entity**
```typescript
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  domain: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => User, user => user.tenant)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**User Entity**
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true, type: 'text' })
  googleAccessToken: string;

  @Column({ nullable: true, type: 'text' })
  googleRefreshToken: string;

  @ManyToOne(() => Tenant, tenant => tenant.users, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column('uuid')
  tenantId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Database Setup Commands

```bash
# Create database
createdb calendar_db

# Generate migration (after entity changes)
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## 🔧 API Modules

### Auth Module

**Endpoints:**
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/login` - Manual login with email/tenant
- `GET /auth/profile` - Get current user profile

**Google OAuth Strategy:**
```typescript
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      scope: ['email', 'profile', 'https://www.googleapis.com/auth/calendar'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    const { id, name, emails } = profile;
    const user = {
      googleId: id,
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      accessToken,
      refreshToken,
    };
    return user;
  }
}
```

### Calendar Module

**Endpoints:**
- `GET /calendar/events` - Get user's calendar events
- `POST /calendar/events` - Create new calendar event
- `PUT /calendar/events/:id` - Update calendar event
- `DELETE /calendar/events/:id` - Delete calendar event
- `GET /calendar/calendars` - Get user's calendars

**Service Implementation:**
```typescript
@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private async getGoogleCalendar(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user?.googleAccessToken) {
      throw new UnauthorizedException('User not authenticated with Google');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    // Handle token refresh
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        user.googleRefreshToken = tokens.refresh_token;
      }
      if (tokens.access_token) {
        user.googleAccessToken = tokens.access_token;
      }
      await this.userRepository.save(user);
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  async getEvents(userId: string, startDate?: string, endDate?: string) {
    const calendar = await this.getGoogleCalendar(userId);
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate || new Date().toISOString(),
      timeMax: endDate,
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  }

  async createEvent(userId: string, eventData: CreateEventDto) {
    const calendar = await this.getGoogleCalendar(userId);
    
    const event = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime,
        timeZone: eventData.timeZone || 'UTC',
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: eventData.timeZone || 'UTC',
      },
      attendees: eventData.attendees?.map(email => ({ email })),
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return response.data;
  }
}
```

### Tenant Module

**Endpoints:**
- `GET /tenant` - Get current tenant info
- `POST /tenant` - Create new tenant (admin only)
- `PUT /tenant/:id` - Update tenant (admin only)
- `GET /tenant/users` - Get tenant users

## 🔐 Security & Guards

### JWT Auth Guard
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

### Tenant Guard (Multi-tenancy)
```typescript
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Ensure user belongs to a tenant
    if (!user.tenantId) {
      throw new ForbiddenException('No tenant access');
    }
    
    return true;
  }
}
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

### Integration Tests
```bash
# Run e2e tests
npm run test:e2e
```

### Test Example
```typescript
describe('AuthController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/profile (GET)', () => {
    return request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', 'Bearer valid-jwt-token')
      .expect(200);
  });
});
```

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
npm run start:prod
```

### Docker Setup
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-production-secret
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
FRONTEND_URL=https://your-frontend-domain.com
```

## 📊 Monitoring & Logging

### Health Check Endpoint
```typescript
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    };
  }
}
```

### Logging Configuration
```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('CalendarService');
logger.log('Calendar event created successfully');
logger.error('Failed to create calendar event', error.stack);
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -p 5432 -U postgres -d calendar_db
```

2. **Google API Issues**
```bash
# Verify Google Calendar API is enabled
# Check OAuth credentials are correct
# Ensure callback URLs match exactly
```

3. **JWT Token Issues**
```bash
# Verify JWT_SECRET is set
# Check token expiration
# Validate token format
```

## 📝 API Documentation

The API documentation is available via Swagger:
- Development: `http://localhost:3001/api-docs`
- Add Swagger module for auto-generated docs

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- Use ESLint and Prettier
- Follow NestJS conventions
- Write tests for new features
- Update documentation

## 📄 License

MIT License - see LICENSE file for details
