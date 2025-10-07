#!/bin/bash

# Auto-generate trips-index.json from all JSON files in routes folder

cd "$(dirname "$0")"

echo "Scanning routes folder..."

# Collect all JSON files except trips-index.json
files=()
for file in routes/*.json; do
    filename=$(basename "$file")
    if [ "$filename" != "trips-index.json" ]; then
        files+=("$filename")
    fi
done

# Sort files
IFS=$'\n' sorted=($(sort <<<"${files[*]}"))
unset IFS

# Create trips-index.json
echo '{' > routes/trips-index.json
echo '    "trips": [' >> routes/trips-index.json

for i in "${!sorted[@]}"; do
    if [ $i -eq $((${#sorted[@]} - 1)) ]; then
        # Last item, no comma
        echo "        \"${sorted[$i]}\"" >> routes/trips-index.json
    else
        # Not last item, add comma
        echo "        \"${sorted[$i]}\"," >> routes/trips-index.json
    fi
done

echo '    ]' >> routes/trips-index.json
echo '}' >> routes/trips-index.json

echo "✅ trips-index.json updated successfully!"
echo "Found ${#sorted[@]} tour(s)"
