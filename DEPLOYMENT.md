# GitHub Pages Deployment Guide

## Prerequisites
1. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANONYMOUS_KEY=your-anon-key-here
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Manual Deployment
1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

## Automatic Deployment (GitHub Actions)
The project includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the `main` branch.

### Setup:
1. Go to your GitHub repository Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANONYMOUS_KEY`: Your Supabase anonymous key

3. Enable GitHub Pages in repository settings:
   - Settings > Pages > Build and deployment > Source
   - Select "GitHub Actions"

## Configuration Details
- **Base Path**: Set to `/unigo-rides-main/` for GitHub Pages
- **Build Output**: `dist` directory
- **Asset Handling**: Properly configured for GitHub Pages
- **Jekyll**: Disabled with `.nojekyll` file

## Troubleshooting
### "Failed to execute fetch on Window: Invalid value" Error
This error is typically caused by:
1. Missing environment variables
2. Invalid Supabase URL format
3. Network issues with external APIs

**Solutions:**
- Check browser console for exact error messages
- Verify `.env` file exists with correct values
- Ensure Supabase URL starts with `https://`
- Check GitHub Secrets if using GitHub Actions

### Environment Variables
The app logs environment variables to console for debugging:
- Supabase URL
- Supabase Key existence
- Environment mode (development/production)

### API Endpoints
- OpenStreetMap API calls now include detailed error logging
- All URLs are logged to console for debugging
- Graceful fallback to local database when external APIs fail
