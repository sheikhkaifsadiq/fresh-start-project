import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ available: false }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('links')
      .select('id')
      .eq('slug', slug)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is the "not found" error which means it IS available
      console.error('Error checking slug:', error)
      return NextResponse.json({ available: false }, { status: 500 })
    }

    return NextResponse.json({ available: !data })
  } catch (error) {
    console.error('Error in GET /api/v1/links/check-slug:', error)
    return NextResponse.json({ available: false }, { status: 500 })
  }
}
