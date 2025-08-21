import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GEMINI_API_KEY = "AIzaSyAqWH8BEYRNGeO9HNWYaOrVll_c4kaXPHk";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;

const cropImages = {
  Wheat: "https://storage.googleapis.com/a1aa/image/18887521-1e5e-44ed-dfda-46e29786e047.jpg",
  Sunflower: "https://storage.googleapis.com/a1aa/image/5d18369a-7b6e-4396-fc31-2e2802e56bbf.jpg",
  Corn: "https://storage.googleapis.com/a1aa/image/bed40549-75b4-4747-23ad-ca7adbbfcec9.jpg",
  Rice: "https://storage.googleapis.com/a1aa/image/dfacf51c-4439-49db-e185-fc674bf808d5.jpg",
  Tomato: "https://storage.googleapis.com/a1aa/image/66694345-5244-4928-8654-e7bf1554898a.jpg",
  Maize: "https://storage.googleapis.com/a1aa/image/bed40549-75b4-4747-23ad-ca7adbbfcec9.jpg",
  Cotton: "https://storage.googleapis.com/a1aa/image/cotton-field.jpg",
  Sugarcane: "https://storage.googleapis.com/a1aa/image/sugarcane-field.jpg",
  Potato: "https://storage.googleapis.com/a1aa/image/potato-field.jpg",
  Onion: "https://storage.googleapis.com/a1aa/image/onion-field.jpg"
};

function Croprecommation() {
  const { t } = useTranslation()

  // Toggle between basic and detailed forms
  const [formType, setFormType] = useState('basic');

  // Basic form state
  const [basicForm, setBasicForm] = useState({
    soil: "Loamy",
    season: "summer",
    water: false,
    landSize: "",
    previousCrop: "",
    location: ""
  });

  // Detailed form state
  const [detailedForm, setDetailedForm] = useState({
    soil: "Loamy",
    season: "summer",
    location: "",
    landSize: "",

    // Soil composition
    phLevel: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    organicMatter: "",
    soilMoisture: "",
    soilDepth: "",
    drainage: "good",

    // Climate data
    rainfall: "",
    minTemp: "",
    maxTemp: "",

    // Irrigation and farming history
    irrigationType: "drip",
    cropHistory: {
      year1: "",
      year2: "",
      year3: ""
    },
    fertilizerUsed: "organic"
  });

  const [loading, setLoading] = useState(false);
  const [recommendedCrops, setRecommendedCrops] = useState([]);
  const [error, setError] = useState("");

  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBasicForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleDetailedChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('cropHistory.')) {
      const year = name.split('.')[1];
      setDetailedForm(prev => ({
        ...prev,
        cropHistory: {
          ...prev.cropHistory,
          [year]: value
        }
      }));
    } else {
      setDetailedForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const getDetailedPrompt = () => {
    const langCode = (localStorage.getItem('i18nextLng') || 'en');
    const userLang = langCode === 'ta' ? 'Tamil' : langCode === 'en' ? 'English' : langCode;

    return `You must respond entirely in ${userLang} language. Based on the comprehensive soil and environmental analysis below, recommend the top 5 most suitable crops with detailed scientific reasoning. You must respond entirely in ${userLang} language.

SOIL ANALYSIS DATA:
- Soil Type: ${detailedForm.soil}
- pH Level: ${detailedForm.phLevel}
- NPK Content: N-${detailedForm.nitrogen}%, P-${detailedForm.phosphorus}%, K-${detailedForm.potassium}%
- Organic Matter: ${detailedForm.organicMatter}%
- Soil Moisture: ${detailedForm.soilMoisture}%
- Soil Depth: ${detailedForm.soilDepth}cm
- Drainage: ${detailedForm.drainage}
- Location: ${detailedForm.location}
- Land Size: ${detailedForm.landSize} acres

CLIMATE DATA:
- Season: ${detailedForm.season}
- Annual Rainfall: ${detailedForm.rainfall}mm
- Temperature Range: ${detailedForm.minTemp}°C to ${detailedForm.maxTemp}°C

FARMING INFRASTRUCTURE:
- Irrigation Type: ${detailedForm.irrigationType}
- Previous Fertilizer: ${detailedForm.fertilizerUsed}

CROP ROTATION HISTORY:
- Year 1: ${detailedForm.cropHistory.year1}
- Year 2: ${detailedForm.cropHistory.year2}
- Year 3: ${detailedForm.cropHistory.year3}

Return ONLY a JSON array of 5 crop recommendations in ${userLang}, each with:
- "crop": crop name in ${userLang}
- "reason": detailed scientific explanation in ${userLang} covering soil compatibility, nutrient requirements, climate suitability, and expected yield
- "soilMatch": percentage match with current soil conditions
- "expectedYield": estimated yield per acre
- "season": best planting season
- "waterNeeds": water requirement level (High/Medium/Low)

Example format:
[
  {
    "crop": "crop name in ${userLang}",
    "reason": "detailed scientific explanation in ${userLang}",
    "soilMatch": "85%",
    "expectedYield": "2-3 tons/acre",
    "season": "Kharif/Rabi",
    "waterNeeds": "Medium"
  }
]

You must respond entirely in ${userLang} language. No English text should appear in the response.`;
  };

  const getBasicPrompt = () => {
    const langCode = (localStorage.getItem('i18nextLng') || 'en');
    const userLang = langCode === 'ta' ? 'Tamil' : langCode === 'en' ? 'English' : langCode;

    return `You must respond entirely in ${userLang} language. Given the following farm conditions, recommend the best four crops to grow. 
Return ONLY a JSON array of objects, each with "crop" and "reason" fields in ${userLang}. 
You must respond entirely in ${userLang} language. No English text should appear in the response.

Farm conditions:
Soil type: ${basicForm.soil}
Season: ${basicForm.season}
Water availability: ${basicForm.water ? "High" : "Low"}
Land size: ${basicForm.landSize}
Previous crop: ${basicForm.previousCrop}
Location: ${basicForm.location}

Example format:
[
  {"crop": "crop name in ${userLang}", "reason": "explanation in ${userLang}"},
  {"crop": "crop name in ${userLang}", "reason": "explanation in ${userLang}"}
]`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRecommendedCrops([]);

    try {
      const prompt = formType === 'detailed' ? getDetailedPrompt() : getBasicPrompt();

      const res = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await res.json();
      const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      let crops = [];
      try {
        crops = JSON.parse(geminiText);
      } catch {
        // fallback: try to extract JSON from the response
        const match = geminiText.match(/\[.*\]/s);
        if (match) {
          try {
            crops = JSON.parse(match[0]);
          } catch {
            setError("Failed to parse recommendation data");
            return;
          }
        } else {
          setError("Failed to get valid recommendation format");
          return;
        }
      }

      setRecommendedCrops(crops);
    } catch (err) {
      setError("Failed to get recommendation from AI service.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCrop = async (cropName) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/crops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: cropName, price: 0 })
      });
      if (!res.ok) throw new Error('Failed to add crop');
      toast.success(t('add_crop_success'));
    } catch {
      toast.error(t('add_crop_failed'));
    }
  };

  const renderBasicForm = () => (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="soil" className="block text-xs mb-1">{t('soil_type')}</label>
        <select
          id="soil"
          name="soil"
          className="w-full text-xs rounded border border-gray-300 px-2 py-1"
          value={basicForm.soil}
          onChange={handleBasicChange}
        >
          <option>{t('loamy')}</option>
          <option>{t('sandy')}</option>
          <option>{t('clay')}</option>
          <option>{t('black_cotton')}</option>
          <option>{t('red_soil')}</option>
          <option>{t('aluvi')}</option>
        </select>
      </div>

      <fieldset className="mb-4">
        <legend className="text-xs mb-1 font-normal">{t('season')}</legend>
        <div className="flex items-center space-x-4 text-xs">
          <label className="flex items-center space-x-1">
            <input
              type="radio"
              name="season"
              value="summer"
              checked={basicForm.season === "summer"}
              onChange={handleBasicChange}
            />
            <span>{t('summer')}</span>
          </label>
          <label className="flex items-center space-x-1">
            <input
              type="radio"
              name="season"
              value="winter"
              checked={basicForm.season === "winter"}
              onChange={handleBasicChange}
            />
            <span>{t('winter')}</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="mb-4">
        <legend className="text-xs mb-1 font-normal">{t('water_availability')}</legend>
        <label className="flex items-center space-x-1 text-xs">
          <input
            type="checkbox"
            name="water"
            checked={basicForm.water}
            onChange={handleBasicChange}
          />
          <span>{t('high')}</span>
        </label>
      </fieldset>

      <div className="mb-4">
        <label htmlFor="landSize" className="block text-xs mb-1">{t('land_size')}</label>
        <input
          type="number"
          id="landSize"
          name="landSize"
          value={basicForm.landSize}
          onChange={handleBasicChange}
          className="w-full text-xs rounded border border-gray-300 px-2 py-1"
          min="0"
          placeholder="e.g. 2"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="previousCrop" className="block text-xs mb-1">{t('previous_crop')}</label>
        <input
          type="text"
          id="previousCrop"
          name="previousCrop"
          value={basicForm.previousCrop}
          onChange={handleBasicChange}
          className="w-full text-xs rounded border border-gray-300 px-2 py-1"
          placeholder="e.g. Rice"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="location" className="block text-xs mb-1">{t('location_label')}</label>
        <input
          type="text"
          id="location"
          name="location"
          value={basicForm.location}
          onChange={handleBasicChange}
          className="w-full text-xs rounded border border-gray-300 px-2 py-1"
          placeholder="e.g. Karnataka"
        />
      </div>

      <button type="submit" className="bg-black text-white text-xs w-full py-2 rounded-md font-semibold" disabled={loading}>
        {loading ? t('getting_recommendation') : t('submit')}
      </button>
    </form>
  );

  const renderDetailedForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Information */}
      <div className="bg-white p-4 rounded border">
        <h3 className="font-semibold text-s mb-3 text-black">{t('basic_information')}</h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label htmlFor="soil" className="block text-xs mb-1">{t('soil_type')}</label>
            <select
              id="soil"
              name="soil"
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              value={detailedForm.soil}
              onChange={handleDetailedChange}
            >
              <option>Loamy</option>
              <option>Sandy</option>
              <option>Clayey</option>
              <option>Black Cotton</option>
              <option>Red</option>
              <option>Alluvial</option>
            </select>
          </div>

          <div>
            <label htmlFor="season" className="block text-xs mb-1">{t('season')}</label>
            <select
              id="season"
              name="season"
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              value={detailedForm.season}
              onChange={handleDetailedChange}
            >
              <option value="summer">{t('summer')}</option>
              <option value="winter">{t('winter')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="landSize" className="block text-xs mb-1">{t('land_size')}</label>
            <input
              type="number"
              id="landSize"
              name="landSize"
              value={detailedForm.landSize}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              min="0"
              placeholder="e.g. 2"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-xs mb-1">{t('location_label')}</label>
            <input
              type="text"
              id="location"
              name="location"
              value={detailedForm.location}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              placeholder="e.g. Karnataka"
            />
          </div>
        </div>
      </div>

      {/* Soil Composition */}
      <div className="bg-white p-4 rounded border">
        <h3 className="font-semibold text-s mb-3 text-black">{t('soil_composition')}</h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label htmlFor="phLevel" className="block text-xs mb-1">{t('ph_level')}</label>
            <input
              type="number"
              id="phLevel"
              name="phLevel"
              value={detailedForm.phLevel}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              min="0"
              max="14"
              step="0.1"
              placeholder={t('soil_ph_placeholder')}
            />
          </div>

          <div>
            <label htmlFor="organicMatter" className="block text-xs mb-1">{t('organic_matter')}</label>
            <input
              type="number"
              id="organicMatter"
              name="organicMatter"
              value={detailedForm.organicMatter}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              min="0"
              max="100"
              step="0.1"
              placeholder={t('organic_matter_placeholder')}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label htmlFor="nitrogen" className="block text-xs mb-1">{t('nitrogen_content')}</label>
            <input
              type="number"
              id="nitrogen"
              name="nitrogen"
              value={detailedForm.nitrogen}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              min="0"
              max="100"
              step="0.1"
              placeholder={t('nitrogen_placeholder')}
            />
          </div>

          <div>
            <label htmlFor="phosphorus" className="block text-xs mb-1">{t('phosphorus_content')}</label>
            <input
              type="number"
              id="phosphorus"
              name="phosphorus"
              value={detailedForm.phosphorus}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              min="0"
              max="100"
              step="0.1"
              placeholder={t('phosphorus_placeholder')}
            />
          </div>

          <div>
            <label htmlFor="potassium" className="block text-xs mb-1">{t('potassium_content')}</label>
            <input
              type="number"
              id="potassium"
              name="potassium"
              value={detailedForm.potassium}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              min="0"
              max="100"
              step="0.1"
              placeholder={t('potassium_placeholder')}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="soilMoisture" className="block text-xs mb-1">{t('soil_moisture')}</label>
            <input
              type="number"
              id="soilMoisture"
              name="soilMoisture"
              value={detailedForm.soilMoisture}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              min="0"
              max="100"
              step="0.1"
              placeholder={t('moisture_placeholder')}
            />
          </div>

          <div>
            <label htmlFor="soilDepth" className="block text-xs mb-1">{t('soil_depth')}</label>
            <input
              type="number"
              id="soilDepth"
              name="soilDepth"
              value={detailedForm.soilDepth}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              min="0"
              placeholder={t('depth_placeholder')}
            />
          </div>

          <div>
            <label htmlFor="drainage" className="block text-xs mb-1">{t('drainage')}</label>
            <select
              id="drainage"
              name="drainage"
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              value={detailedForm.drainage}
              onChange={handleDetailedChange}
            >
              <option value="good">{t('good_drainage')}</option>
              <option value="moderate">{t('moderate_drainage')}</option>
              <option value="poor">{t('poor_drainage')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Climate Data */}
      <div className="bg-white p-4 rounded border">
        <h3 className="font-semibold text-s mb-3 text-black">{t('temperature_range')}</h3>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="rainfall" className="block text-xs mb-1">{t('rainfall_annual')}</label>
            <input
              type="number"
              id="rainfall"
              name="rainfall"
              value={detailedForm.rainfall}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              min="0"
              placeholder={t('rainfall_placeholder')}
            />
          </div>

          <div>
            <label htmlFor="minTemp" className="block text-xs mb-1">{t('min_temperature')}</label>
            <input
              type="number"
              id="minTemp"
              name="minTemp"
              value={detailedForm.minTemp}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              placeholder="e.g. 15"
            />
          </div>

          <div>
            <label htmlFor="maxTemp" className="block text-xs mb-1">{t('max_temperature')}</label>
            <input
              type="number"
              id="maxTemp"
              name="maxTemp"
              value={detailedForm.maxTemp}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              placeholder="e.g. 35"
            />
          </div>
        </div>
      </div>

      {/* Irrigation & Farming History */}
      <div className="bg-white p-4 rounded border">
        <h3 className="font-semibold text-s mb-3 text-black">{t('farming_infrastructure')}</h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label htmlFor="irrigationType" className="block text-xs mb-1">{t('irrigation_type')}</label>
            <select
              id="irrigationType"
              name="irrigationType"
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              value={detailedForm.irrigationType}
              onChange={handleDetailedChange}
            >
              <option value="drip">{t('drip_irrigation')}</option>
              <option value="sprinkler">{t('sprinkler_irrigation')}</option>
              <option value="flood">{t('flood_irrigation')}</option>
              <option value="rainfed">{t('rainfed')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="fertilizerUsed" className="block text-xs mb-1">{t('fertilizer_used')}</label>
            <select
              id="fertilizerUsed"
              name="fertilizerUsed"
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              value={detailedForm.fertilizerUsed}
              onChange={handleDetailedChange}
            >
              <option value="organic">{t('organic_fertilizer')}</option>
              <option value="chemical">{t('chemical_fertilizer')}</option>
              <option value="mixed">{t('mixed_fertilizer')}</option>
              <option value="none">{t('no_fertilizer')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs mb-2">{t('crop_history')}</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              name="cropHistory.year1"
              value={detailedForm.cropHistory.year1}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              placeholder={t('year_1')}
            />
            <input
              type="text"
              name="cropHistory.year2"
              value={detailedForm.cropHistory.year2}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              placeholder={t('year_2')}
            />
            <input
              type="text"
              name="cropHistory.year3"
              value={detailedForm.cropHistory.year3}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              placeholder={t('year_3')}
            />
          </div>
        </div>
      </div>

      <button type="submit" className="bg-black text-white text-xs w-full py-3 rounded-md font-semibold" disabled={loading}>
        {loading ? t('analyzing_soil') : t('analyze_soil')}
      </button>
    </form>
  );

  const renderCropCard = (crop, idx) => {
    const isDetailed = formType === 'detailed';

    return (
      <article key={crop.crop + idx} className={`bg-gray-100 rounded-lg p-4 ${isDetailed ? 'space-y-3' : 'flex items-center space-x-4'} max-w-md`}>
        {!isDetailed && (
          <img
            src={cropImages[crop.crop] || cropImages.Tomato}
            alt={`Image of ${crop.crop}`}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
          />
        )}

        <div className="text-xs">
          <h3 className="font-bold mb-1 text-xs">{crop.crop}</h3>
          <p className="mb-2">{crop.reason}</p>

          {isDetailed && (
            <div className="grid grid-cols-2 gap-2 mb-2 text-xs bg-white p-2 rounded">
              {crop.soilMatch && <div><strong>Soil Match:</strong> {crop.soilMatch}</div>}
              {crop.expectedYield && <div><strong>Expected Yield:</strong> {crop.expectedYield}</div>}
              {crop.season && <div><strong>Season:</strong> {crop.season}</div>}
              {crop.waterNeeds && <div><strong>Water Needs:</strong> {crop.waterNeeds}</div>}
            </div>
          )}

          <button
            onClick={() => handleAddCrop(crop.crop)}
            className="bg-black text-white px-3 py-1 rounded text-xs font-semibold"
          >
            {t('add_to_my_crops')}
          </button>
        </div>
      </article>
    );
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="!bg-black !text-white"
        bodyClassName="!text-white"
      />

      {/* Input Section */}
      <section
        aria-labelledby="input-data-title"
        className="bg-gray-100 rounded-lg p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="input-data-title" className="font-bold text-sm">
            {t('input_your_data')}
          </h2>

          {/* Form Type Toggle */}
          <div className="flex space-x-1 bg-white rounded p-1">
            <button
              type="button"
              onClick={() => setFormType('basic')}
              className={`px-2 py-1 text-xs rounded ${formType === 'basic'
                ? 'bg-black text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {t('basic_form')}
            </button>
            <button
              type="button"
              onClick={() => setFormType('detailed')}
              className={`px-2 py-1 text-xs rounded ${formType === 'detailed'
                ? 'bg-black text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {t('detailed_form')}
            </button>
          </div>
        </div>

        {formType === 'basic' ? renderBasicForm() : renderDetailedForm()}

        {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
      </section>

      {/* Suggested Crops */}
      <section className="flex-1">
        <h2 className="font-bold mb-4 text-sm">
          {formType === 'detailed' ? t('soil_recommendations') : t('suggested_crops')}
        </h2>

        <div className={`grid ${formType === 'detailed' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
          {recommendedCrops.length === 0 && !loading ? (
            <p className="text-xs text-gray-500">{t('fill_form_prompt')}</p>
          ) : (
            recommendedCrops.map((crop, idx) => renderCropCard(crop, idx))
          )}
        </div>
      </section>
    </main>
  );
}

export default Croprecommation;