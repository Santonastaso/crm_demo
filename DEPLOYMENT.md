# CRM Demo - Professional CRM System Deployment Guide

## 🚀 GitHub Pages Deployment

This application is automatically deployed to GitHub Pages using GitHub Actions when changes are pushed to the `main` or `master` branch.

### 📋 Prerequisites

1. **GitHub Repository**: Ensure your repository is public or you have GitHub Pro for private repo Pages
2. **GitHub Pages**: Enable GitHub Pages in repository settings
3. **Supabase Project**: Set up your Supabase database and get credentials

### 🔐 Required GitHub Repository Secrets

You **MUST** add the following secrets to your GitHub repository for the deployment to work:

#### How to Add Secrets:
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below:

#### Required Secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_INBOUND_EMAIL` | Email for inbound communications | `contact@yourcompany.com` |

#### Where to Find Supabase Credentials:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon/public key**

### 🏗️ Deployment Process

The deployment happens automatically:

1. **Trigger**: Push to `main` or `master` branch, or manual trigger via GitHub Actions
2. **Build**: GitHub Actions runs `npm ci` and `npm run build`
3. **Deploy**: Built files are deployed to GitHub Pages
4. **Access**: Your app will be available at `https://yourusername.github.io/crm_demo`

### 🔧 Manual Deployment

You can also trigger deployment manually:
1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow** → **Run workflow**

### 🌐 Local Development

For local development, create a `.env.local` file:

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your actual values
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_INBOUND_EMAIL=contact@yourcompany.com
```

### 🔍 Troubleshooting

#### Deployment Fails
- Check that all required secrets are set in GitHub repository settings
- Verify Supabase credentials are correct
- Check GitHub Actions logs for specific error messages

#### App Loads but Database Errors
- Verify Supabase URL and key are correct
- Check Supabase project is active and accessible
- Ensure database tables exist and RLS policies are configured

#### GitHub Pages Not Working
- Ensure GitHub Pages is enabled in repository settings
- Check that the repository is public or you have GitHub Pro
- Verify the Pages source is set to "GitHub Actions"

### 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
