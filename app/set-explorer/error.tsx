'use client'

export default function Error({ error }: { error: Error }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-red-500">Error</h2>
      <p>{error.message}</p>
    </div>
  )
}

