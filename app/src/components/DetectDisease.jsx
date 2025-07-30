import React, { useRef, useState } from 'react'
import { toast } from 'react-toastify';

const GEMINI_API_KEY = "AIzaSyAqWH8BEYRNGeO9HNWYaOrVll_c4kaXPHk";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;

function DetectDisease() {
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
        // Use file name as context for now
        const prompt = `Given the following plant disease image context, return ONLY a JSON object with these fields: "disease", "description", and "advice". No extra text, just valid JSON. Example:\n{\n  "disease": "Leaf Spot",\n  "description": "Leaf spot is characterized by small, circular, tan or brown spots on the leaves.",\n  "advice": "Ensure adequate spacing between plants to improve air circulation. Avoid overhead watering to minimize leaf wetness duration."\n}\nImage context: ${file.name}`;
        try {
          const res = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });
          const data = await res.json();
          const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          let result = null;
          try {
            result = JSON.parse(geminiText);
          } catch {
            // fallback: try to extract JSON from the response
            const match = geminiText.match(/\{[\s\S]*\}/);
            if (match) {
              try { result = JSON.parse(match[0]); } catch {}
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
        <h1 className="text-black mb-4">Disease Detection</h1>
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
            No image selected
          </div>
        )}
        <div className="mt-4 flex justify-center space-x-3">
          <button
            className="bg-white border border-gray-300 text-xs text-black rounded px-3 py-1"
            type="button"
            onClick={handleRetake}
            disabled={!image}
          >
            Retake Photo
          </button>
          <button
            className="bg-black text-white text-xs font-semibold rounded px-3 py-1"
            type="button"
            onClick={handleUploadClick}
          >
            Upload New Image
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
        <div className="text-black text-sm font-normal">AI Analysis Results</div>
        <div className="w-full h-full p-3 py-5 resize-none bg-gray-100 text-xs rounded p-1">
        <strong>Disease Detected :</strong>
            {loading ? "Analyzing..." :
              analysis
                ? ` ${analysis.detected}\nDescription: ${analysis.description}\n`
                : ""}
        <br />
        <strong>Treatment :</strong>
        {loading ? "Analyzing..." :
              analysis
                ? ` ${analysis.treatment}`
                : ""}
          
        </div>
        <div className="bg-gray-200 rounded-md p-3 text-xs text-black text-left">
          <strong>Advice</strong>
          <br />
          {loading ? "Analyzing..." : analysis ? analysis.advice : ""}
        </div>
        {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
      </section>
    </main>
  )
}

export default DetectDisease