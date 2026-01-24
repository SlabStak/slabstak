export interface ScanResult {
  player: string;
  set_name: string;
  year: number | null;
  grade_estimate: string | null;
  estimated_low: number;
  estimated_high: number;
  recommendation: string;
  raw_ocr: string;
}

export interface CardRecord {
  id: string;
  user_id: string;
  image_url: string | null;
  player: string;
  team: string | null;
  sport: string | null;
  set_name: string;
  year: number | null;
  grade_estimate: string | null;
  estimated_low: number;
  estimated_high: number;
  recommendation: string;
  notes: string | null;
  purchase_price: number | null;
  sold_price: number | null;
  created_at: string;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end?: boolean;
}

export interface DealerShow {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface DealerShowCard {
  id: string;
  show_id: string;
  user_id: string;
  card_id: string | null;
  acquisition_type: "inventory" | "bought_at_show" | string;
  buy_price: number | null;
  asking_price: number | null;
  sale_price: number | null;
  sale_date: string | null;
  status: "holding" | "sold" | "traded" | string;
  notes: string | null;
  created_at: string;
}
