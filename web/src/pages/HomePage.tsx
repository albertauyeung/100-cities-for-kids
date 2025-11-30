import { Link } from 'react-router-dom';
import type { City } from '../types';

interface HomePageProps {
  cities: City[];
}

const continentConfig: Record<string, { name: string; emoji: string }> = {
  'africa': { name: 'Africa', emoji: '🌍' },
  'asia': { name: 'Asia', emoji: '🌏' },
  'australia': { name: 'Australia', emoji: '🦘' },
  'europe': { name: 'Europe', emoji: '🏰' },
  'north-america': { name: 'North America', emoji: '🗽' },
  'south-america': { name: 'South America', emoji: '🌎' },
};

export function HomePage({ cities }: HomePageProps) {
  // Get a random featured city
  const featuredCities = cities.slice(0, 6);

  // Count cities by continent
  const continentCounts = cities.reduce((acc, city) => {
    acc[city.continent] = (acc[city.continent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Explore {cities.length} Amazing Cities
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Travel around the world and learn about different cities, their cultures,
          famous people, and fun facts. Perfect for curious kids!
        </p>
      </div>

      {/* Continent Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.entries(continentConfig).map(([slug, config]) => (
          <div
            key={slug}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{config.emoji}</span>
              <span className="font-medium text-gray-900">{config.name}</span>
            </div>
            <p className="text-sm text-gray-500">
              {continentCounts[slug] || 0} cities
            </p>
          </div>
        ))}
      </div>

      {/* Featured Cities */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured Cities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featuredCities.map(city => (
            <Link
              key={city.id}
              to={`/city/${city.id}`}
              className="group bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{city.countryEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {city.name}
                    </h3>
                    <span className="text-xs text-gray-400">
                      #{city.articleNumber.toString().padStart(3, '0')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{city.country}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {city.chineseName} ({city.chineseJyutping})
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-center text-white">
        <h2 className="text-xl font-semibold mb-2">Ready to Explore?</h2>
        <p className="text-indigo-100 mb-4">
          Select a city from the menu to start your journey around the world!
        </p>
      </div>
    </div>
  );
}
