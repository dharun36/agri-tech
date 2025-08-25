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
            locationType: locationType,
            // Include bilingual data if available
            bilingualData: analysisData ? {
              english: analysisData.english,
              tamil: analysisData.tamil
            } : null
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

  // Modern UI styles - Green theme to match Home component
  const card = "rounded-xl bg-white border border-gray-200 p-6 shadow-md mb-6"
  const sectionTitle = "text-xl font-bold text-gray-800 mb-2 tracking-tight"
  const subTitle = "text-md font-semibold text-gray-600 mb-2"
  const buttonPrimary = "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition"
  const buttonSecondary = "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow transition"
  const iconBox = "flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-50 to-green-100 shadow text-green-600 text-2xl"

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Disease Detection Section */}
        <div className={`${card} w-full`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={iconBox}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h2 className={sectionTitle}>{t('disease_detection')}</h2>
              <p className="text-gray-500 text-sm">{t('upload_plant_images')}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              {image ? (
                <div className="relative rounded-lg overflow-hidden shadow-md border border-gray-100 aspect-video">
                  <img
                    src={image}
                    alt="Uploaded plant leaf"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg h-64 shadow-inner">
                  <div className="text-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2">{t('no_image_selected')}</p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  className={buttonSecondary}
                  type="button"
                  onClick={handleRetake}
                  disabled={!image}
                >
                  {t('retake_photo')}
                </button>
                <button
                  className={buttonPrimary}
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
            </div>

            <div className="w-full md:w-1/2">
              <div className="mb-4 flex justify-between items-center">
                <h3 className={subTitle}>{t('ai_analysis_results')}</h3>

                {/* Language Toggle Button */}
                {analysisData && !loading && (
                  <button
                    onClick={() => {
                      const currentLang = localStorage.getItem('i18nextLng') || 'en';
                      const newLang = currentLang === 'ta' ? 'en' : 'ta';
                      localStorage.setItem('i18nextLng', newLang);
                      updateDisplayLanguage();
                    }}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm px-3 py-1 rounded-lg transition-colors shadow-sm"
                  >
                    {(localStorage.getItem('i18nextLng') || 'en') === 'ta' ? 'English' : 'தமிழ்'}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="p-6 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">{t('analyzing')}</p>
                </div>
              ) : analysis ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow transition">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <h4 className="font-semibold text-gray-800">{t('disease_detected')}</h4>
                    </div>
                    <p className="text-gray-700">{analysis.detected}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow transition">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <h4 className="font-semibold text-gray-800">{t('description')}</h4>
                    </div>
                    <p className="text-gray-700">{analysis.description}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow transition">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                      <h4 className="font-semibold text-gray-800">{t('treatment')}</h4>
                    </div>
                    <p className="text-gray-700">{analysis.treatment}</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-100 shadow-sm hover:shadow transition">
                    <div className="flex items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="font-semibold text-green-800">{t('advice')}</h4>
                    </div>
                    <p className="text-green-700">{analysis.advice}</p>
                  </div>
                </div>
              ) : null}

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 shadow-sm">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Spreadable Disease Warning and Report Button */}
              {analysis && !loading && isSpreadable && (
                <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-orange-800 font-medium">
                      {t('spreadable_disease_warning') || 'Warning: This disease can spread to other plants'}
                    </span>
                  </div>
                  <p className="text-orange-700 mb-4">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DetectDisease
