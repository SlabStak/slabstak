"use client";

interface CardFiltersProps {
  filters: {
    q: string;
    sport: string;
    year: string;
    manufacturer: string;
  };
  onFiltersChange: (filters: any) => void;
}

const SPORTS = ["basketball", "baseball", "football", "hockey", "soccer"];
const MANUFACTURERS = ["Topps", "Panini", "Leaf", "Fleer", "Upper Deck", "Bowman", "Donruss"];
const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

export default function CardFilters({ filters, onFiltersChange }: CardFiltersProps) {
  const handleChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Sport Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
        <select
          value={filters.sport}
          onChange={(e) => handleChange("sport", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Sports</option>
          {SPORTS.map((sport) => (
            <option key={sport} value={sport}>
              {sport.charAt(0).toUpperCase() + sport.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Year Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
        <select
          value={filters.year}
          onChange={(e) => handleChange("year", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Any Year</option>
          {YEARS.map((year) => (
            <option key={year} value={year.toString()}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Manufacturer Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
        <select
          value={filters.manufacturer}
          onChange={(e) => handleChange("manufacturer", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Manufacturers</option>
          {MANUFACTURERS.map((mfg) => (
            <option key={mfg} value={mfg}>
              {mfg}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      <div className="flex items-end">
        <button
          onClick={() =>
            onFiltersChange({
              q: filters.q,
              sport: "",
              year: "",
              manufacturer: "",
            })
          }
          className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
