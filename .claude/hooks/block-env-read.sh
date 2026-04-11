#!/bin/bash
# Hook: Blokkerer lesing av .env-filer for å beskytte hemmeligheter
INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if echo "$FILE_PATH" | grep -qE '\.env($|\.)' && ! echo "$FILE_PATH" | grep -q '\.env\.example'; then
  echo '{"decision":"block","reason":"BLOCKED: Lesing av .env-filer er ikke tillatt. Environment variables inneholder hemmeligheter som ikke skal eksponeres i samtalen."}'
  exit 0
fi

exit 0
