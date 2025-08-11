import React, { useState } from 'react';

const GEMINI_API_KEY = "AIzaSyAqWH8BEYRNGeO9HNWYaOrVll_c4kaXPHk";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;

const WeatherAnalysis = ({ weather, daily, formatDay, getWeatherDesc }) => {
  const [weatherAnalysis, setWeatherAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Weather Analysis Function
  const analyzeWeather = async () => {
    if (!weather) return;

    setAnalysisLoading(true);
    setAnalysisError(null);

    const prompt = `You are a great and knowledgeable farming assistant. 
    Given the following weather data. Return ONLY a JSON object with these fields: "advice",
    "irrigation_tips". Keep each field to maximum 2 sentences.

    Weather data: ${JSON.stringify({
      temperature: weather.temp,
      description: weather.desc,
      humidity: weather.humidity,
      time: weather.time,
      daily_forecast: daily.slice(0, 3).map(d => ({
        day: formatDay(d.time),
        temp_max: d.values.temperatureMax,
        temp_min: d.values.temperatureMin,
        weather: getWeatherDesc(d.values.weatherCodeMax),
        precipitation: d.values.precipitationSum || 0
      }))
    })}

    Provide brief advice on: wheather to irrigate or not and watering needs only.`;

    try {
      const res = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      let result = null;
      try {
        result = JSON.parse(geminiText);
      } catch {
        // fallback: try to extract JSON from the response
        const match = geminiText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            result = JSON.parse(match[0]);
          } catch {
            throw new Error('Invalid response format');
          }
        } else {
          throw new Error('No valid JSON found in response');
        }
      }

      if (result && result.advice) {
        setWeatherAnalysis(result);
      } else {
        throw new Error('Invalid analysis format');
      }
    } catch (err) {
      setAnalysisError(err.message || 'Failed to analyze weather');
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Helper function to render complex field values
  const renderField = (value) => {
    if (typeof value === 'string') {
      return <p className="text-gray-600">{value}</p>;
    } else if (typeof value === 'object' && value !== null) {
      return (
        <div className="ml-4 space-y-1">
          {Object.entries(value).map(([key, val]) => (
            <div key={key}>
              <span className="font-medium text-gray-700 capitalize">
                {key.replace(/_/g, ' ')}:
              </span>
              <p className="text-gray-600 ml-2">{String(val)}</p>
            </div>
          ))}
        </div>
      );
    }
    return <p className="text-gray-600">{String(value)}</p>;
  };

  const buttonStyle = "bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-2 rounded-lg shadow hover:from-green-500 hover:to-green-700 transition font-semibold flex items-center gap-2";

  return (
    <div>
      {/* Weather Analysis Button */}
      <div className="mt-4">
        <button
          onClick={analyzeWeather}
          disabled={analysisLoading}
          className={`${buttonStyle} w-full justify-center ${analysisLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {analysisLoading ? 'Analyzing...' : 'Get Weather Analysis'}
        </button>
      </div>

      {/* Weather Analysis Results */}
      {weatherAnalysis && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Weather Analysis</h3>
          <div className="space-y-3 text-sm">
            {weatherAnalysis.advice && (
              <div>
                <span className="font-medium text-gray-700">Current Conditions:</span>
                {renderField(weatherAnalysis.advice)}
              </div>
            )}
            {weatherAnalysis.irrigation_tips && (
              <div>
                <span className="font-medium text-blue-700">Watering Advice:</span>
                {renderField(weatherAnalysis.irrigation_tips)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysis Error */}
      {analysisError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm text-red-600">{analysisError}</span>
        </div>
      )}
    </div>
  );
};

export default WeatherAnalysis;
