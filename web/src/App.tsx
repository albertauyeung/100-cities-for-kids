import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ArticlePage } from './pages/ArticlePage';
import citiesData from './data/cities.json';
import type { City } from './types';

const cities = citiesData as City[];

export const SITE_BASENAME = '/100-cities-for-kids';

function App() {
  return (
    <Layout cities={cities}>
      <Routes>
        <Route path="/" element={<HomePage cities={cities} />} />
        <Route path="/city/:cityId" element={<ArticlePage cities={cities} />} />
      </Routes>
    </Layout>
  );
}

export default App;
