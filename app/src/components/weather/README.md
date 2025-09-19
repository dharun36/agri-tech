# Weather Components

This directory contains reusable weather components extracted from the original Home.jsx weather widget. These components can be used anywhere in your application to display weather information.

## Components

### 1. WeatherWidget
A full-featured weather component with hourly and daily forecasts, plus AI weather analysis.

**Features:**
- Current weather display
- 24-hour hourly forecast
- 7-day daily forecast
- AI-powered weather analysis
- Loading and error states
- Customizable title and subtitle

**Usage:**
```jsx
import { WeatherWidget } from './components/weather';

<WeatherWidget 
  className="mb-4"
  showAnalysis={true}
  title="Weather Forecast"
  subtitle="Local weather information"
/>
```

**Props:**
- `className` (string): Additional CSS classes
- `showAnalysis` (boolean): Show AI weather analysis (default: true)
- `compact` (boolean): Compact mode (default: false)
- `title` (string): Custom title (default: uses translation)
- `subtitle` (string): Custom subtitle (default: uses translation)

### 2. CompactWeatherWidget
A compact weather component for smaller spaces like sidebars or cards.

**Features:**
- Current weather display
- 6-hour hourly forecast (optional)
- 3-day daily forecast (optional)
- Configurable sections
- Responsive design

**Usage:**
```jsx
import { CompactWeatherWidget } from './components/weather';

<CompactWeatherWidget 
  showCurrent={true}
  showHourly={true}
  showDaily={true}
/>
```

**Props:**
- `className` (string): Additional CSS classes
- `showCurrent` (boolean): Show current weather (default: true)
- `showHourly` (boolean): Show hourly forecast (default: true)
- `showDaily` (boolean): Show daily forecast (default: true)

## Demo Page

Visit `/weather-demo` to see both components in action with different configurations.

## Data Source

Both components use the OpenMeteo API (free weather service) and require the `VITE_WEATHER_API_KEY` environment variable to be set.

## Styling

The components use Tailwind CSS classes and are designed to match your application's design system. They include:
- Responsive design
- Hover effects
- Loading states
- Error states
- Consistent spacing and typography

## Integration Examples

### In a Dashboard
```jsx
import { WeatherWidget } from './components/weather';

const Dashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <WeatherWidget />
      {/* Other dashboard components */}
    </div>
  );
};
```

### In a Sidebar
```jsx
import { CompactWeatherWidget } from './components/weather';

const Sidebar = () => {
  return (
    <div className="space-y-4">
      <CompactWeatherWidget />
      {/* Other sidebar components */}
    </div>
  );
};
```

### In a Card Layout
```jsx
import { CompactWeatherWidget } from './components/weather';

const CardGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CompactWeatherWidget showHourly={false} />
      <CompactWeatherWidget showDaily={false} />
      <CompactWeatherWidget showCurrent={false} />
    </div>
  );
};
```

## Customization

Both components can be customized through props and CSS classes. The weather data structure is consistent across both components, making it easy to switch between them or create your own variations.

## Dependencies

- React
- React Icons (FaCloudSun, FaDroplet, FaWind)
- FontAwesome Icons
- React i18next (for translations)
- WeatherAnalysis component (for AI analysis)
