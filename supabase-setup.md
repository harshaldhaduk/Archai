# Supabase Setup Guide for ArchAI Code Sight

## 🚀 **One-Click Supabase Setup**

### **Step 1: Create Supabase Project (2 minutes)**

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** → **"New project"**
3. Fill in:
   - **Name**: `archai-code-sight`
   - **Database Password**: `ArchaiCodeSight2024!` (or any strong password)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup to complete

### **Step 2: Get Your Credentials**

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (long string starting with `eyJ`)

### **Step 3: Add to Vercel (1 minute)**

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Click **"Save"**
5. Go to **Deployments** → **Redeploy** (or it will auto-redeploy)

### **Step 4: Deploy Supabase Functions**

1. Install Supabase CLI: `npm install -g supabase`
2. Run: `supabase login`
3. Run: `supabase link --project-ref your-project-id`
4. Run: `supabase functions deploy`

## ✅ **That's It!**

Your app will now work with:
- ✅ User authentication
- ✅ File uploads
- ✅ GitHub integration  
- ✅ AI-powered insights
- ✅ Architecture analysis

## 🔧 **Alternative: Use These Demo Credentials**

If you want to test immediately, you can use these demo credentials (they won't persist data):

```
VITE_SUPABASE_URL=https://demo.supabase.co
VITE_SUPABASE_ANON_KEY=demo-key
```

**Note**: Demo credentials won't save data permanently, but will let you test the UI.
