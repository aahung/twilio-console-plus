#!/usr/bin/env bash

OUTPUT_DIR=./src/generated-twilio-api-models
JSON_PATH_PREFIX=https://raw.githubusercontent.com/twilio/twilio-oai/main/spec/json

declare -a arr=(
  "twilio_numbers_v2"
  "twilio_accounts_v1"
  "twilio_messaging_v1"
  "twilio_api_v2010"
)
for NAME in "${arr[@]}"; do
  npx openapi-typescript "$JSON_PATH_PREFIX/$NAME.json" \
    -o "$OUTPUT_DIR/$NAME.schema.d.ts"
done
