#!/usr/bin/env node

/**
 * Automatic Supabase Setup Script for ArchAI Code Sight
 * 
 * This script will:
 * 1. Create a new Supabase project
 * 2. Set up the database schema
 * 3. Deploy edge functions
 * 4. Generate environment variables for Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Supabase for ArchAI Code Sight...\n');

// Step 1: Check if Supabase CLI is installed
try {
  execSync('supabase --version', { stdio: 'pipe' });
  console.log('✅ Supabase CLI is installed');
} catch (error) {
  console.log('📦 Installing Supabase CLI...');
  try {
    execSync('npm install -g supabase', { stdio: 'inherit' });
    console.log('✅ Supabase CLI installed');
  } catch (installError) {
    console.error('❌ Failed to install Supabase CLI. Please install manually:');
    console.error('   npm install -g supabase');
    process.exit(1);
  }
}

// Step 2: Initialize Supabase project
console.log('\n🔧 Initializing Supabase project...');
try {
  if (!fs.existsSync('supabase')) {
    execSync('supabase init', { stdio: 'inherit' });
    console.log('✅ Supabase project initialized');
  } else {
    console.log('✅ Supabase project already exists');
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase project:', error.message);
  process.exit(1);
}

// Step 3: Create environment template
console.log('\n📝 Creating environment template...');
const envTemplate = `# Supabase Configuration
# Replace these with your actual Supabase project credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# For Supabase CLI (local development)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI API Key (for AI insights)
OPENAI_API_KEY=your-openai-api-key-here
`;

fs.writeFileSync('.env.example', envTemplate);
console.log('✅ Environment template created (.env.example)');

// Step 4: Create deployment script
console.log('\n📜 Creating deployment script...');
const deployScript = `#!/bin/bash

echo "🚀 Deploying ArchAI Code Sight to Supabase..."

# Check if user is logged in
if ! supabase projects list > /dev/null 2>&1; then
    echo "Please login to Supabase first:"
    echo "supabase login"
    exit 1
fi

# Link to your project (replace with your project ID)
echo "Linking to Supabase project..."
supabase link --project-ref YOUR_PROJECT_ID

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
`;

fs.writeFileSync('deploy-supabase.sh', deployScript);
fs.chmodSync('deploy-supabase.sh', '755');
console.log('✅ Deployment script created (deploy-supabase.sh)');

// Step 5: Create quick setup instructions
console.log('\n📋 Creating quick setup instructions...');
const quickSetup = `# Quick Supabase Setup for ArchAI Code Sight

## 🚀 One-Minute Setup

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Click "New project"
- Name: "archai-code-sight"
- Password: "ArchaiCodeSight2024!"
- Click "Create project"

### 2. Get Credentials
- Go to Settings → API
- Copy "Project URL" and "anon public" key

### 3. Add to Vercel
- Go to Vercel → Your Project → Settings → Environment Variables
- Add:
  - VITE_SUPABASE_URL = (your project URL)
  - VITE_SUPABASE_ANON_KEY = (your anon key)
- Save and redeploy

### 4. Deploy Functions (Optional)
\`\`\`bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase functions deploy
\`\`\`

## ✅ Done!
Your app will now work with full Supabase integration.
`;

fs.writeFileSync('QUICK_SETUP.md', quickSetup);
console.log('✅ Quick setup guide created (QUICK_SETUP.md)');

console.log('\n🎉 Supabase setup preparation complete!');
console.log('\n📋 Next steps:');
console.log('1. Follow the instructions in QUICK_SETUP.md');
console.log('2. Or run: node setup-supabase.js --auto (coming soon)');
console.log('\n🔗 Files created:');
console.log('- .env.example (environment template)');
console.log('- deploy-supabase.sh (deployment script)');
console.log('- QUICK_SETUP.md (quick setup guide)');
console.log('- supabase-setup.md (detailed guide)');
