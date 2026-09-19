import crypto from 'node:crypto';

// The raw token is what goes in the emailed link; only hashToken()'s output
// is ever written to the database, so a DB read (or dump) alone can never
// produce a usable token — same principle as never storing a raw password.
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
