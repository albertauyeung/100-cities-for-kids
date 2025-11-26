#!/usr/bin/env python3
"""
City Article Generator for Kids

This script generates educational articles about cities for children
using the Claude API. Articles include:
- Basic information about the city
- Location and population
- Famous landmarks
- Language and food
- Notable people (musicians, scientists)
- Fun facts

Usage:
    python generate-city-article.py --city "Tokyo" --country "Japan"
    python generate-city-article.py --city "Paris" --country "France" --output-dir ../content/europe
"""

import re
from dataclasses import dataclass
from pathlib import Path

import typer
from anthropic import Anthropic
from dotenv import load_dotenv
from ToJyutping import ToJyutping

# Load environment variables from .env file
load_dotenv()

# ============================================================================
# Configuration
# ============================================================================

CLAUDE_MODEL = "claude-sonnet-4-20250514"
MAX_TOKENS = 4096

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
    name_chinese: str = ""
    country_chinese: str = ""
    country_emoji: str = ""
    name_jyutping: str = ""
    country_jyutping: str = ""


@dataclass
class ArticleConfig:
    """Configuration for article generation."""

    city: str
    country: str
    article_number: int
    output_dir: Path


# ============================================================================
# Claude API Functions
# ============================================================================


class ClaudeClient:
    """Wrapper for Claude API interactions."""

    def __init__(self, model: str = CLAUDE_MODEL, max_tokens: int = MAX_TOKENS):
        self.client = Anthropic()
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
# Article Processing Functions
# ============================================================================


def build_city_info(claude: ClaudeClient, city: str, country: str) -> CityInfo:
    """Build complete city information with translations and romanizations."""
    info = CityInfo(name=city, country=country)

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
# Main CLI Application
# ============================================================================

app = typer.Typer(
    name="generate-city-article",
    help="Generate educational city articles for kids using Claude API.",
)


@app.command()
def generate(
    city: str = typer.Option(..., "--city", "-c", help="Name of the city"),
    country: str = typer.Option(..., "--country", "-C", help="Name of the country"),
    article_number: int = typer.Option(
        1, "--number", "-n", help="Article number for ordering"
    ),
    output_dir: Path = typer.Option(
        Path("../articles/generated"),
        "--output-dir",
        "-o",
        help="Output directory for the article",
    ),
    dry_run: bool = typer.Option(
        False, "--dry-run", "-d", help="Print article without saving"
    ),
) -> None:
    """Generate an educational article about a city for kids."""
    typer.echo(f"Generating article about {city}, {country}...")

    # Initialize Claude client
    claude = ClaudeClient()

    # Generate the article content
    typer.echo("Generating article content...")
    article = claude.generate_article(city, country)

    # Get city information with translations
    typer.echo("Getting translations and romanizations...")
    city_info = build_city_info(claude, city, country)

    # Display city info
    typer.echo(f"  City (Chinese): {city_info.name_chinese} ({city_info.name_jyutping})")
    typer.echo(
        f"  Country (Chinese): {city_info.country_emoji} {city_info.country_chinese} ({city_info.country_jyutping})"
    )

    # Process and format the article
    processed_article = process_article_content(article, city_info)
    frontmatter = create_frontmatter(article_number, city)
    final_article = frontmatter + processed_article

    if dry_run:
        typer.echo("\n" + "=" * 60)
        typer.echo("Generated Article (dry run):")
        typer.echo("=" * 60 + "\n")
        typer.echo(final_article)
    else:
        # Save the article
        output_path = save_article(final_article, output_dir, article_number, city)
        typer.echo(f"\nArticle saved to: {output_path}")


@app.command()
def info() -> None:
    """Display information about the generator."""
    typer.echo("City Article Generator for Kids")
    typer.echo("================================")
    typer.echo(f"Claude Model: {CLAUDE_MODEL}")
    typer.echo(f"Max Tokens: {MAX_TOKENS}")
    typer.echo("\nFeatures:")
    typer.echo("  - Generates kid-friendly city articles")
    typer.echo("  - Translates city/country names to Traditional Chinese")
    typer.echo("  - Adds Cantonese Jyutping romanization")
    typer.echo("  - Includes country flag emojis")
    typer.echo("\nRequired Environment Variable:")
    typer.echo("  ANTHROPIC_API_KEY - Your Claude API key")


if __name__ == "__main__":
    app()
