import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    name: 'Michael Jordan 1986 Fleer',
    value: '1250',
    recommendation: 'Grade',
  })
}

