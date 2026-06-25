export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events (SSE) — Live Traffic Stream
 * 
 * Streams real-time neural network classification events to the dashboard.
 * Clients subscribe and receive instant JSON payloads every time a link
 * click is classified by the Deep Neural Network.
 */

import { NextRequest } from 'next/server';

// Global event emitter for broadcasting to all connected dashboard clients
const subscribers = new Set<ReadableStreamDefaultController>();

function broadcastEvent(event: object) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  subscribers.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(payload));
    } catch {
      subscribers.delete(controller);
    }
  });
}

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      subscribers.add(controller);

      // Send initial connection confirmation
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`)
      );

      // Heartbeat every 15 seconds to prevent proxy disconnection
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        subscribers.delete(controller);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
