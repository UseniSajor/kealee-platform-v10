import { NextRequest, NextResponse } from 'next/server'

const API = () => (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')

async function proxy(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/')
  const url = `${API()}/v30/${path}${req.nextUrl.search}`

  const headers = new Headers()
  const contentType = req.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: 'no-store',
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text()
  }

  const upstream = await fetch(url, init)
  const text = await upstream.text()
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  })
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxy(req, path)
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxy(req, path)
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxy(req, path)
}
