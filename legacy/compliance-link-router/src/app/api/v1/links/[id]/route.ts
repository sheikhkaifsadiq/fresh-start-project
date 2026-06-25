import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    if (!id) {
      return NextResponse.json({ success: false, message: 'Link ID is required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('links').delete().eq('id', id)

    if (error) {
      console.error('Error deleting link:', error)
      return NextResponse.json({ success: false, message: 'Failed to delete link' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/v1/links/[id]:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    if (!id) {
      return NextResponse.json({ success: false, message: 'Link ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const { active } = body

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('links')
      // @ts-ignore
      .update({ active })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating link:', error)
      return NextResponse.json({ success: false, message: 'Failed to update link' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in PUT /api/v1/links/[id]:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
