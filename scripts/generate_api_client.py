#!/usr/bin/env python3
"""
Generate API Client Code from OpenAPI Schema.
Story 5.5: Generate OpenAPI Documentation and API Client

This script:
1. Starts the FastAPI server
2. Downloads the OpenAPI JSON schema
3. Generates Python and TypeScript client code using openapi-generator
4. Saves generated clients to client/ directory

Requirements:
- openapi-generator-cli (npm install -g @openapitools/openapi-generator-cli)
- OR docker (for running openapi-generator via Docker)

Usage:
    python scripts/generate_api_client.py
    python scripts/generate_api_client.py --lang python
    python scripts/generate_api_client.py --lang typescript-axios
"""

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

# Project root directory
PROJECT_ROOT = Path(__file__).parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
CLIENT_DIR = PROJECT_ROOT / "client"
OPENAPI_FILE = PROJECT_ROOT / "openapi.json"


def check_server_running(base_url: str) -> bool:
    """
    Check if FastAPI server is running.

    Args:
        base_url: Base URL of the server

    Returns:
        bool: True if server is running
    """
    try:
        urllib.request.urlopen(f"{base_url}/health", timeout=2)
        return True
    except:
        return False


def download_openapi_schema(base_url: str, output_file: Path) -> bool:
    """
    Download OpenAPI schema from FastAPI server.

    Args:
        base_url: Base URL of the server
        output_file: Path to save the schema

    Returns:
        bool: True if successful
    """
    try:
        print(f"Downloading OpenAPI schema from {base_url}/openapi.json...")
        with urllib.request.urlopen(f"{base_url}/openapi.json") as response:
            schema = json.loads(response.read())

        # Save to file
        with open(output_file, 'w') as f:
            json.dump(schema, f, indent=2)

        print(f"✓ OpenAPI schema saved to {output_file}")
        return True

    except Exception as e:
        print(f"✗ Failed to download OpenAPI schema: {e}")
        return False


def generate_client_with_docker(
    generator: str,
    input_spec: Path,
    output_dir: Path,
    package_name: str
) -> bool:
    """
    Generate API client using OpenAPI Generator via Docker.

    Args:
        generator: Generator name (python, typescript-axios, etc.)
        input_spec: Path to OpenAPI JSON file
        output_dir: Output directory for generated code
        package_name: Package/module name

    Returns:
        bool: True if successful
    """
    try:
        print(f"\nGenerating {generator} client...")

        # Prepare output directory
        output_dir.mkdir(parents=True, exist_ok=True)

        # Run openapi-generator via Docker
        cmd = [
            "docker", "run", "--rm",
            "-v", f"{input_spec.parent}:/local",
            "openapitools/openapi-generator-cli", "generate",
            "-i", f"/local/{input_spec.name}",
            "-g", generator,
            "-o", f"/local/client/{generator}",
            "--package-name", package_name,
            "--additional-properties=projectName=audio-pipeline-api"
        ]

        # Add generator-specific options
        if generator == "python":
            cmd.extend([
                "--additional-properties=packageVersion=1.0.0",
                "--additional-properties=library=urllib3"
            ])
        elif generator == "typescript-axios":
            cmd.extend([
                "--additional-properties=npmName=audio-pipeline-api",
                "--additional-properties=npmVersion=1.0.0",
                "--additional-properties=supportsES6=true"
            ])

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            print(f"✓ {generator} client generated successfully")
            print(f"  Location: {output_dir}")
            return True
        else:
            print(f"✗ Failed to generate {generator} client")
            print(f"  Error: {result.stderr}")
            return False

    except Exception as e:
        print(f"✗ Error generating {generator} client: {e}")
        return False


def generate_client_with_cli(
    generator: str,
    input_spec: Path,
    output_dir: Path,
    package_name: str
) -> bool:
    """
    Generate API client using OpenAPI Generator CLI.

    Args:
        generator: Generator name (python, typescript-axios, etc.)
        input_spec: Path to OpenAPI JSON file
        output_dir: Output directory for generated code
        package_name: Package/module name

    Returns:
        bool: True if successful
    """
    try:
        print(f"\nGenerating {generator} client...")

        # Prepare output directory
        output_dir.mkdir(parents=True, exist_ok=True)

        # Run openapi-generator-cli
        cmd = [
            "openapi-generator-cli", "generate",
            "-i", str(input_spec),
            "-g", generator,
            "-o", str(output_dir),
            "--package-name", package_name,
            "--additional-properties=projectName=audio-pipeline-api"
        ]

        # Add generator-specific options
        if generator == "python":
            cmd.extend([
                "--additional-properties=packageVersion=1.0.0",
                "--additional-properties=library=urllib3"
            ])
        elif generator == "typescript-axios":
            cmd.extend([
                "--additional-properties=npmName=audio-pipeline-api",
                "--additional-properties=npmVersion=1.0.0",
                "--additional-properties=supportsES6=true"
            ])

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            print(f"✓ {generator} client generated successfully")
            print(f"  Location: {output_dir}")
            return True
        else:
            print(f"✗ Failed to generate {generator} client")
            print(f"  Error: {result.stderr}")
            return False

    except FileNotFoundError:
        print(f"✗ openapi-generator-cli not found. Install with:")
        print("  npm install -g @openapitools/openapi-generator-cli")
        return False
    except Exception as e:
        print(f"✗ Error generating {generator} client: {e}")
        return False


def create_readme(client_dir: Path, generator: str):
    """
    Create README for generated client.

    Args:
        client_dir: Client directory
        generator: Generator name
    """
    readme_content = f"""# Audio Pipeline API Client - {generator.title()}

This client was auto-generated from the OpenAPI specification.

## Installation

### Python
```bash
pip install -e .
```

### TypeScript
```bash
npm install
```

## Usage

### Python
```python
from audio_pipeline_api import ApiClient, Configuration, CallsApi

# Configure client
config = Configuration(
    host="http://localhost:8000"
)
client = ApiClient(config)

# Set authentication token
client.default_headers['Authorization'] = 'Bearer YOUR_TOKEN'

# Use API
calls_api = CallsApi(client)
calls = calls_api.list_calls()
```

### TypeScript
```typescript
import {{ CallsApi, Configuration }} from 'audio-pipeline-api';

// Configure client
const config = new Configuration({{
  basePath: 'http://localhost:8000',
  accessToken: 'YOUR_TOKEN'
}});

// Use API
const callsApi = new CallsApi(config);
const calls = await callsApi.listCalls();
```

## Regeneration

To regenerate this client:
```bash
python scripts/generate_api_client.py --lang {generator}
```
"""

    readme_file = client_dir / "README.md"
    with open(readme_file, 'w') as f:
        f.write(readme_content)


def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description="Generate API client code from OpenAPI schema"
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Base URL of FastAPI server"
    )
    parser.add_argument(
        "--lang",
        choices=["python", "typescript-axios", "all"],
        default="all",
        help="Language to generate (default: all)"
    )
    parser.add_argument(
        "--use-cli",
        action="store_true",
        help="Use openapi-generator-cli instead of Docker"
    )
    parser.add_argument(
        "--skip-server-check",
        action="store_true",
        help="Skip server running check"
    )

    args = parser.parse_args()

    print("=" * 60)
    print("Audio Pipeline API Client Generator")
    print("=" * 60)

    # Check if server is running
    if not args.skip_server_check:
        if not check_server_running(args.base_url):
            print(f"\n✗ FastAPI server is not running at {args.base_url}")
            print("\nPlease start the server first:")
            print("  cd backend")
            print("  uvicorn main:app --reload")
            sys.exit(1)
        print(f"✓ FastAPI server is running at {args.base_url}")

    # Download OpenAPI schema
    if not download_openapi_schema(args.base_url, OPENAPI_FILE):
        sys.exit(1)

    # Determine which generators to use
    generators = {
        "python": "audio_pipeline_api",
        "typescript-axios": "audio-pipeline-api"
    }

    if args.lang != "all":
        generators = {args.lang: generators[args.lang]}

    # Generate clients
    success_count = 0
    for generator, package_name in generators.items():
        output_dir = CLIENT_DIR / generator

        # Choose generation method
        if args.use_cli:
            success = generate_client_with_cli(
                generator, OPENAPI_FILE, output_dir, package_name
            )
        else:
            success = generate_client_with_docker(
                generator, OPENAPI_FILE, output_dir, package_name
            )

        if success:
            success_count += 1
            create_readme(output_dir, generator)

    # Summary
    print("\n" + "=" * 60)
    print(f"Generated {success_count}/{len(generators)} clients successfully")
    print("=" * 60)

    if success_count == len(generators):
        print("\n✓ All clients generated successfully!")
        print(f"\nClients available in: {CLIENT_DIR}")
        sys.exit(0)
    else:
        print("\n⚠ Some clients failed to generate")
        sys.exit(1)


if __name__ == "__main__":
    main()
