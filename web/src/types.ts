export interface City {
  id: string;
  name: string;
  country: string;
  continent: string;
  chineseName: string;
  chineseJyutping: string;
  countryEmoji: string;
  countryChinese: string;
  countryJyutping: string;
  articleNumber: number;
  content: string;
}

export interface ContinentGroup {
  name: string;
  slug: string;
  cities: City[];
}
