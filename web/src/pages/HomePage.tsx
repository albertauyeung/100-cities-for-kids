import { useMemo } from 'react';
import { ContinentSection } from '../components/ContinentSection';
import type { City, ContinentGroup } from '../types';

interface HomePageProps {
  cities: City[];
}

const continentOrder = [
  'africa',
  'asia',
  'australia',
  'europe',
  'north-america',
  'south-america',
];

export function HomePage({ cities }: HomePageProps) {
  const continents = useMemo(() => {
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

    // Create ordered continent groups
    const orderedGroups: ContinentGroup[] = continentOrder
      .filter((slug) => groups[slug])
      .map((slug) => ({
        name: slug,
        slug,
        cities: groups[slug],
      }));

    return orderedGroups;
  }, [cities]);

  const totalCities = cities.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12 bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          🌍 Explore {totalCities} Amazing Cities! 🌏
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Travel around the world and learn about different cities, their
          cultures, famous people, and fun facts. Perfect for curious kids
          who want to explore our amazing planet!
        </p>

        {/* Quick Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {continents.map((continent) => (
            <a
              key={continent.slug}
              href={`#${continent.slug}`}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors text-sm font-medium"
            >
              {continent.slug.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </a>
          ))}
        </div>
      </div>

      {/* Continent Sections */}
      {continents.map((continent) => (
        <ContinentSection key={continent.slug} continent={continent} />
      ))}
    </div>
  );
}
