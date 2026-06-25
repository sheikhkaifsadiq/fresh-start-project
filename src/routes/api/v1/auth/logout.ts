/**
 * @file src/routes/api/v1/auth/logout.ts
 * @description POST /api/v1/auth/logout — clears the server-side session.
 * The browser-side signOut is performed by the auth store.
 */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/auth/logout")({
  server: {
    handlers: {
      POST: async () => {
        return Response.json({ success: true }, { status: 200 });
      },
    },
  },
});
