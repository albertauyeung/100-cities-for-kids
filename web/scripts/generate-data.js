#!/usr/bin/env node
/**
 * Generate cities data from markdown content files
 * Run with: node scripts/generate-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../../content');
const OUTPUT_FILE = path.join(__dirname, '../src/data/cities.json');

const CONTINENTS = ['africa', 'asia', 'australia', 'europe', 'north-america', 'south-america'];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const frontmatterStr = match[1];
  const body = match[2];

  const frontmatter = {};
  frontmatterStr.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  });

  return { frontmatter, content: body };
}

function parseCityInfo(content) {
  // Parse city info from the header
  // Format:
  // # City, Country
  //
  // - City: 中文 (jyutping)
  // - Country: 🇯🇵 中文 (jyutping)

  const lines = content.split('\n');
  const info = {
    chineseName: '',
    chineseJyutping: '',
    countryEmoji: '',
    countryChinese: '',
    countryJyutping: '',
  };

  for (const line of lines) {
    // Parse city Chinese name
    const cityMatch = line.match(/^- City:\s*(.+?)\s*\(([^)]+)\)/);
    if (cityMatch) {
      info.chineseName = cityMatch[1].trim();
      info.chineseJyutping = cityMatch[2].trim();
    }

    // Parse country info
    const countryMatch = line.match(/^- Country:\s*(.+?)\s+(.+?)\s*\(([^)]+)\)/);
    if (countryMatch) {
      info.countryEmoji = countryMatch[1].trim();
      info.countryChinese = countryMatch[2].trim();
      info.countryJyutping = countryMatch[3].trim();
    }
  }

  return info;
}

function getArticleContent(content) {
  // Remove the header section (everything before the first ## heading)
  const match = content.match(/\n(##[\s\S]*)/);
  return match ? match[1].trim() : content;
}

function processMarkdownFile(filePath, continent) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, content: body } = parseFrontmatter(content);

  // Extract article number from filename (e.g., "001-dublin.md" -> 1)
  const filename = path.basename(filePath);
  const numberMatch = filename.match(/^(\d+)-(.+)\.md$/);
  if (!numberMatch) return null;

  const articleNumber = parseInt(numberMatch[1], 10);
  const citySlug = numberMatch[2];

  // Parse title to get city and country
  const titleMatch = frontmatter.title?.match(/^\d+\.\s*(.+)$/);
  const cityName = titleMatch ? titleMatch[1] : citySlug.replace(/-/g, ' ');

  // Extract country from the header
  const headerMatch = body.match(/^#\s*([^,]+),\s*(.+)/m);
  const country = headerMatch ? headerMatch[2].trim() : '';

  // Parse city info
  const cityInfo = parseCityInfo(body);

  // Get article content (without header)
  const articleContent = getArticleContent(body);

  return {
    id: citySlug,
    name: cityName,
    country,
    continent,
    articleNumber,
    ...cityInfo,
    content: articleContent,
  };
}

function main() {
  const cities = [];

  for (const continent of CONTINENTS) {
    const continentDir = path.join(CONTENT_DIR, continent);

    if (!fs.existsSync(continentDir)) {
      console.log(`Skipping ${continent} - directory not found`);
      continue;
    }

    const files = fs.readdirSync(continentDir).filter(
      (f) => f.endsWith('.md') && !f.startsWith('_')
    );

    for (const file of files) {
      const filePath = path.join(continentDir, file);
      const city = processMarkdownFile(filePath, continent);

      if (city) {
        cities.push(city);
        console.log(`✓ Processed: ${city.name} (${continent})`);
      }
    }
  }

  // Sort by article number
  cities.sort((a, b) => a.articleNumber - b.articleNumber);

  // Write output
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cities, null, 2));
  console.log(`\n✅ Generated ${cities.length} cities to ${OUTPUT_FILE}`);
}

main();
