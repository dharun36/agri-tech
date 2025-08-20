import React, { use, useRef, useState } from 'react'
import { toast } from 'react-toastify';
import dotenv from 'dotenv';
import { useTranslation } from 'react-i18next'
const GEMINI_API_KEY = "AIzaSyAqWH8BEYRNGeO9HNWYaOrVll_c4kaXPHk";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;
const DISEASE_API_URL = "http://127.0.0.1:8000";

function DetectDisease() {
  const { t } = useTranslation();
  const [image, setImage] = useState("https://storage.googleapis.com/a1aa/image/84ab60a5-9190-488e-7e07-7a0015dffdc7.jpg")
  const [analysis, setAnalysis] = useState({
    detected: "Leaf Spot",
    description: "Leaf spot is characterized by small, circular, tan or brown spots on the leaves.",
    treatment: "Use fungicides containing chlorothalonil or copper to treat the affected plants.",
    advice: "Ensure adequate spacing between plants to improve air circulation. Avoid overhead watering to minimize leaf wetness duration."
  })
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null)

  const handleRetake = () => {
    setImage("")
    setAnalysis(null)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        setImage(ev.target.result)
        setLoading(true);
        setError("");

        //get prediction from the disease API
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            body: formData, // Use FormData for file uploads
          });

          if (!res.ok) {
            const errorData = await res.json();
            setError(errorData.detail || "Unknown error");
            return;
          }

          const data = await res.json();
          setAnalysis(data);
          console.log(data);
        } catch (err) {
          setError("Failed to communicate with disease API");
        }


        // Include user's selected language so the AI returns fields in that language
        // and attach the actual image data (base64 data URL) so Gemini can inspect it.
        const imageData = ev.target.result; // data URL produced by readAsDataURL
        const langCode = (localStorage.getItem('i18nextLng') || 'en');
        const userLang = langCode === 'ta' ? 'Tamil' : langCode === 'en' ? 'English' : langCode;
        const prompt = `Respond in ${userLang}. Given the following plant disease image (provided as a base64 data URL), return ONLY a JSON object with these fields: "disease", "description", "treatment", and "advice".
                 No extra text, just valid JSON. Example:\n{\n  "disease": "Leaf Spot",\n  "description": "Leaf spot is characterized by small, circular, tan or brown spots on the leaves.",\n  "advice": 
                 "Ensure adequate spacing between plants to improve air circulation. Avoid overhead watering to minimize leaf wetness duration."\n}\nImage data (base64 data URL): ${imageData}`;
        try {
          const res = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });
          const data = await res.json();
          console.log(data);
          const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          let result = null;
          try {
            result = JSON.parse(geminiText);

          } catch {
            // fallback: try to extract JSON from the response
            const match = geminiText.match(/\{[\s\S]*\}/);
            if (match) {
              try { result = JSON.parse(match[0]); } catch { }
            }
          }
          if (result && result.disease && result.description && result.advice) {
            setAnalysis({
              detected: result.disease,
              description: result.description,
              treatment: result.treatment || "",
              advice: result.advice
            });
            // Notify backend of disease detection for SMS alert
            try {
              // Get user location from localStorage (if stored at signup) or prompt for it
              let userLocation = null;
              const userStr = localStorage.getItem('user');
              if (userStr) {
                const user = JSON.parse(userStr);
                if (user.location && user.location.coordinates) {
                  userLocation = user.location;
                }
              }
              if (!userLocation && navigator.geolocation) {
                await new Promise((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      userLocation = {
                        type: 'Point',
                        coordinates: [pos.coords.longitude, pos.coords.latitude]
                      };
                      resolve();
                    },
                    (err) => resolve()
                  );
                });
              }
              if (userLocation) {
                await fetch('http://localhost:5000/api/disease/report', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    disease: result.disease,
                    description: result.description,
                    location: userLocation
                  })
                });
              }
            } catch (e) {
              // Ignore notification errors for now
            }
          } else {
            setError("Invalid response from Gemini.");
            toast.error("Invalid response from Gemini.");
          }
        } catch (err) {
          setError("Failed to get analysis from Gemini.");
          toast.error("Failed to get analysis from Gemini.");
        } finally {
          setLoading(false);
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
      {/* Disease Detection Section */}
      <section className="bg-gray-50 rounded-lg p-6 text-center">
        <h1 className="text-black mb-4">{t('disease_detection')}</h1>
        {image ? (
          <img
            src={image}
            alt="Uploaded or sample leaf"
            className="mx-auto rounded-md"
            width="300"
            height="200"
          />
        ) : (
          <div className="w-[300px] h-[200px] mx-auto flex items-center justify-center bg-gray-200 rounded-md text-xs text-gray-500">
            {t('no_image_selected')}
          </div>
        )}
        <div className="mt-4 flex justify-center space-x-3">
          <button
            className="bg-white border border-gray-300 text-xs text-black rounded px-3 py-1"
            type="button"
            onClick={handleRetake}
            disabled={!image}
          >
            {t('retake_photo')}
          </button>
          <button
            className="bg-black text-white text-xs font-semibold rounded px-3 py-1"
            type="button"
            onClick={handleUploadClick}
          >
            {t('upload_new_image')}
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </section>

      {/* AI Analysis Section */}
      <section className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="text-black text-sm font-normal"><strong>{t('ai_analysis_results')}</strong></div>
        <div className="w-full h-full p-3 py-5 resize-none bg-gray-100 text-xs rounded">
          <strong>{t('disease_detected')} :</strong>
          {loading ? t('analyzing') :
            analysis
              ? ` ${analysis.detected}`
              : ""}
          <br />
          <br />
          <strong>{t('description')} :</strong>{loading ? t('analyzing') :
            analysis
              ? ` ${analysis.description}\n`
              : ""}
          <br />
          <br />

          <strong>{t('treatment')} :</strong>
          {loading ? t('analyzing') :
            analysis
              ? ` ${analysis.treatment}`
              : ""}

        </div>
        <div className="bg-gray-200 rounded-md p-3 text-xs text-black text-left">
          <strong>{t('advice')}</strong>
          <br />
          {loading ? t('analyzing') : analysis ? analysis.advice : ""}
        </div>
        {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
      </section>
    </main>
  )
}

export default DetectDisease
