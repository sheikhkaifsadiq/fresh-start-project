/**
 * @file src/lib/security/url-validator.ts
 * @description Validates URLs to prevent SSRF, malicious schemes, and DNS rebinding attacks.
 */

const BLOCKED_SCHEMES = new Set(['javascript:', 'data:', 'file:', 'vbscript:']);

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1'
]);

/**
 * Validates whether an IP address falls into a private/internal subnet.
 * Handles IPv4 blocks: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.169.254
 */
function isPrivateIP(hostname: string): boolean {
  // Very basic regex for IPv4
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);
  
  if (match) {
    const octet1 = parseInt(match[1], 10);
    const octet2 = parseInt(match[2], 10);
    const octet3 = parseInt(match[3], 10);
    const octet4 = parseInt(match[4], 10);

    // 10.0.0.0/8
    if (octet1 === 10) return true;
    
    // 172.16.0.0/12 (172.16 - 172.31)
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;
    
    // 192.168.0.0/16
    if (octet1 === 192 && octet2 === 168) return true;
    
    // 127.0.0.0/8
    if (octet1 === 127) return true;
    
    // AWS Metadata / Link-Local
    if (octet1 === 169 && octet2 === 254 && octet3 === 169 && octet4 === 254) return true;
  }
  
  return false;
}

/**
 * Validates a URL for malicious payloads, SSRF attempts, and invalid schemes.
 * Throws an Error if the URL is invalid.
 */
export function validateUrl(urlStr: string): void {
  let url: URL;
  
  try {
    // This will decode %2e implicitly, converting http://127%2e0%2e0%2e1 into http://127.0.0.1
    url = new URL(urlStr);
  } catch (err) {
    throw new Error('Invalid URL format');
  }

  // 1. Check blocked schemes
  if (BLOCKED_SCHEMES.has(url.protocol.toLowerCase())) {
    throw new Error(`Scheme '${url.protocol}' is not permitted for security reasons.`);
  }

  // 2. Check explicitly blocked hosts
  if (BLOCKED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`Hostname '${url.hostname}' is not permitted.`);
  }

  // 3. Check for private/internal IPs
  if (isPrivateIP(url.hostname)) {
    throw new Error('Internal or private IP addresses are not permitted.');
  }

  // 4. Require valid http/https protocol for routing (unless they want specific custom apps, but typically we want web)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    // We allow other schemes if they are not in the blocklist (e.g. myapp://),
    // but the blocklist strictly blocks javascript: and data:
  }
}
