import { Link } from 'react-router-dom';
import type { City } from '../types';

interface CityCardProps {
  city: City;
}

export function CityCard({ city }: CityCardProps) {
  return (
    <Link
      to={`/city/${city.id}`}
      className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-xs font-medium text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">
              #{city.articleNumber.toString().padStart(3, '0')}
            </span>
          </div>
          <span className="text-2xl">{city.countryEmoji}</span>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-1">
          {city.name}
        </h3>
        <p className="text-gray-500 text-sm mb-3">
          {city.country}
        </p>

        <div className="border-t pt-3">
          <p className="text-gray-600 text-sm">
            <span className="font-medium">{city.chineseName}</span>
            <span className="text-gray-400 ml-2">({city.chineseJyutping})</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
