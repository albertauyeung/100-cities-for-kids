import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { City } from '../types';

interface ArticlePageProps {
  cities: City[];
}

export function ArticlePage({ cities }: ArticlePageProps) {
  const { cityId } = useParams<{ cityId: string }>();
  const city = cities.find((c) => c.id === cityId);

  if (!city) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          😕 City Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          We couldn't find the city you're looking for.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  // Find previous and next cities
  const sortedCities = [...cities].sort(
    (a, b) => a.articleNumber - b.articleNumber
  );
  const currentIndex = sortedCities.findIndex((c) => c.id === city.id);
  const prevCity = currentIndex > 0 ? sortedCities[currentIndex - 1] : null;
  const nextCity =
    currentIndex < sortedCities.length - 1
      ? sortedCities[currentIndex + 1]
      : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          to="/"
          className="text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          ← Back to all cities
        </Link>
      </nav>

      {/* Article Card */}
      <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              #{city.articleNumber.toString().padStart(3, '0')}
            </span>
            <span className="text-3xl">{city.countryEmoji}</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            {city.name}, {city.country}
          </h1>
          <div className="flex flex-wrap gap-4 text-white/90 mt-4">
            <div>
              <span className="text-white/60">City: </span>
              <span className="font-medium">{city.chineseName}</span>
              <span className="text-white/60 ml-1">({city.chineseJyutping})</span>
            </div>
            <div>
              <span className="text-white/60">Country: </span>
              <span className="font-medium">{city.countryChinese}</span>
              <span className="text-white/60 ml-1">({city.countryJyutping})</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="prose prose-lg max-w-none prose-headings:text-indigo-700 prose-a:text-indigo-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {city.content}
            </ReactMarkdown>
          </div>
        </div>
      </article>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {prevCity ? (
          <Link
            to={`/city/${prevCity.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <span>←</span>
            <div className="text-left">
              <div className="text-xs text-gray-500">Previous</div>
              <div className="font-medium text-gray-800">{prevCity.name}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextCity ? (
          <Link
            to={`/city/${nextCity.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="text-right">
              <div className="text-xs text-gray-500">Next</div>
              <div className="font-medium text-gray-800">{nextCity.name}</div>
            </div>
            <span>→</span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
