import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const pool = new Pool({
  connectionString: getRequiredEnv('DATABASE_URL'),
  // Better Auth queries run against the app schema where auth tables live.
  options: '-c search_path=tripaivisor,public'
});

export const auth = betterAuth({
  database: pool,
  advanced: {
    database: {
      generateId: 'serial'
    }
  },
  emailAndPassword: {
    enabled: false
  },
  socialProviders: {
    google: {
      clientId: getRequiredEnv('GOOGLE_CLIENT_ID'),
      clientSecret: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
      scope: ['email', 'profile']
    }
  },
  user: {
    modelName: 'users',
    fields: {
      id: 'user_id',
      emailVerified: 'email_verified',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  session: {
    modelName: 'sessions',
    fields: {
      id: 'session_id',
      userId: 'user_id',
      expiresAt: 'expires_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24
  },
  account: {
    modelName: 'accounts',
    fields: {
      id: 'account_id',
      userId: 'user_id',
      accountId: 'provider_account_id',
      providerId: 'provider',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      idToken: 'id_token',
      accessTokenExpiresAt: 'expires_at',
      refreshTokenExpiresAt: 'expires_at',
      scope: 'scope',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  verification: {
    modelName: 'verification',
    fields: {
      identifier: 'identifier',
      value: 'value',
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
});
