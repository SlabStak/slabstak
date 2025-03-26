import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    { 
      name: 'LeBron James Rookie', 
      img: '/lebron.jpg', 
      change: '+25%', 
      tag: '🔥 HOT' 
    },
    { 
      name: 'Tom Brady 2000 Bowman', 
      img: '/brady.jpg', 
      change: '-8%', 
      tag: '🧊 COOLDOWN' 
    },
    { 
      name: 'Shohei Ohtani Bowman Chrome', 
      img: '/ohtani.jpg', 
      change: '+15%', 
      tag: '🔥 HOT' 
    }
  ])
}

