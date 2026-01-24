"use client";

import Link from "next/link";
import Image from "next/image";

interface Seller {
  id: string;
  email: string;
  user_profiles: {
    display_name: string;
  };
}

interface Listing {
  id: string;
  player_name: string;
  set_name: string;
  price: number;
  image_url?: string;
  condition: string;
  grade?: string;
  sport: string;
  seller_id: string;
  seller?: Seller;
  status: string;
  created_at: string;
}

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const sellerName = listing.seller?.user_profiles?.display_name || "Unknown Seller";
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(listing.price);

  return (
    <Link href={`/marketplace/listings/${listing.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden cursor-pointer h-full flex flex-col">
        {/* Listing Image */}
        <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
          {listing.image_url ? (
            <Image
              src={listing.image_url}
              alt={`${listing.player_name} - ${listing.set_name}`}
              width={200}
              height={300}
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          ) : (
            <div className="text-gray-400 text-sm text-center px-4">
              <p>No Image</p>
              <p className="text-xs mt-1">{listing.condition}</p>
            </div>
          )}

          {/* Grade Badge */}
          {listing.grade && (
            <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
              {listing.grade}
            </div>
          )}

          {/* Condition Badge */}
          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
            {listing.condition}
          </div>
        </div>

        {/* Listing Info */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">
            {listing.player_name}
          </h3>

          <p className="text-gray-600 text-xs mb-3 line-clamp-2">{listing.set_name}</p>

          {/* Price */}
          <div className="mb-3">
            <p className="text-lg font-bold text-green-600">{formattedPrice}</p>
          </div>

          {/* Seller Info */}
          <div className="text-xs text-gray-500 mb-3">
            <p className="font-medium">Seller: {sellerName}</p>
          </div>

          {/* Condition & Sport */}
          <div className="flex gap-2 text-xs text-gray-600 mb-3">
            <span className="bg-gray-100 px-2 py-1 rounded">
              {listing.sport.charAt(0).toUpperCase() + listing.sport.slice(1)}
            </span>
          </div>

          {/* View Details Button */}
          <button className="mt-auto w-full py-2 bg-blue-50 text-blue-600 rounded font-medium text-sm hover:bg-blue-100 transition-colors">
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
}
