"""
Seed script to populate the card_catalog table with popular sports cards.
Run this to initialize the master card database with a baseline set of cards.

Usage: python seed_cards.py
"""

import os
import json
from typing import List, Dict
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY environment variables")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Popular iconic cards to seed
SEED_CARDS = [
    # Michael Jordan - 1986-87 Fleer
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
        "print_run": None,
        "is_parallel": False,
        "parallel_type": None,
        "description": "Michael Jordan rookie card, one of the most valuable sports cards of all time",
        "image_url": "https://images.example.com/mj-rookie.jpg",
    },
    # LeBron James - 2003-04 Topps
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
        "print_run": None,
        "is_parallel": False,
        "parallel_type": None,
        "description": "LeBron James rookie card from his first NBA season",
        "image_url": "https://images.example.com/lebron-rookie.jpg",
    },
    # Zion Williamson - 2020-21 Panini
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
        "print_run": None,
        "is_parallel": False,
        "parallel_type": None,
        "description": "Zion Williamson rookie card, modern era collectible",
        "image_url": "https://images.example.com/zion-rookie.jpg",
    },
    # Luka Doncic - 2018-19 Panini
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
        "print_run": None,
        "is_parallel": False,
        "parallel_type": None,
        "description": "Luka Doncic rookie card, one of the best modern players",
        "image_url": "https://images.example.com/luka-rookie.jpg",
    },
    # Kobe Bryant - 1996-97 Fleer
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
        "print_run": None,
        "is_parallel": False,
        "parallel_type": None,
        "description": "Kobe Bryant rookie card from his first NBA season",
        "image_url": "https://images.example.com/kobe-rookie.jpg",
    },
    # Magic Johnson - 1979-80 Topps
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
        "print_run": None,
        "is_parallel": False,
        "parallel_type": None,
        "description": "Magic Johnson rookie card, true vintage collectible",
        "image_url": "https://images.example.com/magic-rookie.jpg",
    },
    # Steph Curry - 2009-10 Panini
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
        "print_run": None,
        "is_parallel": False,
        "parallel_type": None,
        "description": "Steph Curry rookie card, now a franchise legend",
        "image_url": "https://images.example.com/curry-rookie.jpg",
    },
    # Larry Bird - 1979-80 Topps
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
        "print_run": None,
        "is_parallel": False,
        "parallel_type": None,
        "description": "Larry Bird rookie card, Hall of Famer",
        "image_url": "https://images.example.com/bird-rookie.jpg",
    },
    # Jayson Tatum - 2018-19 Panini
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
        "print_run": None,
        "is_parallel": False,
        "parallel_type": None,
        "description": "Jayson Tatum rookie card, modern star player",
        "image_url": "https://images.example.com/tatum-rookie.jpg",
    },
]


def generate_unique_key(card: Dict) -> str:
    """Generate unique key for a card"""
    return f"{card['manufacturer']}-{card['year']}-{card['player_name']}-{card['card_number']}".replace(
        " ", "-"
    )


def seed_cards() -> None:
    """Seed the card_catalog table with initial cards"""
    print(f"Starting to seed {len(SEED_CARDS)} cards...")

    # Add unique_key to each card
    cards_with_keys = []
    for card in SEED_CARDS:
        card["unique_key"] = generate_unique_key(card)
        cards_with_keys.append(card)

    try:
        # Use upsert to avoid duplicate key errors
        response = supabase.table("card_catalog").upsert(
            cards_with_keys, on_conflict="unique_key"
        ).execute()

        if response.data:
            inserted = len(response.data)
            print(f"✓ Successfully seeded {inserted} cards!")

            # Print summary
            print("\nSeeded cards:")
            for card in response.data:
                print(f"  - {card['player_name']} ({card['set_name']}, {card['year']})")
        else:
            print("No cards were inserted (they may already exist)")

    except Exception as e:
        print(f"✗ Error seeding cards: {e}")
        raise


if __name__ == "__main__":
    seed_cards()
