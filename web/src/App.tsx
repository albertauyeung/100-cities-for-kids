import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { ArticlePage } from './pages/ArticlePage';
import citiesData from './data/cities.json';
import type { City } from './types';

const cities = citiesData as City[];

function App() {
  return (
    <BrowserRouter basename="/100-cities-for-kids">
      <div className="min-h-screen">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage cities={cities} />} />
            <Route path="/city/:cityId" element={<ArticlePage cities={cities} />} />
          </Routes>
        </main>
        <footer className="text-center py-8 text-gray-500 text-sm">
          <p>Made with ❤️ for curious kids everywhere</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
