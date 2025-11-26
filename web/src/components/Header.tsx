import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <span className="text-4xl">🌍</span>
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">
              100 Cities for Kids
            </h1>
            <p className="text-sm text-gray-500">
              Explore the world one city at a time!
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
