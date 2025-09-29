# Environment Configuration for AgriTech

This file contains all the environment variables needed for the AgriTech application.

## Required Environment Variables

### API Configuration
- `VITE_API_BASE_URL`: Base URL for the backend API server
  - Development: `http://localhost:5000`
  - Production: Your deployed backend URL (e.g., `https://your-api-domain.com`)

### External APIs
- `VITE_GOV_API_KEY`: API key for Government of India data portal
- `VITE_GEMINI_API_KEY`: Google Gemini AI API key for crop recommendations
- `VITE_WEATHER_API_KEY`: Tomorrow.io weather API key
- `VITE_TOMORROW_API_KEY`: Tomorrow.io API key (backup)
- `VITE_DISEASE_API_URL`: Disease detection API endpoint

## Deployment Instructions

### For Local Development
Copy `.env.example` to `.env` and update the values as needed.

### For Production Deployment

1. **Vercel/Netlify Frontend:**
   - Add all `VITE_*` environment variables in your hosting platform's environment variables section
   - Set `VITE_API_BASE_URL` to your backend server URL

2. **Heroku/Railway Backend:**
   - Add `BASE_URL` environment variable pointing to your frontend domain
   - Configure database and other backend environment variables

3. **Docker Deployment:**
   ```bash
   # Build frontend with production API URL
   docker build --build-arg VITE_API_BASE_URL=https://your-api-domain.com .
   ```

### Environment Variable Examples

```bash
# Development
VITE_API_BASE_URL=http://localhost:5000

# Staging
VITE_API_BASE_URL=https://staging-api.agritech.com

# Production
VITE_API_BASE_URL=https://api.agritech.com
```

## Security Notes

- Never commit actual API keys to version control
- Use different API keys for development, staging, and production
- Rotate API keys regularly
- Keep the `.env` file in `.gitignore`