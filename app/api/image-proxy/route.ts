import { NextRequest, NextResponse } from 'next/server'

/**
 * Image Proxy API Route
 * 
 * Fixes Cross-Origin-Resource-Policy (CORP) issues with Supabase Storage
 * by proxying images through Next.js with correct CORS headers
 * 
 * Usage: /api/image-proxy?url=https://...supabase.co/storage/...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')

  // Validate URL parameter
  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    )
  }

  // Security: Only allow Supabase Storage URLs
  if (!imageUrl.includes('supabase.co/storage')) {
    return NextResponse.json(
      { error: 'Invalid URL - only Supabase Storage URLs are allowed' },
      { status: 400 }
    )
  }

  try {
    // Fetch the image from Supabase Storage
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Next.js Image Proxy',
      },
    })

    if (!response.ok) {
      console.error(`[Image Proxy] Failed to fetch: ${imageUrl} - ${response.status}`)
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      )
    }

    // Get the image blob
    const blob = await response.blob()
    const contentType = response.headers.get('Content-Type') || 'image/jpeg'

    // Return image with proper CORS and CORP headers
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('[Image Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error while fetching image' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
