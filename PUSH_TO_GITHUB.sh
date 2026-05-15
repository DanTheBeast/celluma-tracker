#!/bin/bash

# Script to push Celluma Tracker to GitHub
# Usage: bash PUSH_TO_GITHUB.sh YOUR_GITHUB_USERNAME

if [ -z "$1" ]; then
    echo "Usage: bash PUSH_TO_GITHUB.sh YOUR_GITHUB_USERNAME"
    echo ""
    echo "Example: bash PUSH_TO_GITHUB.sh john-doe"
    echo ""
    echo "Make sure you've created a GitHub repo at:"
    echo "https://github.com/new (named 'celluma-tracker')"
    exit 1
fi

USERNAME=$1
REPO="celluma-tracker"

echo "📦 Pushing Celluma Tracker to GitHub..."
echo ""
echo "GitHub Username: $USERNAME"
echo "Repository: $REPO"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Run: git init"
    exit 1
fi

# Add remote
echo "🔗 Adding remote origin..."
git remote remove origin 2>/dev/null  # Remove if exists
git remote add origin "https://github.com/$USERNAME/$REPO.git"

# Rename branch to main
echo "📝 Ensuring main branch..."
git branch -M main

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Your code is on GitHub"
    echo ""
    echo "Next steps:"
    echo "1. Go to https://vercel.com"
    echo "2. Sign in with GitHub"
    echo "3. Click 'New Project'"
    echo "4. Select '$REPO' repository"
    echo "5. Click 'Deploy'"
    echo ""
    echo "Your app will be live in 2-3 minutes!"
    echo "Check: https://$REPO.vercel.app"
else
    echo ""
    echo "❌ Failed to push to GitHub"
    echo "Make sure you:"
    echo "- Created the repo at https://github.com/new"
    echo "- Named it '$REPO'"
    echo "- Are authenticated with GitHub"
    exit 1
fi
