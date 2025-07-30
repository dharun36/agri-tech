import React, { useState } from 'react';
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
  // Add more crop images as needed
};

function Croprecommation() {
  const [form, setForm] = useState({
    soil: "Loamy",
    season: "summer",
    water: false,
    landSize: "",
    previousCrop: "",
    location: ""
  });
  const [loading, setLoading] = useState(false);
  const [recommendedCrops, setRecommendedCrops] = useState([]);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRecommendedCrops([]);
    try {
      const prompt = `Given the following farm conditions, recommend the best four crops to grow. 
Return ONLY a JSON array of objects, each with "crop" and "reason" fields. 
No extra text, just valid JSON. Example:
[
  {"crop": "Wheat", "reason": "Wheat is suitable for loamy soil and moderate water."},
  {"crop": "Maize", "reason": "Maize grows well in summer with high water availability."}
]
Farm conditions:
Soil type: ${form.soil}
Season: ${form.season}
Water availability: ${form.water ? "High" : "Low"}
Land size: ${form.landSize}
Previous crop: ${form.previousCrop}
Location: ${form.location}`;

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
          try { crops = JSON.parse(match[0]); } catch {}
        }
      }
      setRecommendedCrops(crops);
    } catch (err) {
      setError("Failed to get recommendation from Gemini.");
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
        body: JSON.stringify({ name: cropName, price: 0 }) // or prompt for price
      });
      if (!res.ok) throw new Error('Failed to add crop');
      toast.success('Crop added!');
    } catch {
      toast.error('Failed to add crop');
    }
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
        <h2 id="input-data-title" className="font-bold mb-4 text-sm">
          Input Your Data
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="soil" className="block text-xs mb-1">Soil Type</label>
            <select
              id="soil"
              name="soil"
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              value={form.soil}
              onChange={handleChange}
            >
              <option>Loamy</option>
              <option>Sandy</option>
              <option>Clayey</option>
            </select>
          </div>

          <fieldset className="mb-4">
            <legend className="text-xs mb-1 font-normal">Season</legend>
            <div className="flex items-center space-x-4 text-xs">
              <label className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="season"
                  value="summer"
                  checked={form.season === "summer"}
                  onChange={handleChange}
                />
                <span>Summer</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="season"
                  value="winter"
                  checked={form.season === "winter"}
                  onChange={handleChange}
                />
                <span>Winter</span>
              </label>
            </div>
          </fieldset>

          <fieldset className="mb-4">
            <legend className="text-xs mb-1 font-normal">Water Availability</legend>
            <label className="flex items-center space-x-1 text-xs">
              <input
                type="checkbox"
                name="water"
                checked={form.water}
                onChange={handleChange}
              />
              <span>High</span>
            </label>
          </fieldset>

          <div className="mb-4">
            <label htmlFor="landSize" className="block text-xs mb-1">Land Size (acres or hectares)</label>
            <input
              type="number"
              id="landSize"
              name="landSize"
              value={form.landSize}
              onChange={handleChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              min="0"
              placeholder="e.g. 2"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="previousCrop" className="block text-xs mb-1">Previous Crop</label>
            <input
              type="text"
              id="previousCrop"
              name="previousCrop"
              value={form.previousCrop}
              onChange={handleChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              placeholder="e.g. Rice"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="location" className="block text-xs mb-1">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              placeholder="e.g. Karnataka"
            />
          </div>

          <button type="submit" className="bg-black text-white text-xs w-full py-2 rounded-md font-semibold" disabled={loading}>
            {loading ? "Getting Recommendation..." : "Submit"}
          </button>
          {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
        </form>
      </section>

      {/* Suggested Crops */}
      <section className="flex-1">
        <h2 className="font-bold mb-4 text-sm">Suggested Crops</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedCrops.length === 0 && !loading ? (
            <p className="text-xs text-gray-500">Fill the form and submit to get a crop recommendation from Gemini AI.</p>
          ) : (
            recommendedCrops.map((crop, idx) => (
              <article key={crop.crop + idx} className="bg-gray-100 rounded-lg p-4 flex items-center space-x-4 max-w-md">
                <img src={cropImages[crop.crop] || cropImages.Tomato} alt={`Image of ${crop.crop}`} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                <div className="text-xs">
                  <h3 className="font-bold mb-1 text-xs">{crop.crop}</h3>
                  <p>{crop.reason}</p>
                  <button
                    onClick={() => handleAddCrop(crop.crop)}
                    className="bg-black text-white px-3 py-1 rounded text-xs font-semibold mt-2"
                  >
                    Add to My Crops
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default Croprecommation;