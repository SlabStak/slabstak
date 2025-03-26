'use client'
import { useState } from 'react'

export default function SetExplorer() {
  const [filter, setFilter] = useState({ year: '', sport: '', brand: '' })

  const sets = [
    { year: 2024, sport: 'Basketball', brand: 'Topps', name: 'Topps Chrome NBA' },
    { year: 2023, sport: 'Baseball', brand: 'Panini', name: 'Panini Donruss MLB' },
    { year: 2023, sport: 'Football', brand: 'Topps', name: 'Topps Finest NFL' },
  ]

  const filteredSets = sets.filter((set) => {
    return (
      (!filter.year || set.year.toString() === filter.year) &&
      (!filter.sport || set.sport === filter.sport) &&
      (!filter.brand || set.brand === filter.brand)
    )
  })

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">🔍 Set Explorer</h2>

      <div className="mb-4 flex gap-2">
        <select
          className="border rounded p-2"
          onChange={(e) => setFilter({ ...filter, year: e.target.value })}
        >
          <option value="">Year</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>

        <select
          className="border rounded p-2"
          onChange={(e) => setFilter({ ...filter, sport: e.target.value })}
        >
          <option value="">Sport</option>
          <option>Basketball</option>
          <option>Baseball</option>
          <option>Football</option>
        </select>

        <select
          className="border rounded p-2"
          onChange={(e) => setFilter({ ...filter, brand: e.target.value })}
        >
          <option value="">Brand</option>
          <option>Topps</option>
          <option>Panini</option>
        </select>
      </div>

      <ul className="grid gap-2">
        {filteredSets.map((set) => (
          <li key={set.name} className="bg-gray-100 p-4 rounded shadow">
            <strong>{set.name}</strong> ({set.year}) - {set.sport} - {set.brand}
          </li>
        ))}
      </ul>
    </div>
  )
}

