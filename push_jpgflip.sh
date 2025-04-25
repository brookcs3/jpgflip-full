#!/bin/bash

# Create a temporary directory for jpgflip-full
mkdir -p /tmp/jpgflip-clone

# Remove existing directory to avoid conflicts
rm -rf /tmp/jpgflip-clone/*

# Copy the files to the temporary directory
cp -r jpgflip-full/* /tmp/jpgflip-clone/
cp -r jpgflip-full/.* /tmp/jpgflip-clone/ 2>/dev/null || true

# Get current directory
CURRENT_DIR=$(pwd)

# Initialize git repository
cd /tmp/jpgflip-clone
git init --initial-branch=main
git add .
git config --local user.email "brooksc3@oregonstate.edu"
git config --local user.name "brookcs3"
git commit -m "Initial commit of JPGFlip - fully functional JPG to AVIF converter"

# Make sure there's no existing origin
git remote remove origin 2>/dev/null || true

# Add the correct remote and push
git remote add origin https://x-access-token:${GITHUB_FULL_ACCESS_TOKEN}@github.com/brookcs3/jpgflip-full.git
git push -u origin main --force

# Go back to original directory
cd $CURRENT_DIR

echo "Successfully pushed all files to jpgflip-full repository"