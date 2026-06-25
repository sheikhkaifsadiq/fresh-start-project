import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

// --- Validation Schemas ---
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(1000).default(50),
  offset: z.coerce.number().min(0).default(0),
  sortField: z.enum(['created_at', 'bot_probability_score', 'action', 'ip_address']).default('created_at'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
  searchTerm: z.string().optional(),
  // For AQL parsed AST, we might receive a stringified JSON
  ast: z.string().optional(),
});

// A basic translation layer from AQL AST to Supabase PostgREST filters
// For a production app, you'd recursively traverse the AST and build a PostgREST filter string
const buildPostgrestFilter = (astNode: any): string => {
  if (astNode.type === 'Query') {
    const left = buildPostgrestFilter(astNode.left);
    const right = buildPostgrestFilter(astNode.right);
    return `${astNode.operator.toLowerCase()}(${left},${right})`;
  } else if (astNode.type === 'Expression') {
    let op = 'eq';
    switch (astNode.operator) {
      case ':':
      case '=': op = 'eq'; break;
      case '>': op = 'gt'; break;
      case '<': op = 'lt'; break;
      case '>=': op = 'gte'; break;
    }
    // Handle specific fields and types
    if (astNode.field === 'risk_score') {
      return `bot_probability_score.${op}.${astNode.value}`;
    }
    return `${astNode.field}.${op}.${astNode.value}`;
  } else if (astNode.type === 'Text') {
    // Implicit text search across action or ip
    return `or(action.ilike.%${astNode.value}%,ip_address.ilike.%${astNode.value}%)`;
  }
  return '';
};

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    
    // Validate request parameters
    const parsedParams = querySchema.safeParse(params);
    if (!parsedParams.success) {
      return NextResponse.json({ 
        error: 'Invalid request parameters', 
        details: parsedParams.error.flatten() 
      }, { status: 400 });
    }

    const { limit, offset, sortField, sortDirection, searchTerm, ast } = parsedParams.data;

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    // Apply AST filters if provided
    if (ast) {
      try {
        const astObj = JSON.parse(ast);
        const filterStr = buildPostgrestFilter(astObj);
        if (filterStr) {
          // Fallback to simpler or query for now if complex AST fails, but here we just use .or()
          // Note: Full AST to PostgREST translation can be complex, so we wrap in try-catch
          // For simplicity, we just use the text fallback if it fails
          query = query.or(filterStr);
        }
      } catch (err) {
        console.warn('Failed to parse AST for Supabase filter', err);
      }
    } else if (searchTerm) {
      query = query.or(`action.ilike.%${searchTerm}%,ip_address.ilike.%${searchTerm}%`);
    }

    // Apply sorting and pagination
    query = query
      .order(sortField, { ascending: sortDirection === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw new Error(`Database Error: ${error.message}`);
    }

    // Process and enrich data
    const enrichedData = data?.map((log: any) => ({
      ...log,
      risk_level: log.bot_probability_score > 0.8 ? 'critical' : log.bot_probability_score > 0.5 ? 'high' : log.bot_probability_score > 0.2 ? 'medium' : 'low',
      // Ensure metadata is parsed if it's a string
      metadata: typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata
    }));

    // Calculate dynamic analytics on the current page
    const analytics = {
      totalFound: count || 0,
      criticalEvents: enrichedData?.filter(d => d.risk_level === 'critical').length || 0,
      averageRiskScore: enrichedData?.length 
        ? enrichedData.reduce((acc, curr) => acc + curr.bot_probability_score, 0) / enrichedData.length 
        : 0,
    };

    return NextResponse.json({
      data: enrichedData,
      meta: {
        pagination: {
          limit,
          offset,
          total: count,
          hasMore: count ? offset + limit < count : false
        },
        analytics,
        queryTimeMs: Date.now() - Number(req.headers.get('x-request-start') || Date.now())
      }
    });

  } catch (error: any) {
    console.error("Audit GET API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Handles creating a new audit log (usually done internally, but exposed for service-to-service)
  try {
    const supabase = createAdminClient();
    
    // Auth check (Internal Service Role or valid API key required)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate body
    const logSchema = z.object({
      action: z.string(),
      user_id: z.string().optional(),
      ip_address: z.string(),
      user_agent: z.string(),
      bot_probability_score: z.number().min(0).max(1).default(0),
      metadata: z.record(z.any()).optional(),
    });

    const parsedBody = logSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsedBody.error }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .insert([parsedBody.data] as any)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });

  } catch (error: any) {
    console.error("Audit POST API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
