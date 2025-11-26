import type { ContinentGroup } from '../types';
import { CityCard } from './CityCard';

interface ContinentSectionProps {
  continent: ContinentGroup;
}

const continentEmojis: Record<string, string> = {
  africa: '🌍',
  asia: '🌏',
  australia: '🦘',
  europe: '🏰',
  'north-america': '🗽',
  'south-america': '🌴',
};

const continentNames: Record<string, string> = {
  africa: 'Africa',
  asia: 'Asia',
  australia: 'Australia & Oceania',
  europe: 'Europe',
  'north-america': 'North America',
  'south-america': 'South America',
};

export function ContinentSection({ continent }: ContinentSectionProps) {
  const emoji = continentEmojis[continent.slug] || '🌍';
  const displayName = continentNames[continent.slug] || continent.name;

  return (
    <section className="mb-12" id={continent.slug}>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{emoji}</span>
        <h2 className="text-2xl font-bold text-gray-800">
          {displayName}
        </h2>
        <span className="text-sm text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {continent.cities.length} {continent.cities.length === 1 ? 'city' : 'cities'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {continent.cities.map((city) => (
          <CityCard key={city.id} city={city} />
        ))}
      </div>
    </section>
  );
}
