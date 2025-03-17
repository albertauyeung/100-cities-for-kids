import re
from openai import OpenAI
from ToJyutping import ToJyutping
from dotenv import load_dotenv

load_dotenv()

openai = OpenAI()

city = "Dublin"
country = "Ireland"
input_path = "../articles/raw/test.md"

# Read the input file as a string
with open(input_path, "r") as file:
    text = file.read()

# Take out the content
text = text.split("---")[1].split("<div")[0].strip()

# Remove the citations in the form of `[ˆ1]`.
text = re.sub(r"\[\^\d+\]", "", text)

# Use OpenAI GPT-4o model to add emojis to the text
completion = openai.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": "Add emojis to the following article without modifying any texts:\n\n" + text
    }]
)

text = completion.choices[0].message.content
print(text)

# Get the chinese translation of the city and the country using GPT-4o
completion = openai.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": f"Translate {city} into traditional Chinese, output only the translation:"
    }]
)
city_chinese = completion.choices[0].message.content
print(f"City: {city_chinese}")

completion = openai.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": f"Translate {country} into traditional Chinese, output only the translation:"
    }]
)
country_chinese = completion.choices[0].message.content
print(f"Country: {country_chinese}")

# Get the emoji of the country using GPT-4o
completion = openai.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": f"Get the flag emoji of {country}, output only the emoji:"
    }]
)
country_emoji = completion.choices[0].message.content

# Get the jyutping of the city and the country
city_jyutping = " ".join([j for _, j in ToJyutping.get_jyutping_list(city_chinese)])
country_jyutping = " ".join([j for _, j in ToJyutping.get_jyutping_list(country_chinese)])

# Generate new header of the article
header = f"# {city}, {country}\n\n"
header += f"- City: {city_chinese} ({city_jyutping})\n"
header += f"- Country: {country_emoji} {country_chinese} ({country_jyutping})"

# Replace the title of the text
text = re.sub(r"^#\s.+", header, text)

# Save article to the output folder
output_path = input_path.replace("raw", "processed")
with open(output_path, "w") as file:
    file.write(text)
