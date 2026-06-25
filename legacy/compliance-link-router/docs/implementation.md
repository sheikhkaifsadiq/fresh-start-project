# Implementation Details Document for Secure, Compliance-Shielded Link Routing SaaS Platform

## 1. Introduction

This document provides specific implementation guidelines and code-level details for critical components of the secure, compliance-shielded link routing SaaS platform. It bridges the gap between the high-level architecture defined in the TRD and the actual coding practices required by the engineering team.

## 2. Frontend Implementation (Next.js)

### 2.1. Client-Side Debouncing (FR-26)

To optimize performance and reduce backend load, search inputs must implement a 300ms debounce. This prevents an API call from firing on every keystroke.

**Implementation using React Hooks:**

```tsx
import { useState, useEffect } from 'react';

// Custom hook for debouncing a value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timeout if the value changes before the delay has passed
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage in a Search Component
export function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  // Apply the 300ms debounce requirement (FR-26)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    // Only trigger the API call when the debounced value changes
    if (debouncedSearchTerm !== undefined) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  return (
    <input
      type="text"
      placeholder="Search links..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="border p-2 rounded"
    />
  );
}
```

## 3. Backend API Implementation (Node.js/TypeScript)

### 3.1. Input Sanitization and Validation (NFR-5, NFR-6)

All incoming data must be strictly validated against bound controls and sanitized to prevent injection attacks. We use `zod` for schema validation.

**Implementation Example (Express.js route handler):**

```typescript
import { z } from 'zod';
import express from 'express';
import { createLinkInDb } from '../services/linkService';

const router = express.Router();

// Define the schema enforcing NFR-5 (Input Bound Controls)
const createLinkSchema = z.object({
  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9-]+$/, "Slug can only contain alphanumeric characters and hyphens"),
  targetUrl: z.string()
    .url("Must be a valid URL")
    .max(2048, "Target URL cannot exceed 2048 characters"),
  title: z.string()
    .max(100, "Title cannot exceed 100 characters")
    .optional(),
  description: z.string()
    .max(250, "Description cannot exceed 250 characters")
    .optional(),
});

router.post('/links', async (req, res) => {
  try {
    // 1. Validate and sanitize input
    // Zod automatically strips unknown keys and enforces types/lengths
    const validatedData = createLinkSchema.parse(req.body);

    // 2. Further sanitization for XSS (NFR-6) if data is rendered directly in HTML later
    // Note: Modern frontend frameworks (React) handle basic XSS escaping, 
    // but backend sanitization provides defense-in-depth.
    // Example using a library like 'xss':
    // const safeTitle = xss(validatedData.title);

    // 3. Database Interaction (SQLi prevention via parameterized queries)
    // Assuming createLinkInDb uses Prisma or Supabase client which handles parameterization
    const newLink = await createLinkInDb({
      ...validatedData,
      userId: req.user.id // Assuming user ID is attached by auth middleware
    });

    res.status(201).json(newLink);

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return 400 Bad Request for validation failures
      return res.status(400).json({ errors: error.errors });
    }
    // Handle other errors (e.g., database errors)
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
```

### 3.2. Malicious File Upload Prevention (NFR-4)

When handling file uploads (e.g., for custom link preview images), strict checks must be enforced before interacting with Supabase Storage.

**Implementation Example (using `multer` for multipart/form-data):**

```typescript
import multer from 'multer';
import express from 'express';
import { supabaseAdmin } from '../config/supabase'; // Admin client for storage operations

const router = express.Router();

// Configure Multer to enforce NFR-4 requirements
const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory temporarily for validation
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB maximum limit
  },
  fileFilter: (req, file, cb) => {
    // Lock validation to specific MIME formats
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, and WEBP are allowed.'));
    }
  }
});

router.post('/assets/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname}`;
    // Ensure storage path is private
    const bucketName = 'private-assets'; 

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(`images/${fileName}`, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) throw error;

    res.status(200).json({ path: data.path });

  } catch (error: any) {
    if (error.message.includes('Invalid file type') || error.message.includes('File too large')) {
        return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Upload failed.' });
  }
});
```

## 4. Edge Middleware Implementation (Vercel)

### 4.1. IP Leaky-Bucket Rate Limiting (FR-09)

Implementing a true leaky bucket at the Edge requires a fast, globally distributed state store like Upstash Redis.

**Implementation Example (Pseudocode using `@upstash/redis`):**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const BUCKET_CAPACITY = 10;
const LEAK_RATE_PER_SECOND = 1;

export async function rateLimitMiddleware(req: NextRequest) {
  const ip = req.ip || '127.0.0.1';
  const key = `rate_limit:${ip}`;

  const now = Date.now();
  
  // Lua script to execute leaky bucket logic atomically in Redis
  const script = `
    local key = KEYS[1]
    local capacity = tonumber(ARGV[1])
    local leak_rate = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local requested = 1

    local bucket = redis.call("HMGET", key, "tokens", "last_update")
    local tokens = tonumber(bucket[1])
    local last_update = tonumber(bucket[2])

    if not tokens then
      tokens = capacity
      last_update = now
    end

    -- Calculate leaked tokens
    local elapsed_seconds = (now - last_update) / 1000
    local leaked = elapsed_seconds * leak_rate
    tokens = math.min(capacity, tokens + leaked)

    if tokens >= requested then
      tokens = tokens - requested
      redis.call("HMSET", key, "tokens", tokens, "last_update", now)
      redis.call("EXPIRE", key, math.ceil(capacity / leak_rate)) -- Set TTL
      return 1 -- Allowed
    else
      redis.call("HMSET", key, "tokens", tokens, "last_update", now)
      return 0 -- Rate limited
    end
  `;

  const result = await redis.eval(script, [key], [BUCKET_CAPACITY, LEAK_RATE_PER_SECOND, now]);

  if (result === 0) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  return null; // Proceed to next middleware/handler
}
```

## 5. Security Configuration

### 5.1. Dependabot Configuration (NFR-8)

To automate dependency security updates, the following `.github/dependabot.yml` file must be placed in the root of the repository.

```yaml
# .github/dependabot.yml
version: 2
updates:
  # Maintain dependencies for npm (Frontend & Backend)
  - package-ecosystem: "npm"
    directory: "/" # Assuming root contains package.json, adjust if using monorepo
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    ignore:
      - dependency-name: "eslint" # Example: ignore specific packages if they cause issues
        versions: ["> 8.0.0"]

  # Maintain dependencies for GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```
