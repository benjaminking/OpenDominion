export interface ServerConfig {
  port: number;
  mongoUri: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiresInSeconds: number;
  jwtRefreshExpiresInSeconds: number;
}

function readNumberEnv(name: string, fallback: number): number {
  const rawValue: string | undefined = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsedValue: number = Number(rawValue);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

export const serverConfig: ServerConfig = {
  port: readNumberEnv('PORT', 3000),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/opendominion',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
  jwtAccessExpiresInSeconds: readNumberEnv('JWT_ACCESS_EXPIRES_SECONDS', 60 * 15),
  jwtRefreshExpiresInSeconds: readNumberEnv('JWT_REFRESH_EXPIRES_SECONDS', 60 * 60 * 24 * 14),
};
