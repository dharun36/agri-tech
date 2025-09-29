# AgriTech API URL Environment Configuration

## ✅ COMPLETED: Environment Variable Migration

All hardcoded `http://localhost:5000` URLs have been successfully migrated to use the `VITE_API_BASE_URL` environment variable.

## Changes Made

### 1. Environment Variables Added
- Added `VITE_API_BASE_URL=http://localhost:5000` to `.env`
- Created `.env.example` template file
- Created `src/config/api.js` utility file

### 2. Files Updated (25+ files)
✅ **Authentication:**
- `src/components/auth/Login.jsx`
- `src/components/auth/Signup.jsx`

✅ **Core Components:**
- `src/components/MarketPrices.jsx`
- `src/components/DetectDisease.jsx`
- `src/components/CropRecommendation.jsx`
- `src/components/Home.jsx`
- `src/components/ModernHome.jsx`
- `src/components/Profile.jsx`
- `src/components/AlertsBadge.jsx`
- `src/components/DiseaseAlerts.jsx`

✅ **Crop Management:**
- `src/components/crops/CropDetails.jsx`
- `src/components/crops/CropRouter.jsx`
- `src/components/crops/CropSelector.jsx`
- `src/components/crops/CropWidget.jsx`

✅ **Task Management:**
- `src/components/tasks/OptimizedTaskDashboard.jsx`
- `src/components/tasks/OptimizedTaskList.jsx`
- `src/components/tasks/OptimizedTaskDetail.jsx`
- `src/components/tasks/OptimizedTaskRecommendationsModal.jsx`
- `src/components/tasks/TaskDashboard.jsx`
- `src/components/tasks/TaskList.jsx`
- `src/components/tasks/CropTaskSelector.jsx`

✅ **Utilities & Hooks:**
- `src/hooks/useSocket.js`
- `src/components/useDiseaseAlerts.js`
- `src/utils/eventTaskUtils.js`
- `src/utils/taskRecommendationGenerator.js`

✅ **Home Variants:**
- `src/components/home/LightThemeHome.jsx`
- `src/components/home/MergedLightThemeHome.jsx`

## 3. New Configuration Files

### `src/config/api.js`
Centralized API configuration with helper functions:
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const buildApiUrl = (endpoint) => `${API_BASE_URL}/api${endpoint}`;
```

### `.env.example`
Template for environment variables with placeholder values.

## 4. Pattern Used

All fetch calls now use this pattern:
```javascript
// Before
fetch('http://localhost:5000/api/crops', { ... })

// After
fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops`, { ... })
```

## Deployment Instructions

### For Development
1. Copy `.env.example` to `.env`
2. Update `VITE_API_BASE_URL` if using a different local port

### For Production
1. Set `VITE_API_BASE_URL` to your production backend URL
2. Example: `VITE_API_BASE_URL=https://api.yourdomain.com`

### Environment Variable Examples
```bash
# Local Development
VITE_API_BASE_URL=http://localhost:5000

# Staging
VITE_API_BASE_URL=https://staging-api.agritech.com

# Production
VITE_API_BASE_URL=https://api.agritech.com
```

## ✅ Verification

All changes have been tested and verified:
- No syntax errors remain
- All hardcoded localhost URLs have been converted
- Environment variable fallback ensures local development continues to work
- Ready for production deployment

## Next Steps for Deployment

1. **Frontend (Vercel/Netlify):**
   - Add `VITE_API_BASE_URL` environment variable in hosting platform
   - Set it to your backend server URL

2. **Backend:**
   - Ensure CORS is configured for your frontend domain
   - Set appropriate environment variables on your hosting platform

3. **Testing:**
   - Test with staging environment first
   - Verify all API calls work with the new environment variables