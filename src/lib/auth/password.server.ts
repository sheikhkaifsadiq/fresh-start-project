/**
 * @file src/lib/auth/password.server.ts
 * @description Highly secure PBKDF2 password hashing for Cloudflare Workers.
 * Replaces legacy raw SHA-256 hashing and provides automatic migration hooks.
 */

const ITERATIONS = 120_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

/**
 * Perform a constant-time comparison of two strings to prevent timing attacks.
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  
  // We don't care about leaking length mismatch since hashes are fixed length.
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Generate a random salt as a hex string.
 */
function generateSaltHex(): string {
  const array = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive PBKDF2 hash using Web Crypto API.
 */
async function derivePBKDF2(password: string, saltHex: string, iterations: number): Promise<string> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const saltArray = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltArray,
      iterations: iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    HASH_BYTES * 8
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Legacy raw SHA-256 hashing (for migration purposes only).
 */
async function legacySha256(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password using PBKDF2-HMAC-SHA256.
 * Returns the format: $pbkdf2$sha256$iterations$salt$hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSaltHex();
  const hash = await derivePBKDF2(password, salt, ITERATIONS);
  return `$pbkdf2$sha256$${ITERATIONS}$${salt}$${hash}`;
}

export interface VerifyResult {
  isValid: boolean;
  needsMigration: boolean;
}

/**
 * Verify a password against a stored hash (supports PBKDF2 and legacy SHA-256).
 */
export async function verifyPassword(password: string, storedHash: string): Promise<VerifyResult> {
  if (!storedHash) return { isValid: false, needsMigration: false };

  // Check if it's the new PBKDF2 format
  if (storedHash.startsWith('$pbkdf2$')) {
    const parts = storedHash.split('$');
    // Expected: ["", "pbkdf2", "sha256", "120000", "salt", "hash"]
    if (parts.length !== 6) return { isValid: false, needsMigration: false };

    const iterations = parseInt(parts[3], 10);
    const salt = parts[4];
    const originalHash = parts[5];

    const computedHash = await derivePBKDF2(password, salt, iterations);
    
    const isValid = constantTimeCompare(originalHash, computedHash);
    
    // If iterations are less than our current standard, flag for migration
    const needsMigration = isValid && iterations < ITERATIONS;
    
    return { isValid, needsMigration };
  }

  // Fallback to legacy raw SHA-256
  // Warning: This path is heavily deprecated and vulnerable to rainbow tables.
  // It exists solely so users don't get locked out during migration.
  const computedLegacyHash = await legacySha256(password);
  const isValidLegacy = constantTimeCompare(storedHash, computedLegacyHash);

  return { isValid: isValidLegacy, needsMigration: isValidLegacy };
}
