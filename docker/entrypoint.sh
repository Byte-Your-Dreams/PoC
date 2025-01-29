#!/bin/bash

# Start Ollama in the background.
/bin/ollama serve &
# Record Process ID.
pid=$!

# Pause for Ollama to start.
sleep 5

echo "🔴 Retrieve nomic-embed-text model..."
ollama pull nomic-embed-text
echo "🟢 Done!"

echo "🔴 Retrieve llama3.2:3b model..."
ollama pull deepseek-r1:14b
echo "🟢 Done!"


# Add model for answers

# Wait for Ollama process to finish.
wait $pid