import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'AruStore Spatial Commerce API',
    version: '2.0.0',
  })
}
