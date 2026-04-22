#!/bin/bash
echo "======================================="
echo "   WOMYN PROJECT DEV ENVIRONMENT"
echo "======================================="
if ! command -v node &> /dev/null
then
    echo "[ERROR] Node.js is not installed. Please install it from https://nodejs.org/"
    exit
fi
if [ ! -d "node_modules" ]; then
    echo "[1/2] Installing dependencies..."
    npm install
else
    echo "[1/2] Dependencies already present."
fi
echo "[2/2] Starting Parcel server..."
echo "Invite Code: 2026w1905050"
open "http://localhost:1234"
npm start