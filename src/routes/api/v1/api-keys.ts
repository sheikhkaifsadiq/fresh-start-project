import { createFileRoute } from "@tanstack/react-router";
import { 
  listApiKeysForUser, 
  createApiKeyRecord, 
  revokeApiKey 
} from "@/lib/security/api-key-manager";
import { createSecureHandler } from "@/lib/security/global-middleware.server";

export const Route = createFileRoute("/api/v1/api-keys")({
  server: {
    handlers: {
      GET: createSecureHandler(async ({ userId }) => {
        try {
          const keys = await listApiKeysForUser(userId);
          return Response.json({ success: true, data: keys });
        } catch (err: any) {
          return Response.json({ success: false, error: err.message }, { status: 500 });
        }
      }),

      POST: createSecureHandler(async ({ request, userId }) => {
        try {
          const body = await request.json(); // Safe wrapper
          const { name, permissions, environment, expiresAt } = body;
          
          if (!name || !environment) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
          }

          const { record, generated } = await createApiKeyRecord(
            userId,
            name,
            permissions || [],
            environment,
            expiresAt || null
          );

          return Response.json({ success: true, data: { record, generated } }, { status: 201 });
        } catch (err: any) {
          return Response.json({ success: false, error: err.message }, { status: 500 });
        }
      }),

      DELETE: createSecureHandler(async ({ request, userId }) => {
        try {
          const url = new URL(request.url);
          const id = url.searchParams.get("id");
          if (!id) return Response.json({ error: "Missing key ID" }, { status: 400 });

          // API Key manager uses userId to enforce IDOR protection internally during revoke
          await revokeApiKey(id, userId);
          return Response.json({ success: true });
        } catch (err: any) {
          return Response.json({ success: false, error: err.message }, { status: 500 });
        }
      }),
    },
  },
});
