'use client'

export default function UpgradeModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded p-4 shadow-lg max-w-sm w-full">
        <h4 className="font-bold text-lg">🚨 Approaching Your Limit!</h4>
        <p className="my-2">You're nearing your monthly scan or vault limit. Upgrade now for more!</p>
        <button className="px-4 py-1 bg-blue-500 text-white rounded mr-2">Upgrade Now</button>
        <button className="px-4 py-1 bg-gray-300 rounded" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

