'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface Card {
  name: string
  img: string
  change: string
  tag: string
}

export default function TrendingCards() {
  const [cards, setCards] = useState<Card[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/trending-cards')
        setCards(response.data)
      } catch (error) {
        console.error('Failed to fetch trending cards:', error)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">📈 Trending Cards</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.name} className="bg-white rounded shadow p-4">
            <img
              src={card.img}
              alt={card.name}
              className="w-full h-48 object-cover mb-2 rounded"
            />
            <h3 className="font-semibold text-lg">{card.name}</h3>
            <p className="text-sm">{card.change}</p>
            <span className="inline-block mt-2 bg-gray-200 px-2 rounded">{card.tag}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

