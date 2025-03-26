'use client'
import { useState, useEffect } from 'react'
import TrendingCards from '@/components/TrendingCards'
import UpgradeModal from '@/components/UpgradeModal'

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false)

  // Simulated usage (for now, we'll fake hitting 80% limit)
  const scansUsed = 120
  const scansAllowed = 150
  const usagePercent = (scansUsed / scansAllowed) * 100

  useEffect(() => {
    if (usagePercent >= 80) setShowModal(true)
  }, [usagePercent])

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">My SlabStak Dashboard</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div className="bg-gray-100 p-4 rounded shadow">
          <p>Scans Used: <strong>{scansUsed} / {scansAllowed}</strong></p>
        </div>
        <div className="bg-gray-100 p-4 rounded shadow">
          <p>Vault Space: <strong>120 / 500</strong></p>
        </div>
        <div className="bg-gray-100 p-4 rounded shadow col-span-2">
          <p>Total Collection Value: <strong>$4,750.00</strong></p>
        </div>
      </div>

      <h3 className="text-lg font-bold mt-6">Your Cards</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
        {[1,2,3,4].map(id => (
          <div key={id} className="bg-white rounded shadow p-2">
            <img src={`/cards/card${id}.jpg`} alt="Card" className="rounded"/>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-100 rounded">
        <h4 className="font-bold">Current Plan: Pro</h4>
        <button className="mt-2 px-4 py-1 bg-blue-500 text-white rounded">Upgrade Plan</button>
      </div>

      <TrendingCards />

      <UpgradeModal show={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}

