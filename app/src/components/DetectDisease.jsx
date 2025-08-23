import React, { use, useRef, useState } from 'react'
import { toast } from 'react-toastify';
import dotenv from 'dotenv';
import { useTranslation } from 'react-i18next'
const GEMINI_API_KEY = "AIzaSyAqWH8BEYRNGeO9HNWYaOrVll_c4kaXPHk";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;
const DISEASE_API_URL = "http://127.0.0.1:8000";

function DetectDisease() {
  const { t } = useTranslation();
  const [image, setImage] = useState("")
  const [analysis, setAnalysis] = useState({
    detected: "",
    description: "",
    treatment: "",
    advice: ""
  })
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSpreadable, setIsSpreadable] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null); // Store bilingual data
  const [locationType, setLocationType] = useState('current'); // 'current' or 'field'
  const fileInputRef = useRef(null)

  const handleRetake = () => {
    setImage("")
    setAnalysis(null)
    setAnalysisData(null)
    setIsSpreadable(false)
    setError("")
    setLocationType('current')
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Function to update display when language changes
  const updateDisplayLanguage = () => {
    if (analysisData) {
      const langCode = (localStorage.getItem('i18nextLng') || 'en');
      const currentLang = langCode === 'ta' ? 'tamil' : 'english';
      const displayData = analysisData[currentLang];

      setAnalysis({
        detected: displayData.disease,
        description: displayData.description || "",
        treatment: displayData.treatment || "",
        advice: displayData.advice || ""
      });
    }
  }

  // Update display when component mounts or language changes
  React.useEffect(() => {
    updateDisplayLanguage();
  }, [analysisData, localStorage.getItem('i18nextLng')])

  const handleReportIssue = async () => {
    if (!analysis || !isSpreadable) return;

    setReportLoading(true);
    try {
      let userLocation = null;

      if (locationType === 'field') {
        // Get user's field location from localStorage
        try {
          const userLocationStr = localStorage.getItem('userLocation');
          console.log('UserLocation from localStorage:', userLocationStr);

          if (userLocationStr) {
            const storedLocation = JSON.parse(userLocationStr);
            console.log('Parsed location:', storedLocation);

            if (storedLocation && storedLocation.type === 'Point' && Array.isArray(storedLocation.coordinates)) {
              userLocation = storedLocation;
              console.log('Field location found:', userLocation);
            } else {
              console.log('Invalid location format:', storedLocation);
              toast.error(t('field_location_not_set') || 'Field location not set in your profile. Please update your profile first.');
              setReportLoading(false);
              return;
            }
          } else {
            console.log('No field location found in localStorage');
            toast.error(t('field_location_not_set') || 'Field location not set in your profile. Please update your profile first.');
            setReportLoading(false);
            return;
          }
        } catch (parseError) {
          console.error('Error parsing user location:', parseError);
          toast.error(t('error_fetching_field_location') || 'Error fetching field location. Please try current location instead.');
          setReportLoading(false);
          return;
        }
      } else {
        // Use current GPS location
        if (navigator.geolocation) {
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
      }

      if (userLocation) {
        const response = await fetch('http://localhost:5000/api/disease/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            disease: analysis.detected,
            description: analysis.description,
            location: userLocation,
            locationType: locationType // Add location type info
          })
        });

        if (response.ok) {
          toast.success(t('disease_reported_successfully') || 'Disease reported successfully! Nearby farmers will be notified.');
        } else {
          toast.error(t('report_failed') || 'Failed to report disease. Please try again.');
        }
      } else {
        toast.error(t('location_required') || 'Location access required to report disease outbreak.');
      }
    } catch (error) {
      console.error('Report error:', error);
      toast.error(t('report_error') || 'Error reporting disease. Please try again.');
    } finally {
      setReportLoading(false);
    }
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

          // Prepare language and prompt for Gemini — get response in both languages
          const langCode = (localStorage.getItem('i18nextLng') || 'en');

          const prompt = `Given the plant disease prediction "${predictedClass}", provide detailed information about this disease in BOTH English and Tamil languages.

IMPORTANT: Also determine if this disease is SPREADABLE/CONTAGIOUS to other plants (can spread from plant to plant through air, water, insects, contact, etc.).

Return ONLY a JSON object with this structure:
{
  "english": {
    "disease": "disease name in English",
    "description": "description in English", 
    "treatment": "treatment in English",
    "advice": "advice in English"
  },
  "tamil": {
    "disease": "disease name in Tamil",
    "description": "description in Tamil",
    "treatment": "treatment in Tamil", 
    "advice": "advice in Tamil"
  },
  "spreadable": true/false
}

Ensure all Tamil text is properly written in Tamil script. No extra text, just valid JSON.`;

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

            if (result && result.english && result.tamil) {
              // Store bilingual data
              setAnalysisData(result);

              // Set current language display
              const currentLang = langCode === 'ta' ? 'tamil' : 'english';
              const displayData = result[currentLang];

              setAnalysis({
                detected: displayData.disease,
                description: displayData.description || "",
                treatment: displayData.treatment || "",
                advice: displayData.advice || ""
              });

              // Set spreadable status
              setIsSpreadable(result.spreadable === true);

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
        <div className="flex justify-between items-center">
          <div className="text-black text-sm font-normal"><strong>{t('ai_analysis_results')}</strong></div>
          {/* Language Toggle Button */}
          {analysisData && !loading && (
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const currentLang = localStorage.getItem('i18nextLng') || 'en';
                  const newLang = currentLang === 'ta' ? 'en' : 'ta';
                  localStorage.setItem('i18nextLng', newLang);
                  updateDisplayLanguage();
                }}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded transition-colors"
              >
                {(localStorage.getItem('i18nextLng') || 'en') === 'ta' ? 'English' : 'தமிழ்'}
              </button>
            </div>
          )}
        </div>
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

        {/* Spreadable Disease Warning and Report Button */}
        {analysis && !loading && isSpreadable && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-orange-800 text-xs font-medium">
                {t('spreadable_disease_warning') || 'Warning: This disease can spread to other plants'}
              </span>
            </div>
            <p className="text-orange-700 text-xs">
              {t('report_help_farmers') || 'Report this issue to help alert nearby farmers and prevent further spread.'}
            </p>

            {/* Location Selection */}
            <div className="space-y-2">
              <p className="text-orange-800 text-xs font-medium">
                {t('select_detection_location') || 'Where was this disease detected?'}
              </p>
              <div className="flex space-x-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="current"
                    checked={locationType === 'current'}
                    onChange={(e) => setLocationType(e.target.value)}
                    className="w-3 h-3 text-orange-600"
                  />
                  <span className="text-xs text-orange-700">
                    {t('current_location') || 'Current Location (GPS)'}
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="field"
                    checked={locationType === 'field'}
                    onChange={(e) => setLocationType(e.target.value)}
                    className="w-3 h-3 text-orange-600"
                  />
                  <span className="text-xs text-orange-700">
                    {t('my_field') || 'My Field/Farm'}
                  </span>
                </label>
              </div>
              {locationType === 'field' && (
                <p className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
                  {t('field_location_note') || 'This will use your saved field location from your profile.'}
                </p>
              )}
            </div>

            <button
              onClick={handleReportIssue}
              disabled={reportLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white text-xs font-medium py-2 px-4 rounded transition-colors"
            >
              {reportLoading ? (t('reporting') || 'Reporting...') : (t('report_disease_outbreak') || 'Report Disease Outbreak')}
            </button>
          </div>
        )}

        {/* Non-spreadable Disease Info */}
        {analysis && !loading && !isSpreadable && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-800 text-xs font-medium">
                {t('non_spreadable_disease') || 'This disease is not contagious to other plants'}
              </span>
            </div>
            <p className="text-green-700 text-xs mt-1">
              {t('isolated_treatment') || 'You can treat this plant individually without concern for spreading.'}
            </p>
          </div>
        )}

        {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
      </section>
    </main>
  )
}

export default DetectDisease
