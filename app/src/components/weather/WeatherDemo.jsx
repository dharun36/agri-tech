import React from 'react';
import { useTranslation } from 'react-i18next';
import { WeatherWidget, CompactWeatherWidget } from './index';

const WeatherDemo = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Weather Components Demo</h1>
        
        {/* Full Weather Widget */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Full Weather Widget</h2>
          <WeatherWidget 
            className="mb-4"
            showAnalysis={true}
            title="Complete Weather Forecast"
            subtitle="Detailed weather information with AI analysis"
          />
        </div>

        {/* Compact Weather Widget */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Compact Weather Widget</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CompactWeatherWidget 
              showCurrent={true}
              showHourly={true}
              showDaily={true}
            />
            <CompactWeatherWidget 
              showCurrent={true}
              showHourly={false}
              showDaily={true}
            />
            <CompactWeatherWidget 
              showCurrent={true}
              showHourly={true}
              showDaily={false}
            />
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Usage Examples</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Full Weather Widget</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { WeatherWidget } from './components/weather';

<WeatherWidget 
  className="mb-4"
  showAnalysis={true}
  title="Weather Forecast"
  subtitle="Local weather information"
/>`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Compact Weather Widget</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { CompactWeatherWidget } from './components/weather';

<CompactWeatherWidget 
  showCurrent={true}
  showHourly={true}
  showDaily={true}
/>`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Props Available</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">WeatherWidget Props:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li><code>className</code> - Additional CSS classes</li>
                    <li><code>showAnalysis</code> - Show AI weather analysis (default: true)</li>
                    <li><code>compact</code> - Compact mode (default: false)</li>
                    <li><code>title</code> - Custom title</li>
                    <li><code>subtitle</code> - Custom subtitle</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">CompactWeatherWidget Props:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li><code>className</code> - Additional CSS classes</li>
                    <li><code>showCurrent</code> - Show current weather (default: true)</li>
                    <li><code>showHourly</code> - Show hourly forecast (default: true)</li>
                    <li><code>showDaily</code> - Show daily forecast (default: true)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherDemo;
