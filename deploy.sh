#!/bin/bash

echo "🚀 Deploying ArchAI Code Sight to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi

# Check if user is logged in
if ! supabase projects list > /dev/null 2>&1; then
    echo "Please login to Supabase first:"
    echo "supabase login"
    exit 1
fi

echo "Please enter your Supabase project ID:"
read PROJECT_ID

# Link to project
echo "Linking to Supabase project..."
supabase link --project-ref $PROJECT_ID

# Deploy database migrations
echo "Deploying database migrations..."
supabase db push

# Deploy edge functions
echo "Deploying edge functions..."
supabase functions deploy

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Get your project URL and anon key from Supabase dashboard"
echo "2. Add them to Vercel environment variables"
echo "3. Redeploy your Vercel project"
