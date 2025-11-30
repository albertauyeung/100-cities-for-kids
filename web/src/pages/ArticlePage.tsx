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
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">City Not Found</h1>
        <p className="text-gray-600 mb-6">
          We couldn't find the city you're looking for.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{city.countryEmoji}</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
              #{city.articleNumber.toString().padStart(3, '0')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {city.name}, {city.country}
          </h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm text-white/90">
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
      </div>

      {/* Content */}
      <article className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-gray-600 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {city.content}
          </ReactMarkdown>
        </div>
      </article>

      {/* Navigation */}
      <div className="flex gap-4">
        {prevCity ? (
          <Link
            to={`/city/${prevCity.id}`}
            className="flex-1 flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all group"
          >
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <div className="min-w-0">
              <div className="text-xs text-gray-500 mb-0.5">Previous</div>
              <div className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                {prevCity.name}
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {nextCity ? (
          <Link
            to={`/city/${nextCity.id}`}
            className="flex-1 flex items-center justify-end gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all group text-right"
          >
            <div className="min-w-0">
              <div className="text-xs text-gray-500 mb-0.5">Next</div>
              <div className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                {nextCity.name}
              </div>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}
