#!/usr/bin/env python3
"""
City Article Generator for Kids

This script generates educational articles about cities for children
using the Claude API. It automatically:
- Detects which continent the city belongs to
- Calculates the next article number
- Saves to the correct content folder
- Optionally builds the Hugo site

Usage:
    python generate-city-article.py "Tokyo"
    python generate-city-article.py "Paris" --build
    python generate-city-article.py "Cairo" --dry-run
"""

import os
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import typer
from anthropic import Anthropic
from dotenv import load_dotenv
from ToJyutping import ToJyutping

# Project paths (relative to scripts directory)
PROJECT_ROOT = Path(__file__).parent.parent

# Load environment variables from .env file in project root
ENV_FILE = PROJECT_ROOT / ".env"
load_dotenv(ENV_FILE)


def get_api_key() -> str:
    """Get the Anthropic API key from environment variables."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        typer.echo(
            "❌ ANTHROPIC_API_KEY not found!\n"
            f"   Please add it to: {ENV_FILE}\n"
            "   Example: ANTHROPIC_API_KEY=sk-ant-...",
            err=True,
        )
        raise typer.Exit(1)
    return api_key

# ============================================================================
# Configuration
# ============================================================================

CLAUDE_MODEL = "claude-sonnet-4-20250514"
MAX_TOKENS = 4096

# Content directory
CONTENT_DIR = PROJECT_ROOT / "content"

# Valid continents and their folder names
CONTINENTS = {
    "africa": "africa",
    "asia": "asia",
    "australia": "australia",
    "oceania": "australia",  # Oceania maps to australia folder
    "europe": "europe",
    "north america": "north-america",
    "south america": "south-america",
}

# ============================================================================
# Prompt Templates
# ============================================================================

ARTICLE_PROMPT_TEMPLATE = """You are writing an educational article about {city}, {country} for children aged 6-12.

Write an engaging, fun, and informative article that includes the following sections:

1. **Introduction** - A brief, exciting introduction to the city
2. **Where Is {city}?** - Location details, nearby landmarks, coordinates if interesting
3. **How Many People Live There?** - Population facts in a kid-friendly way
4. **Special Places to See** - One or two famous landmarks or attractions
5. **Language and Food** - What language people speak, famous local foods
6. **A Famous Musician from {city}** - A notable musician born there with fun facts
7. **A Scientist from {city}** - A notable scientist with their achievements explained simply
8. **Fun Fact About {city}** - An interesting, surprising fact kids would love

Guidelines:
- Use simple, clear language suitable for children
- Add relevant emojis throughout to make it visually engaging
- Each section should have an emoji in the heading
- Keep paragraphs short (2-4 sentences)
- Include specific numbers and dates when mentioning facts
- Make it educational but fun!
- Use markdown formatting with ## for section headings
- Start with a # heading: "# {city}, {country}"

Write the article now:"""

CITY_INFO_PROMPT_TEMPLATE = """For the city "{city}", provide the following information in exactly this format:

country: [country name in English]
continent: [one of: Africa, Asia, Australia, Europe, North America, South America]

Output ONLY these two lines, nothing else."""

TRANSLATE_PROMPT_TEMPLATE = """Translate "{text}" into Traditional Chinese.
Output ONLY the translation, nothing else."""

FLAG_EMOJI_PROMPT_TEMPLATE = """What is the flag emoji for {country}?
Output ONLY the emoji, nothing else."""


# ============================================================================
# Data Classes
# ============================================================================


@dataclass
class CityInfo:
    """Holds information about a city in multiple languages."""

    name: str
    country: str
    continent: str
    name_chinese: str = ""
    country_chinese: str = ""
    country_emoji: str = ""
    name_jyutping: str = ""
    country_jyutping: str = ""


# ============================================================================
# Claude API Client
# ============================================================================


class ClaudeClient:
    """Wrapper for Claude API interactions."""

    def __init__(self, model: str = CLAUDE_MODEL, max_tokens: int = MAX_TOKENS):
        api_key = get_api_key()
        self.client = Anthropic(api_key=api_key)
        self.model = model
        self.max_tokens = max_tokens

    def complete(self, prompt: str) -> str:
        """Send a prompt to Claude and return the response text."""
        message = self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text

    def generate_article(self, city: str, country: str) -> str:
        """Generate a city article for kids."""
        prompt = ARTICLE_PROMPT_TEMPLATE.format(city=city, country=country)
        return self.complete(prompt)

    def get_city_info(self, city: str) -> tuple[str, str]:
        """Get country and continent for a city."""
        prompt = CITY_INFO_PROMPT_TEMPLATE.format(city=city)
        response = self.complete(prompt).strip()

        # Parse response
        country = ""
        continent = ""
        for line in response.split("\n"):
            if line.lower().startswith("country:"):
                country = line.split(":", 1)[1].strip()
            elif line.lower().startswith("continent:"):
                continent = line.split(":", 1)[1].strip().lower()

        return country, continent

    def translate_to_chinese(self, text: str) -> str:
        """Translate text to Traditional Chinese."""
        prompt = TRANSLATE_PROMPT_TEMPLATE.format(text=text)
        return self.complete(prompt).strip()

    def get_flag_emoji(self, country: str) -> str:
        """Get the flag emoji for a country."""
        prompt = FLAG_EMOJI_PROMPT_TEMPLATE.format(country=country)
        return self.complete(prompt).strip()


# ============================================================================
# Jyutping (Cantonese Romanization) Functions
# ============================================================================


def get_jyutping(chinese_text: str) -> str:
    """Convert Chinese text to Jyutping (Cantonese romanization)."""
    jyutping_list = ToJyutping.get_jyutping_list(chinese_text)
    return " ".join(j for _, j in jyutping_list if j)


# ============================================================================
# Article Number Management
# ============================================================================


def get_next_article_number() -> int:
    """Find the next available article number by scanning all content folders."""
    max_number = 0

    for continent_dir in CONTENT_DIR.iterdir():
        if not continent_dir.is_dir():
            continue

        for article_file in continent_dir.glob("*.md"):
            if article_file.name.startswith("_"):
                continue

            # Extract number from filename like "001-dublin.md"
            match = re.match(r"(\d+)-", article_file.name)
            if match:
                number = int(match.group(1))
                max_number = max(max_number, number)

    return max_number + 1


def get_continent_folder(continent: str) -> Optional[Path]:
    """Get the content folder path for a continent."""
    continent_key = continent.lower()
    if continent_key in CONTINENTS:
        folder_name = CONTINENTS[continent_key]
        return CONTENT_DIR / folder_name
    return None


# ============================================================================
# Article Processing Functions
# ============================================================================


def build_city_info(claude: ClaudeClient, city: str) -> CityInfo:
    """Build complete city information with translations and romanizations."""
    # Get country and continent
    country, continent = claude.get_city_info(city)

    info = CityInfo(name=city, country=country, continent=continent)

    # Get Chinese translations
    info.name_chinese = claude.translate_to_chinese(city)
    info.country_chinese = claude.translate_to_chinese(country)

    # Get country flag emoji
    info.country_emoji = claude.get_flag_emoji(country)

    # Get Jyutping romanizations
    info.name_jyutping = get_jyutping(info.name_chinese)
    info.country_jyutping = get_jyutping(info.country_chinese)

    return info


def create_article_header(city_info: CityInfo) -> str:
    """Create the article header with city and country info."""
    lines = [
        f"# {city_info.name}, {city_info.country}",
        "",
        f"- City: {city_info.name_chinese} ({city_info.name_jyutping})",
        f"- Country: {city_info.country_emoji} {city_info.country_chinese} ({city_info.country_jyutping})",
    ]
    return "\n".join(lines)


def create_frontmatter(article_number: int, city: str) -> str:
    """Create Hugo frontmatter for the article."""
    return f"""---
title: {article_number:03d}. {city}
weight: {article_number}
---

"""


def process_article_content(article: str, city_info: CityInfo) -> str:
    """Process the generated article content."""
    # Replace the title line with our formatted header
    header = create_article_header(city_info)
    processed = re.sub(r"^#\s+.+", header, article, count=1)
    return processed


def format_filename(article_number: int, city: str) -> str:
    """Format the filename for the article."""
    city_slug = city.lower().replace(" ", "-")
    return f"{article_number:03d}-{city_slug}.md"


# ============================================================================
# File Operations
# ============================================================================


def save_article(
    content: str, output_dir: Path, article_number: int, city: str
) -> Path:
    """Save the article to a file."""
    output_dir.mkdir(parents=True, exist_ok=True)
    filename = format_filename(article_number, city)
    output_path = output_dir / filename
    output_path.write_text(content, encoding="utf-8")
    return output_path


# ============================================================================
# Hugo Build
# ============================================================================


def build_hugo_site() -> bool:
    """Build the Hugo site. Returns True if successful."""
    try:
        result = subprocess.run(
            ["hugo"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        return True
    except subprocess.CalledProcessError as e:
        typer.echo(f"Hugo build failed: {e.stderr}", err=True)
        return False
    except FileNotFoundError:
        typer.echo("Hugo not found. Please install Hugo first.", err=True)
        return False


# ============================================================================
# Main CLI Application
# ============================================================================

app = typer.Typer(
    name="generate-city-article",
    help="Generate educational city articles for kids using Claude API.",
    add_completion=False,
)


@app.command()
def main(
    city: str = typer.Argument(..., help="Name of the city to generate an article for"),
    build: bool = typer.Option(
        False, "--build", "-b", help="Build Hugo site after generating"
    ),
    dry_run: bool = typer.Option(
        False, "--dry-run", "-d", help="Print article without saving"
    ),
    number: Optional[int] = typer.Option(
        None, "--number", "-n", help="Override article number (auto-detected by default)"
    ),
) -> None:
    """Generate an educational article about a city for kids.

    Simply provide a city name and the script will:
    - Detect the country and continent automatically
    - Generate a kid-friendly article
    - Save it to the correct content folder
    - Optionally build the Hugo site

    Examples:
        python generate-city-article.py Tokyo
        python generate-city-article.py "New York" --build
        python generate-city-article.py Paris --dry-run
    """
    typer.echo(f"🌍 Generating article about {city}...")

    # Initialize Claude client
    claude = ClaudeClient()

    # Get city information (country, continent, translations)
    typer.echo("📍 Getting city information...")
    city_info = build_city_info(claude, city)

    typer.echo(f"   Country: {city_info.country}")
    typer.echo(f"   Continent: {city_info.continent.title()}")
    typer.echo(f"   Chinese: {city_info.name_chinese} ({city_info.name_jyutping})")
    typer.echo(
        f"   Country (Chinese): {city_info.country_emoji} {city_info.country_chinese} ({city_info.country_jyutping})"
    )

    # Get continent folder
    continent_folder = get_continent_folder(city_info.continent)
    if not continent_folder:
        typer.echo(
            f"❌ Unknown continent: {city_info.continent}. "
            f"Valid options: {', '.join(CONTINENTS.keys())}",
            err=True,
        )
        raise typer.Exit(1)

    # Get article number
    article_number = number if number is not None else get_next_article_number()
    typer.echo(f"📝 Article number: {article_number:03d}")

    # Generate the article content
    typer.echo("✍️  Generating article content...")
    article = claude.generate_article(city, city_info.country)

    # Process and format the article
    processed_article = process_article_content(article, city_info)
    frontmatter = create_frontmatter(article_number, city)
    final_article = frontmatter + processed_article

    if dry_run:
        typer.echo("\n" + "=" * 60)
        typer.echo("Generated Article (dry run):")
        typer.echo("=" * 60 + "\n")
        typer.echo(final_article)
        typer.echo("\n" + "=" * 60)
        typer.echo(f"Would save to: {continent_folder / format_filename(article_number, city)}")
    else:
        # Save the article
        output_path = save_article(final_article, continent_folder, article_number, city)
        typer.echo(f"✅ Article saved to: {output_path}")

        # Build Hugo site if requested
        if build:
            typer.echo("🔨 Building Hugo site...")
            if build_hugo_site():
                typer.echo("✅ Hugo site built successfully!")
                typer.echo(f"🌐 View at: https://ayeung.dev/100-cities-for-kids/")
            else:
                typer.echo("❌ Hugo build failed", err=True)
                raise typer.Exit(1)


@app.command()
def info() -> None:
    """Display information about the generator and current status."""
    typer.echo("City Article Generator for Kids")
    typer.echo("=" * 40)
    typer.echo(f"Claude Model: {CLAUDE_MODEL}")
    typer.echo(f"Project Root: {PROJECT_ROOT}")
    typer.echo(f"Content Dir: {CONTENT_DIR}")

    # Count existing articles
    total_articles = 0
    typer.echo("\nArticles by Continent:")
    for folder_name in sorted(CONTINENTS.values()):
        folder_path = CONTENT_DIR / folder_name
        if folder_path.exists():
            count = len([f for f in folder_path.glob("*.md") if not f.name.startswith("_")])
            total_articles += count
            typer.echo(f"  {folder_name}: {count}")

    typer.echo(f"\nTotal Articles: {total_articles}")
    typer.echo(f"Next Article Number: {get_next_article_number():03d}")

    typer.echo("\nRequired Environment Variable:")
    typer.echo("  ANTHROPIC_API_KEY - Your Claude API key")


@app.command()
def list_continents() -> None:
    """List all valid continent names."""
    typer.echo("Valid Continents:")
    for name, folder in sorted(set((v, v) for v in CONTINENTS.values())):
        typer.echo(f"  - {folder}")


if __name__ == "__main__":
    app()
