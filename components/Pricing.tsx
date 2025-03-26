'use client'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

const plans = [
  {
    id: 'price_free_plan',
    name: 'Free',
    price: '$0',
    features: ['15 scans/month', 'Basic valuation'],
  },
  {
    id: 'price_pro_plan',
    name: 'Pro',
    price: '$9.99/mo',
    features: ['150 scans', 'Advanced insights'],
  },
  {
    id: 'price_elite_plan',
    name: 'Elite',
    price: '$29.99/mo',
    features: ['Unlimited scans', 'Predictive trends'],
  },
]

export default function Pricing() {
  const handleCheckout = async (priceId: string) => {
    const stripe = await stripePromise
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div className="p-6 grid md:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <div key={plan.id} className="rounded shadow-md p-6 bg-white">
          <h3 className="text-xl font-bold">{plan.name}</h3>
          <p className="my-2">{plan.price}</p>
          <ul className="my-2">
            {plan.features.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <button
            className="mt-2 bg-green-500 text-white px-4 py-1 rounded"
            onClick={() => handleCheckout(plan.id)}
          >
            Subscribe
          </button>
        </div>
      ))}
    </div>
  )
}

