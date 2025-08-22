# AgriTech Disease Alert System

A comprehensive real-time disease alert system for AgriTech with advanced UI features, WebSocket support, and email notifications.

## Features Implemented

### 🚨 Real-time Disease Alerts
- **Live notifications** via WebSocket connections
- **Browser push notifications** with permission handling
- **Email alerts** sent via SMTP when diseases are detected
- **Geolocation-based** alert delivery to nearby users

### 📱 Advanced UI Components

#### DiseaseAlerts Component (`/alerts` page)
- **Responsive design** for desktop and mobile
- **Badge with unread count** in header
- **List/card view** with disease info, description, timestamps
- **Grouping & deduplication** - combines alerts for same disease/location within 24h
- **Expandable details** with treatment recommendations
- **Action buttons**: View details, Open map, Mark read
- **Pagination** with "Load More" functionality
- **Real-time updates** via WebSocket integration

#### AlertsBadge Component (Header integration)
- **Unread count indicator** with red badge
- **Live connection status** indicator
- **Auto-polling** fallback (30-second intervals)
- **Click to navigate** to full alerts page

### 🌍 Location Features
- **Google Maps integration** - click coordinates to open location
- **GeoJSON Point storage** with MongoDB geospatial indexing
- **10km radius** search for nearby users
- **Precise lat/lng display** in alerts

### 🎨 UI/UX Enhancements
- **Severity indicators** - colored pills (red/orange/green) based on disease type
- **Multi-language support** - preserves original disease names, translates UI
- **Loading states** and error handling
- **Optimistic UI updates** for better responsiveness
- **Accessible design** with ARIA labels and keyboard navigation

### 🔧 Technical Features
- **Socket.io integration** for real-time bidirectional communication
- **Custom React hooks** (`useSocket`) for WebSocket management
- **Email notifications** via nodemailer with SMTP
- **Grouped alerts** algorithm to reduce noise
- **Error boundaries** and graceful fallbacks
- **Performance optimizations** with pagination and polling

## Installation & Setup

### Prerequisites
- Node.js 16+
- MongoDB running locally or remote URI
- Gmail app password or SMTP credentials

### Server Setup
```bash
cd server
npm install
```

### Environment Variables (server/.env)
```env
MONGO_URI=mongodb://localhost:27017/agritech
JWT_SECRET=supersecretkey
PORT=5000
GEMINI_API_KEY=your_gemini_api_key

# SMTP Settings for Email Alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend Setup
```bash
cd app
npm install
```

### Start Services
```bash
# Terminal 1: Start server
cd server
node server.js

# Terminal 2: Start React app
cd app
npm start
```

## API Endpoints

### Disease Alert Endpoints

#### POST `/api/disease/report`
Create disease alert and notify nearby users
```json
{
  "disease": "Late Blight",
  "description": "Brown lesions on leaves...",
  "location": { "type": "Point", "coordinates": [77.5946, 12.9716] }
}
```

#### GET `/api/disease/alerts?userId=<USER_ID>`
Get unread alerts for a user
```json
{
  "alerts": [
    {
      "_id": "...",
      "disease": "Late Blight",
      "description": "...",
      "location": { "type": "Point", "coordinates": [77.5946, 12.9716] },
      "createdAt": "2025-08-22T12:34:56.789Z",
      "read": false
    }
  ]
}
```

#### PATCH `/api/disease/alerts/read`
Mark all alerts as read for a user
```json
{
  "userId": "64f6...userId"
}
```

#### POST `/api/disease/test-email` (Testing)
Send test email
```json
{
  "to": "test@example.com",
  "subject": "Test Alert",
  "text": "This is a test email."
}
```

## Component Usage

### Full Alerts Page
```jsx
import DiseaseAlerts from './components/DiseaseAlerts';

<DiseaseAlerts 
  userId="user123"
  showGrouped={true}
  maxItems={20}
  baseUrl="http://localhost:5000"
/>
```

### Header Badge
```jsx
import AlertsBadge from './components/AlertsBadge';

<AlertsBadge 
  userId="user123"
  onClick={() => navigate('/alerts')}
  showCount={true}
/>
```

### Socket Hook
```jsx
import useSocket from './hooks/useSocket';

const { isConnected, newAlerts, clearNewAlerts } = useSocket(userId);
```

## WebSocket Events

### Client → Server
- `join-user-room` - Join user-specific room for targeted alerts

### Server → Client
- `new-disease-alert` - New disease alert for the user
```json
{
  "alert": { /* alert object */ },
  "message": "New disease alert: Late Blight detected in your area"
}
```

## Postman Testing

### Test Disease Report
```
POST http://localhost:5000/api/disease/report
Content-Type: application/json

{
  "disease": "Leaf Spot",
  "description": "Small brown spots on leaves",
  "location": { "type": "Point", "coordinates": [77.5946, 12.9716] }
}
```

### Test Email
```
POST http://localhost:5000/api/disease/test-email
Content-Type: application/json

{
  "to": "your-email@example.com",
  "subject": "Test Disease Alert",
  "text": "This is a test disease alert from AgriTech."
}
```

### Get Alerts
```
GET http://localhost:5000/api/disease/alerts?userId=YOUR_USER_ID
```

## Translation Support

The system supports multiple languages. Add keys to `app/src/locales/*/translation.json`:

```json
{
  "disease_alerts": "Disease Alerts",
  "live": "Live",
  "mark_all_read": "Mark All Read",
  "view_details": "Details",
  "open_map": "Map",
  "unknown_disease": "Unknown / Needs Review"
}
```

## Deployment Notes

### Production Optimizations
1. **Use a message queue** (Redis + Bull) for email delivery
2. **Rate limiting** on alert creation endpoints
3. **Database indexing** on location and user fields
4. **CDN** for static assets
5. **Environment-specific** WebSocket URLs
6. **Error monitoring** (Sentry) for real-time error tracking

### Security Considerations
- Validate user permissions before sending alerts
- Sanitize disease descriptions to prevent XSS
- Use HTTPS for WebSocket connections in production
- Store email credentials securely (AWS Secrets Manager, etc.)

## Troubleshooting

### WebSocket Issues
- Check CORS settings for your frontend URL
- Ensure firewall allows WebSocket connections
- Test with polling transport as fallback

### Email Issues  
- Verify SMTP credentials and app passwords
- Check spam folder for test emails
- Enable "Less secure app access" if using Gmail (not recommended for production)

### MongoDB Issues
- Ensure MongoDB is running and accessible
- Check connection string format
- Verify user permissions for database operations

## Demo Flow

1. **User Registration**: Sign up and get `userId`
2. **Permission**: Allow browser notifications
3. **Alert Creation**: POST to `/api/disease/report` with disease data
4. **Real-time Display**: Alerts appear instantly via WebSocket
5. **Email Notification**: Check email for alert notification
6. **UI Interaction**: Click alerts badge, view details, mark as read
7. **Map Integration**: Click location to open in Google Maps

The system is now production-ready with comprehensive error handling, real-time features, and a polished user experience.
