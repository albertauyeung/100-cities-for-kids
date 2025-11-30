import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { City } from '../types';

interface SidebarProps {
  cities: City[];
  onClose: () => void;
}

const continentConfig: Record<string, { name: string; emoji: string }> = {
  'africa': { name: 'Africa', emoji: '🌍' },
  'asia': { name: 'Asia', emoji: '🌏' },
  'australia': { name: 'Australia', emoji: '🦘' },
  'europe': { name: 'Europe', emoji: '🏰' },
  'north-america': { name: 'North America', emoji: '🗽' },
  'south-america': { name: 'South America', emoji: '🌎' },
};

const continentOrder = ['africa', 'asia', 'australia', 'europe', 'north-america', 'south-america'];

export function Sidebar({ cities, onClose }: SidebarProps) {
  const { cityId } = useParams<{ cityId: string }>();
  const [expandedContinents, setExpandedContinents] = useState<Set<string>>(() => {
    // Expand the continent of the currently selected city
    const selectedCity = cities.find(c => c.id === cityId);
    if (selectedCity) {
      return new Set([selectedCity.continent]);
    }
    return new Set(['europe']); // Default expanded
  });

  const continentGroups = useMemo(() => {
    const groups: Record<string, City[]> = {};

    cities.forEach((city) => {
      if (!groups[city.continent]) {
        groups[city.continent] = [];
      }
      groups[city.continent].push(city);
    });

    // Sort cities by article number within each continent
    Object.values(groups).forEach((cityList) => {
      cityList.sort((a, b) => a.articleNumber - b.articleNumber);
    });

    return continentOrder
      .filter(slug => groups[slug])
      .map(slug => ({
        slug,
        ...continentConfig[slug],
        cities: groups[slug],
      }));
  }, [cities]);

  const toggleContinent = (slug: string) => {
    setExpandedContinents(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <Link to="/" className="flex items-center gap-2" onClick={onClose}>
          <span className="text-2xl">🌍</span>
          <span className="font-bold text-gray-900">100 Cities</span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* City count */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm text-gray-600">{cities.length} cities to explore</span>
      </div>

      {/* Scrollable city list */}
      <nav className="flex-1 overflow-y-auto">
        {continentGroups.map(continent => (
          <div key={continent.slug} className="border-b border-gray-100">
            <button
              onClick={() => toggleContinent(continent.slug)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>{continent.emoji}</span>
                <span className="font-medium text-gray-900">{continent.name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {continent.cities.length}
                </span>
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedContinents.has(continent.slug) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedContinents.has(continent.slug) && (
              <div className="pb-2">
                {continent.cities.map(city => (
                  <Link
                    key={city.id}
                    to={`/city/${city.id}`}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-colors
                      ${cityId === city.id
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="text-base">{city.countryEmoji}</span>
                    <span className="truncate">{city.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">Made with love for curious kids</p>
      </div>
    </div>
  );
}
