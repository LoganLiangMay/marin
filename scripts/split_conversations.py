#!/usr/bin/env python3
"""
Split conversations from a single file into multiple text files.
Each conversation is saved as a separate file in test_scripts/
"""

import re
from pathlib import Path

# Project root directory
PROJECT_ROOT = Path(__file__).parent.parent
INPUT_FILE = PROJECT_ROOT / "test_scripts" / "20_sample.txt"
OUTPUT_DIR = PROJECT_ROOT / "test_scripts"


def split_conversations():
    """Split the input file by conversation markers."""

    # Read the entire file
    print(f"Reading {INPUT_FILE}...")
    # Try different encodings
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    content = None

    for encoding in encodings:
        try:
            with open(INPUT_FILE, 'r', encoding=encoding, errors='ignore') as f:
                content = f.read()
            print(f"Successfully read file with {encoding} encoding")
            break
        except Exception as e:
            continue

    if content is None:
        raise Exception("Could not read file with any encoding")

    # Split by "Conversation X:" pattern
    # Pattern matches "Conversation 1:", "Conversation 2:", etc.
    pattern = r'(Conversation \d+:)'
    parts = re.split(pattern, content)

    # Remove empty first part if file starts with a conversation marker
    if parts[0].strip() == '':
        parts = parts[1:]

    # Combine markers with their content
    conversations = []
    for i in range(0, len(parts), 2):
        if i + 1 < len(parts):
            conv_header = parts[i]
            conv_content = parts[i + 1]
            conversations.append((conv_header, conv_content))

    print(f"Found {len(conversations)} conversations")

    # Create output directory if it doesn't exist
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Save each conversation to a separate file
    for idx, (header, content) in enumerate(conversations, start=1):
        output_file = OUTPUT_DIR / f"conversation_{idx:02d}.txt"

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(header + content)

        print(f"✓ Created {output_file.name} ({len(header + content)} characters)")

    print(f"\n✓ Successfully split {len(conversations)} conversations into separate files")
    print(f"Location: {OUTPUT_DIR}")


if __name__ == "__main__":
    split_conversations()
