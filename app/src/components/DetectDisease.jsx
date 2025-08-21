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
        const imageDataUrl = ev.target.result
        setImage(imageDataUrl)
        setLoading(true);
        setError("");

        // get prediction from the disease API
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            body: formData, // Use FormData for file uploads
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            setError(errorData.detail || "Unknown error from prediction API");
            setLoading(false);
            return;
          }

          const pred = await res.json();
          // pred expected shape: { class_name, class_index, confidence }
          const predictedClass = pred.class_name || pred.className || pred.detected || "Unknown";

          // show immediate minimal prediction
          setAnalysis({
            detected: predictedClass,
            description: pred.description || "",
            treatment: pred.treatment || "",
            advice: pred.advice || ""
          });

          // Prepare language and prompt for Gemini — include the image URL (data URL) and the model classname
          const langCode = (localStorage.getItem('i18nextLng') || 'en');
          const userLang = langCode === 'ta' ? 'Tamil' : langCode === 'en' ? 'English' : langCode;

          const prompt = `You must respond entirely in ${userLang} language. Given the plant disease prediction "${predictedClass}", provide detailed information about this disease. All text content including disease name, description, treatment, and advice must be written in ${userLang}. Return ONLY a JSON object with these fields: "disease", "description", "treatment", and "advice". All field values must be in ${userLang} language. No extra text, just valid JSON with ${userLang} content.`;

          // Call Gemini with prompt
          try {
            const gRes = await fetch(GEMINI_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
              })
            });

            if (!gRes.ok) {
              const text = await gRes.text().catch(() => '');
              throw new Error(`Gemini API error ${gRes.status}: ${text}`);
            }

            const gData = await gRes.json();
            const geminiText = gData.candidates?.[0]?.content?.parts?.[0]?.text || "";

            let result = null;
            try {
              result = JSON.parse(geminiText);
            } catch {
              const match = geminiText.match(/\{[\s\S]*\}/);
              if (match) {
                try { result = JSON.parse(match[0]); } catch { result = null }
              }
            }

            if (result && result.disease) {
              setAnalysis({
                detected: result.disease,
                description: result.description || "",
                treatment: result.treatment || "",
                advice: result.advice || ""
              });

              // Optionally notify backend of disease detection
              try {
                let userLocation = null;
                const userStr = localStorage.getItem('user');
                if (userStr) {
                  const user = JSON.parse(userStr);
                  if (user.location && user.location.coordinates) {
                    userLocation = user.location;
                  }
                }
                if (!userLocation && navigator.geolocation) {
                  await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        userLocation = {
                          type: 'Point',
                          coordinates: [pos.coords.longitude, pos.coords.latitude]
                        };
                        resolve();
                      },
                      () => resolve()
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
              } catch (notifErr) {
                // ignore notification errors
              }

            } else {
              setError("Invalid response from Gemini.");
              toast.error("Invalid response from Gemini.");
            }

          } catch (gemErr) {
            console.error(gemErr);
            setError("Failed to get analysis from Gemini.");
            toast.error("Failed to get analysis from Gemini.");
          }

        } catch (err) {
          console.error(err);
          setError("Failed to communicate with disease API");
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
