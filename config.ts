import 'dotenv/config';

const jwtSecret = process.env.JWT_SECRET?.trim();
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters before starting the API.');
}

export const JWT_SECRET = jwtSecret;
export const CLIENT_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
