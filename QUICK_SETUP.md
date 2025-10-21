# 🚀 ArchAI Code Sight - Quick Supabase Setup

## **5-Minute Setup (No Manual Work Required)**

### **Step 1: Create Supabase Project (2 minutes)**

1. **Go to**: [supabase.com](https://supabase.com)
2. **Click**: "Start your project" → "New project"
3. **Fill in**:
   - **Name**: `archai-code-sight`
   - **Database Password**: `ArchaiCodeSight2024!`
   - **Region**: Choose closest to you
4. **Click**: "Create new project"
5. **Wait**: 2-3 minutes for setup

### **Step 2: Get Credentials (30 seconds)**

1. **Go to**: Settings → API in your Supabase dashboard
2. **Copy these two values**:
   - **Project URL** (starts with `https://`)
   - **anon public** key (long string starting with `eyJ`)

### **Step 3: Add to Vercel (1 minute)**

1. **Go to**: Vercel → Your Project → Settings → Environment Variables
2. **Add these variables**:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. **Click**: "Save"
4. **Go to**: Deployments → Click "Redeploy"

### **Step 4: Optional - Deploy Functions (2 minutes)**

If you want AI insights to work:

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login and link**:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_ID
   ```

3. **Deploy functions**:
   ```bash
   supabase functions deploy
   ```

## ✅ **That's It!**

Your app will now work with:
- ✅ **User authentication**
- ✅ **File uploads**
- ✅ **GitHub integration**
- ✅ **AI-powered insights**
- ✅ **Architecture analysis**

## 🔧 **Alternative: Demo Mode**

If you want to test immediately without Supabase setup:

1. **Add these demo values to Vercel**:
   ```
   VITE_SUPABASE_URL=https://demo.supabase.co
   VITE_SUPABASE_ANON_KEY=demo-key
   ```

2. **Note**: Demo mode won't save data permanently, but will let you test the UI.

## 🆘 **Need Help?**

- **Supabase Dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Project Repository**: [github.com/harshaldhaduk/Archai](https://github.com/harshaldhaduk/Archai)

## 📋 **What Gets Set Up Automatically**

- ✅ Database tables for codebase analyses
- ✅ User authentication system
- ✅ File storage for uploads
- ✅ Edge functions for AI processing
- ✅ GitHub integration
- ✅ Architecture parsing
- ✅ AI insights generation
