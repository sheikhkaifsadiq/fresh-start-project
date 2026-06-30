import { createFileRoute } from "@tanstack/react-router";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { createSecureHandler } from "@/lib/security/global-middleware.server";

export const Route = createFileRoute("/api/v1/ml-models")({
  server: {
    handlers: {
      GET: createSecureHandler(
        async ({ request }) => {
          const admin = createAdminClient();

          try {
            const url = new URL(request.url);
            const searchParams = url.searchParams;
            const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20));
            const modelType = searchParams.get('model_type') ?? null;
            const isActive = searchParams.get('is_active');

            const offset = (page - 1) * limit;

            let query = admin
              .from('ml_models')
              .select('*', { count: 'exact' })
              .order('created_at', { ascending: false })
              .range(offset, offset + limit - 1);

            if (modelType) query = query.eq('model_type', modelType);
            if (isActive !== null) query = query.eq('is_active', isActive === 'true');

            const { data: models, error, count } = await query;

            if (error) {
              console.error('[GET /api/v1/ml-models] Database error:', error.message);
              return Response.json({ success: false, error: 'Database Error' }, { status: 500 });
            }

            const total = count ?? 0;
            const totalPages = Math.ceil(total / limit);

            return Response.json({
              success: true,
              data: {
                models: models ?? [],
                pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
              },
            });
          } catch (err) {
            return Response.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
          }
        },
        { minRole: 'admin' }
      ),
    }
  }
});
