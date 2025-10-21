#!/usr/bin/env node

/**
 * 🚀 Automatic Supabase Setup for ArchAI Code Sight
 * 
 * This script will guide you through the complete setup process
 * with minimal manual work required.
 */

const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 ArchAI Code Sight - Automatic Supabase Setup\n');

// Step 1: Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from your project root directory');
  process.exit(1);
}

console.log('✅ Project directory detected\n');

// Step 2: Create environment template
console.log('📝 Creating environment template...');
const envTemplate = `# Supabase Configuration
# Replace these with your actual Supabase project credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI API Key (for AI insights)
OPENAI_API_KEY=your-openai-api-key-here
`;

fs.writeFileSync('.env.example', envTemplate);
console.log('✅ Environment template created (.env.example)\n');

// Step 3: Create setup instructions
console.log('📋 Creating setup instructions...');
const instructions = `
# 🚀 ArchAI Code Sight - Supabase Setup Complete!

## Next Steps (5 minutes total):

### 1. Create Supabase Project (2 minutes)
- Go to: https://supabase.com
- Click "Start your project" → "New project"
- Name: "archai-code-sight"
- Password: "ArchaiCodeSight2024!"
- Click "Create project"
- Wait 2-3 minutes

### 2. Get Your Credentials (30 seconds)
- Go to Settings → API in Supabase dashboard
- Copy "Project URL" and "anon public" key

### 3. Add to Vercel (1 minute)
- Go to Vercel → Your Project → Settings → Environment Variables
- Add:
  - VITE_SUPABASE_URL = (your project URL)
  - VITE_SUPABASE_ANON_KEY = (your anon key)
- Save and redeploy

### 4. Optional - Deploy Functions (2 minutes)
\`\`\`bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase functions deploy
\`\`\`

## ✅ That's It!
Your app will now work with full Supabase integration.

## 🔧 Alternative: Demo Mode
Add these to Vercel environment variables for immediate testing:
- VITE_SUPABASE_URL=https://demo.supabase.co
- VITE_SUPABASE_ANON_KEY=demo-key

Note: Demo mode won't save data permanently.
`;

fs.writeFileSync('SETUP_INSTRUCTIONS.md', instructions);
console.log('✅ Setup instructions created (SETUP_INSTRUCTIONS.md)\n');

// Step 4: Create automated deployment script
console.log('🔧 Creating deployment script...');
const deployScript = `#!/bin/bash

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
`;

fs.writeFileSync('deploy.sh', deployScript);
fs.chmodSync('deploy.sh', '755');
console.log('✅ Deployment script created (deploy.sh)\n');

// Step 5: Create Vercel environment template
console.log('🌐 Creating Vercel environment template...');
const vercelEnv = `# Vercel Environment Variables
# Add these to your Vercel project settings

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
OPENAI_API_KEY=your-openai-api-key-here
`;

fs.writeFileSync('vercel-env.txt', vercelEnv);
console.log('✅ Vercel environment template created (vercel-env.txt)\n');

console.log('🎉 Automatic setup preparation complete!\n');
console.log('📋 Files created:');
console.log('- .env.example (environment template)');
console.log('- SETUP_INSTRUCTIONS.md (step-by-step guide)');
console.log('- deploy.sh (deployment script)');
console.log('- vercel-env.txt (Vercel environment variables)\n');
console.log('🚀 Next steps:');
console.log('1. Follow SETUP_INSTRUCTIONS.md');
console.log('2. Or run: ./deploy.sh');
console.log('3. Add environment variables to Vercel');
console.log('4. Redeploy your project\n');
console.log('✅ Your app will then work with full Supabase integration!');
