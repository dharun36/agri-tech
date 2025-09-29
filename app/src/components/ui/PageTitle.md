# Page Title Component

This component is responsible for displaying translated page titles throughout the application.

## Usage

```jsx
import PageTitle from './components/ui/PageTitle';

// Simple usage
<PageTitle pageName="home" />

// With additional styling
<PageTitle pageName="tasks" className="my-custom-class" />
```

## How It Works

- Uses the translation helper functions to get the correct translation key for page titles
- Leverages i18next for multilingual support
- Automatically falls back to a nicely formatted version of the page name if no translation is available
- Can be styled with additional classes

## Supported Pages

The following pages have translations available in all languages:

- Home
- Tasks
- Weather
- Crops
- Disease Detection
- Crop Recommendation
- Task Details
- Add Task
- Crop Details
- Add Crop
- Market Prices
- Government Schemes
- Alerts
- Profile
- Settings
- Help
- About

## Extending

To add a new page title translation:

1. Add the page name to `pageTranslations` object in `translationHelper.js`
2. Add the corresponding translation key to each language's translation.json file under "page_titles" section