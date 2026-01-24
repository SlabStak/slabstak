"""
Generate a CSV file with popular sports cards for seeding the card_catalog.
Run this to create a CSV that can be imported via the admin UI.

Usage: python generate_seed_csv.py
Output: seed_cards.csv
"""

import csv
import os
from typing import List, Dict

# Popular iconic cards to seed
SEED_CARDS = [
    # Basketball
    {
        "player_name": "Michael Jordan",
        "set_name": "1986-87 Fleer Basketball",
        "card_number": "57",
        "year": 1986,
        "sport": "basketball",
        "manufacturer": "Fleer",
        "team": "Chicago Bulls",
        "position": "Guard",
        "card_type": "rookie",
    },
    {
        "player_name": "LeBron James",
        "set_name": "2003-04 Topps Basketball",
        "card_number": "221",
        "year": 2003,
        "sport": "basketball",
        "manufacturer": "Topps",
        "team": "Cleveland Cavaliers",
        "position": "Forward",
        "card_type": "rookie",
    },
    {
        "player_name": "Zion Williamson",
        "set_name": "2020-21 Panini Prizm Basketball",
        "card_number": "2",
        "year": 2020,
        "sport": "basketball",
        "manufacturer": "Panini",
        "team": "New Orleans Pelicans",
        "position": "Forward",
        "card_type": "rookie",
    },
    {
        "player_name": "Luka Doncic",
        "set_name": "2018-19 Panini Prizm Basketball",
        "card_number": "280",
        "year": 2018,
        "sport": "basketball",
        "manufacturer": "Panini",
        "team": "Dallas Mavericks",
        "position": "Guard",
        "card_type": "rookie",
    },
    {
        "player_name": "Kobe Bryant",
        "set_name": "1996-97 Fleer Basketball",
        "card_number": "203",
        "year": 1996,
        "sport": "basketball",
        "manufacturer": "Fleer",
        "team": "Los Angeles Lakers",
        "position": "Guard",
        "card_type": "rookie",
    },
    {
        "player_name": "Magic Johnson",
        "set_name": "1979-80 Topps Basketball",
        "card_number": "139",
        "year": 1979,
        "sport": "basketball",
        "manufacturer": "Topps",
        "team": "Los Angeles Lakers",
        "position": "Guard",
        "card_type": "rookie",
    },
    {
        "player_name": "Steph Curry",
        "set_name": "2009-10 Panini Basketball",
        "card_number": "160",
        "year": 2009,
        "sport": "basketball",
        "manufacturer": "Panini",
        "team": "Golden State Warriors",
        "position": "Guard",
        "card_type": "rookie",
    },
    {
        "player_name": "Larry Bird",
        "set_name": "1979-80 Topps Basketball",
        "card_number": "33",
        "year": 1979,
        "sport": "basketball",
        "manufacturer": "Topps",
        "team": "Boston Celtics",
        "position": "Forward",
        "card_type": "rookie",
    },
    {
        "player_name": "Jayson Tatum",
        "set_name": "2018-19 Panini Prizm Basketball",
        "card_number": "279",
        "year": 2018,
        "sport": "basketball",
        "manufacturer": "Panini",
        "team": "Boston Celtics",
        "position": "Forward",
        "card_type": "rookie",
    },
    {
        "player_name": "Ja Morant",
        "set_name": "2019-20 Panini Prizm Basketball",
        "card_number": "248",
        "year": 2019,
        "sport": "basketball",
        "manufacturer": "Panini",
        "team": "Memphis Grizzlies",
        "position": "Guard",
        "card_type": "rookie",
    },
    # Baseball (iconic cards)
    {
        "player_name": "Babe Ruth",
        "set_name": "1921 W512",
        "card_number": "1",
        "year": 1921,
        "sport": "baseball",
        "manufacturer": "Mecca",
        "team": "New York Yankees",
        "position": "Outfield",
        "card_type": "base",
    },
    {
        "player_name": "Jackie Robinson",
        "set_name": "1948 Leaf Baseball",
        "card_number": "79",
        "year": 1948,
        "sport": "baseball",
        "manufacturer": "Leaf",
        "team": "Brooklyn Dodgers",
        "position": "Infield",
        "card_type": "base",
    },
    {
        "player_name": "Mike Trout",
        "set_name": "2011 Bowman Baseball",
        "card_number": "101",
        "year": 2011,
        "sport": "baseball",
        "manufacturer": "Bowman",
        "team": "Los Angeles Angels",
        "position": "Outfield",
        "card_type": "rookie",
    },
    # Football
    {
        "player_name": "Tom Brady",
        "set_name": "2000 Bowman Football",
        "card_number": "236",
        "year": 2000,
        "sport": "football",
        "manufacturer": "Bowman",
        "team": "New England Patriots",
        "position": "Quarterback",
        "card_type": "rookie",
    },
    {
        "player_name": "Patrick Mahomes",
        "set_name": "2017 Panini Donruss Football",
        "card_number": "327",
        "year": 2017,
        "sport": "football",
        "manufacturer": "Donruss",
        "team": "Kansas City Chiefs",
        "position": "Quarterback",
        "card_type": "rookie",
    },
]


def generate_csv() -> None:
    """Generate CSV file with seed cards"""
    output_file = "seed_cards.csv"

    # Get the directory where this script is
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, output_file)

    with open(output_path, "w", newline="") as csvfile:
        fieldnames = [
            "player_name",
            "set_name",
            "card_number",
            "year",
            "sport",
            "manufacturer",
            "team",
            "position",
            "card_type",
        ]

        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(SEED_CARDS)

    print(f"✓ Generated {output_path}")
    print(f"  Total cards: {len(SEED_CARDS)}")
    print(f"  Sports: basketball, baseball, football")
    print(f"\nYou can now upload this file via /admin/catalog with the CSV Import feature.")


if __name__ == "__main__":
    generate_csv()
