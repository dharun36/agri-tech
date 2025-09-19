import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CropSelector from '../crops/CropSelector';
import CropWidget from '../crops/CropWidget';

// Get API key from environment variables
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + import.meta.env.VITE_GEMINI_API_KEY;

// Format date helper
const formatDate = (date) => {
  if (!date) return 'Not set';
  return format(date, 'MMM d, yyyy');
};

// Crop status badge with appropriate coloring  
const CropStatusBadge = ({ status }) => {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";

  switch (status) {
    case 'Growing':
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      break;
    case 'Harvested':
      bgColor = "bg-amber-100";
      textColor = "text-amber-800";
      break;
    case 'Planning':
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      break;
    case 'Failed':
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      break;
    case 'Completed':
      bgColor = "bg-purple-100";
      textColor = "text-purple-800";
      break;
  }

  return (
    <span className={`${bgColor} ${textColor} px-2 py-1 rounded text-xs font-medium`}>
      {status}
    </span>
  );
};

import {
  faCloudSun,
  faSeedling,
  faPlus,
  faChartLine,
  faCalendarAlt,
  faDroplet,
  faLeaf,
  faSearch,
  faFilter,
  faExclamationTriangle,
  faInfoCircle,
  faMapMarkerAlt,
  faDollarSign,
  faClipboardList,
  faCheckCircle,
  faArrowRight,
  faTrash,
  faList,
  faSpinner,
  faMagic
} from '@fortawesome/free-solid-svg-icons';
import CropModal from '../CropModal';

const LightThemeHome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Get userId from localStorage
  const userId = localStorage.getItem('userId');
  if (!userId) {
    navigate('/login');
  }

  // Crop management state
  const [crops, setCrops] = useState([]);
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropId, setSelectedCropId] = useState(location.state?.selectedCropId || null);
  const [filterStatus, setFilterStatus] = useState('all_status');

  // If we receive a selected crop ID in navigation state, use it
  useEffect(() => {
    if (location.state?.selectedCropId) {
      setSelectedCropId(location.state.selectedCropId);
      // Clear the state from location to avoid persisting selection on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [currentCropId, setCurrentCropId] = useState(null);
  const [expense, setExpense] = useState({ description: '', category: 'Fertilizer', amount: 0 });
  const [cropLoading, setCropLoading] = useState(false);
  const [cropError, setCropError] = useState('');
  const [preloadedCropDetails, setPreloadedCropDetails] = useState(null);
  const [cropNameInput, setCropNameInput] = useState('');

  // Fetch crops from backend
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await fetch('http://localhost:5000/api/crops', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch crops');

        const data = await res.json();

        // Add next action suggestions for each crop based on status
        const dataWithNextActions = data.map(crop => {
          const nextActions = generateNextActions(crop);
          return { ...crop, nextActions };
        });

        setCrops(dataWithNextActions);
        setFilteredCrops(dataWithNextActions);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchCrops();
  }, [navigate]);

  // Generate next actions based on crop data
  const generateNextActions = (crop) => {
    const actions = [];

    if (crop.status === 'Planning') {
      actions.push('Prepare soil', 'Purchase seeds', 'Plan planting schedule');
    } else if (crop.status === 'Growing') {
      // Check if irrigation is needed
      if (!crop.lastIrrigation) {
        actions.push('Water the crop');
      } else {
        const lastIrrigDate = new Date(crop.lastIrrigation);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        if (lastIrrigDate < threeDaysAgo) {
          actions.push('Water the crop');
        }
      }

      // Check if fertilization is needed
      if (!crop.lastFertilization) {
        actions.push('Apply fertilizer');
      } else {
        const lastFertDate = new Date(crop.lastFertilization);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        if (lastFertDate < twoWeeksAgo) {
          actions.push('Apply fertilizer');
        }
      }

      // Check growth stage
      if (!crop.growthStage || crop.growthStage === 'Seedling') {
        actions.push('Update growth stage', 'Monitor for pests');
      } else if (crop.growthStage === 'Vegetative') {
        actions.push('Check for diseases', 'Consider adding supports');
      } else if (crop.growthStage === 'Reproductive') {
        actions.push('Monitor fruit development', 'Prepare for harvest');
      }
    } else if (crop.status === 'Harvested') {
      actions.push('Record yield data', 'Plan for next season', 'Analyze crop performance');
    }

    return actions;
  };

  // Open crop modal
  const openCropModal = () => {
    setIsCropModalOpen(true);
  };

  // Get crop details and open modal with pre-filled data
  const getDetailsAndOpenCropModal = async (cropName) => {
    try {
      setCropLoading(true);
      setCropError('');

      // Get crop details from Gemini AI
      const cropDetails = await getCropDetailsFromGemini(cropName);
      console.log("Got crop details from Gemini:", cropDetails);

      // Store the preloaded crop details
      setPreloadedCropDetails(cropDetails);

      // Now open modal with prefilled data
      setIsCropModalOpen(true);
    } catch (error) {
      console.error("Error getting crop details:", error);
      setCropError(`Failed to get crop details: ${error.message}`);

      // Clear any previous preloaded details
      setPreloadedCropDetails(null);

      // Open modal anyway so user can enter details manually
      setIsCropModalOpen(true);
    } finally {
      setCropLoading(false);
    }
  };

  // Close crop modal
  const closeCropModal = () => {
    setIsCropModalOpen(false);
    setCropError('');
    setPreloadedCropDetails(null);
    setCropNameInput('');
  };

  // Function to fetch crop details from Gemini AI
  const getCropDetailsFromGemini = async (cropName) => {
    console.log("Getting crop details from Gemini for:", cropName);
    try {
      // Create a detailed prompt for Gemini to get comprehensive crop information
      const langCode = (localStorage.getItem('i18nextLng') || 'en');
      const userLang = langCode === 'ta' ? 'Tamil' : langCode === 'en' ? 'English' : langCode === 'hi' ? 'Hindi' : 'English';

      const prompt = `Generate detailed agricultural information for "${cropName}" crop for a farming application. 
      Return a detailed JSON object with the following fields:
      {
        "name": "${cropName}",
        "variety": "most common or recommended variety name for this crop",
        "status": "Growing",
        "growthDays": precise number of days from planting to harvest based on typical growing conditions,
        "seedSource": "common reliable seed source or supplier",
        "irrigationType": one of ["Drip", "Sprinkler", "Flood", "Manual", "Rainwater"] based on optimal watering method for this crop,
        "soilType": one of ["Loamy", "Sandy", "Clayey", "Black Cotton", "Red", "Alluvial"] based on ideal soil conditions,
        "previousCropRecommendation": "recommended previous crop for optimal crop rotation with scientific reasoning",
        "fieldLocation": {
          "latitude": null,
          "longitude": null
        },
        "notes": "provide 2-3 sentences with essential growing tips, disease prevention, and best practices specific to this crop in ${userLang}",
        "initialCost": {
          "amount": realistic estimated initial cost per acre in dollars (number only) based on current agricultural data,
          "category": most appropriate category from ["seeds", "fertilizer", "pesticide", "labor", "equipment"],
          "description": "brief detailed description of what initial expenses typically cover for this crop in ${userLang}"
        }
      }
      
      Return ONLY valid JSON with no formatting issues, no extra text, markdown or code blocks.`;

      console.log("Sending request to Gemini API");

      const res = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2, // Lower temperature for more focused/precise responses
            topP: 0.8,
            topK: 40
          }
        })
      });

      if (!res.ok) {
        console.error("Gemini API error response:", res.status);

        if (res.status === 400) {
          throw new Error(`Invalid request to Gemini API. Please check input parameters.`);
        } else if (res.status === 401 || res.status === 403) {
          throw new Error(`API key error: Please check your API key configuration.`);
        } else if (res.status === 429) {
          throw new Error(`Rate limit exceeded. Please try again later.`);
        } else {
          throw new Error(`Gemini API error: ${res.status}. Please try again later.`);
        }
      }

      const data = await res.json();
      console.log("Gemini API response:", data);

      // Check for errors in the response
      if (data.error) {
        console.error("Gemini API returned error:", data.error);
        throw new Error(`Gemini API error: ${data.error.message || "Unknown error"}`);
      }

      const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!geminiText) {
        throw new Error("Empty response from AI service. The AI model didn't generate any content.");
      }

      console.log("AI response received, extracting JSON");

      console.log("Raw text from Gemini:", geminiText);

      let cropData = {};
      try {
        // First try direct JSON parsing
        cropData = JSON.parse(geminiText);
        console.log("Successfully parsed JSON directly:", cropData);
      } catch (err) {
        console.log("Direct parsing failed:", err);
        console.log("Attempting to extract JSON pattern from:", geminiText);

        // Try to extract JSON from response if it contains additional text
        const match = geminiText.match(/\{[\s\S]*\}/);
        if (match) {
          console.log("Found JSON pattern:", match[0]);
          try {
            cropData = JSON.parse(match[0]);
            console.log("Successfully extracted and parsed JSON from response:", cropData);
          } catch (innerErr) {
            console.error("JSON extraction failed:", innerErr);
            throw new Error("Failed to parse AI response. Please try again with a different crop name.");
          }
        } else {
          console.error("No JSON pattern found in response");
          throw new Error("Invalid response format from AI service. The AI didn't return proper JSON data.");
        }
      }

      // Validate the parsed data
      if (!cropData.name) {
        console.error("Missing required field 'name' in AI response");
        throw new Error("Invalid AI response: Missing crop name");
      }

      return cropData;
    } catch (error) {
      console.error("Error getting crop details from Gemini:", error);
      throw error;
    }
  };

  // Handle adding a new crop with detailed information
  const handleAddCrop = async (cropData) => {
    console.log("handleAddCrop called with data:", cropData);
    setCropError('');
    setCropLoading(true);

    try {
      // Validate input data
      if (!cropData || !cropData.name) {
        throw new Error('Invalid crop data: Name is required');
      }

      console.log("Validating crop data:", JSON.stringify(cropData));

      const token = localStorage.getItem('token');
      if (!token) {
        console.log("No token found, redirecting to login");
        navigate('/login');
        return;
      }

      console.log("Sending API request to add crop");
      const res = await fetch('http://localhost:5000/api/crops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cropData)
      });

      console.log("API response status:", res.status);

      // Try to get response body regardless of success/failure for better debugging
      const responseBody = await res.text();
      console.log("API response body:", responseBody);

      if (!res.ok) {
        console.error("API error response:", res.status, responseBody);
        throw new Error(`Failed to add crop: ${res.status} ${responseBody}`);
      }

      // Parse the JSON response
      let crop;
      try {
        crop = JSON.parse(responseBody);
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        throw new Error(`Invalid response format: ${parseError.message}`);
      }

      console.log("Crop added successfully:", crop);

      // Add next actions for the new crop
      const cropWithNextActions = {
        ...crop,
        nextActions: generateNextActions(crop)
      };

      setCrops([...crops, cropWithNextActions]);
      setFilteredCrops([...filteredCrops, cropWithNextActions]);
      closeCropModal();
    } catch (err) {
      console.error('Error adding crop:', err);
      setCropError(`Failed to add crop: ${err.message}`);
      // Keep modal open when there's an error
    } finally {
      setCropLoading(false);
    }
  };

  // Open expense modal for a specific crop
  const openExpenseModal = (cropId, e) => {
    e.stopPropagation(); // Prevent navigation to crop details
    setCurrentCropId(cropId);
    setExpense({ description: '', category: 'Fertilizer', amount: 0 });
    setIsExpenseModalOpen(true);
  };

  // Close expense modal
  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setCurrentCropId(null);
    setExpense({ description: '', category: 'Fertilizer', amount: 0 });
  };

  // Handle adding expense to a crop
  const handleAddExpense = async () => {
    if (!currentCropId) return;

    setCropError('');
    setCropLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`http://localhost:5000/api/crops/${currentCropId}/costs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(expense)
      });

      if (!res.ok) throw new Error('Failed to add expense');

      const updatedCrop = await res.json();
      const updatedCropWithActions = {
        ...updatedCrop,
        nextActions: generateNextActions(updatedCrop)
      };

      // Update crops state with the updated crop
      setCrops(crops.map(crop => crop._id === currentCropId ? updatedCropWithActions : crop));
      setFilteredCrops(filteredCrops.map(crop =>
        crop._id === currentCropId ? updatedCropWithActions : crop
      ));

      closeExpenseModal();
    } catch (err) {
      console.error('Error adding expense:', err);
      setCropError('Failed to add expense');
    } finally {
      setCropLoading(false);
    }
  };

  // Remove crop from backend
  const handleRemoveCrop = async (cropId, event) => {
    // Prevent navigation to crop details when clicking delete
    event.stopPropagation();

    if (!confirm(t('confirm_delete_crop'))) {
      return;
    }

    setCropError('');
    setCropLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`http://localhost:5000/api/crops/${cropId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to delete crop');

      setCrops(crops.filter(crop => crop._id !== cropId));
      setFilteredCrops(filteredCrops.filter(crop => crop._id !== cropId));
    } catch (err) {
      console.error('Error deleting crop:', err);
      setCropError('Failed to delete crop');
    } finally {
      setCropLoading(false);
    }
  };

  // Handle searching and filtering
  useEffect(() => {
    let result = [...crops];

    // Filter by search query
    if (searchQuery) {
      result = result.filter(crop =>
        crop.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all_status') {
      result = result.filter(crop => crop.status === filterStatus);
    }

    setFilteredCrops(result);
  }, [crops, searchQuery, filterStatus]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('dashboard') || 'Dashboard'}</h1>
          {/* <div className="flex space-x-2">
            <button
              onClick={() => navigate('/weather')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition"
            >
              <FontAwesomeIcon icon={faCloudSun} className="mr-2" />
              {t('weather_forecast') || 'Weather Forecast'}
            </button>
          </div> */}
        </div>

        {/* Quick Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white rounded-xl shadow-sm flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faSeedling} className="text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">{t('active_crops') || 'Active Crops'}</div>
              <div className="text-xl font-bold">
                {crops.filter(crop => crop.status !== 'Completed' && crop.status !== 'Failed').length}
              </div>
            </div>
          </div>

          {/* <div className="p-4 bg-white rounded-xl shadow-sm flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faDroplet} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">{t('irrigation_needed') || 'Irrigation Needed'}</div>
              <div className="text-xl font-bold">
                {crops.filter(crop => {
                  // If last irrigation was more than 3 days ago or never, it needs irrigation
                  if (!crop.lastIrrigation) return true;
                  const lastIrrigDate = new Date(crop.lastIrrigation);
                  const threeDaysAgo = new Date();
                  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                  return lastIrrigDate < threeDaysAgo && crop.status === 'Growing';
                }).length}
              </div>
            </div>
          </div> */}

          <div className="p-4 bg-white rounded-xl shadow-sm flex items-center">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faDollarSign} className="text-amber-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">{t('total_expenses') || 'Total Expenses'}</div>
              <div className="text-xl font-bold">
                ${crops.reduce((total, crop) => {
                  return total + (crop.costs ? crop.costs.reduce((cropTotal, cost) => cropTotal + (cost.amount || 0), 0) : 0);
                }, 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Crop Management Section */}
        <section className="p-6 mb-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faSeedling} className="text-green-600" />
            </div>
            <span className="ml-3 text-lg font-medium text-gray-800">{t('track_and_manage') || 'Track and Manage'}</span>
            <div className="ml-auto">
              <button
                onClick={openCropModal}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                {t('add_new_crop') || 'Add New Crop'}
              </button>
            </div>
          </div>

          {/* Add new crop - Button to open modal */}
          <div className="mb-4 space-y-3">


            {/* AI Crop Details Button */}
            {/* <div className="flex items-center">
              <div className="h-px bg-gray-200 flex-grow"></div>
              <span className="px-2 text-xs text-gray-500">OR</span>
              <div className="h-px bg-gray-200 flex-grow"></div>
            </div> */}

            {/* <div className="flex">
              <input
                type="text"
                placeholder={t('enter_crop_name') || 'Enter crop name (e.g., Tomato, Rice)'}
                className="flex-grow py-2 px-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={cropNameInput}
                onChange={(e) => setCropNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && cropNameInput.trim() && !cropLoading) {
                    getDetailsAndOpenCropModal(cropNameInput);
                  }
                }}
              />
              <button
                onClick={() => getDetailsAndOpenCropModal(cropNameInput)}
                disabled={!cropNameInput.trim() || cropLoading}
                className={`bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-r-lg transition flex items-center justify-center ${(!cropNameInput.trim() || cropLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {cropLoading ? (
                  <FontAwesomeIcon icon={faSpinner} className="fa-spin mr-2" />
                ) : (
                  <FontAwesomeIcon icon={faMagic} className="mr-2" />
                )}
                {cropLoading ?
                  (t('ai_generating') || 'Generating...') :
                  (t('get_ai_details') || 'Get AI Details')
                }
              </button>
            </div> */}

            {/* <p className="text-xs text-gray-500 mt-1 italic">
              {t('enter_crop_name_and_ai') || 'Enter a crop name and our AI will generate growing details'}
            </p> */}

            {/* Display crop error */}
            {cropError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {cropError}
              </div>
            )}
          </div>

          {/* Crop Details Widget Section */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t('your_crops') || 'Your Crops'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <CropSelector onSelectCrop={(cropId) => setSelectedCropId(cropId)} />
              </div>
              <div className="md:col-span-2">
                {selectedCropId ? (
                  <CropWidget
                    cropId={selectedCropId}
                    onClose={() => setSelectedCropId(null)}
                  />
                ) : (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <p className="text-gray-500">{t('select_crop_to_view') || 'Select a crop to view details'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expense Summary */}
          {crops && crops.length > 0 && crops.some(crop => crop.costs && crop.costs.length > 0) && (
            <div className="mb-6 p-4 border border-green-100 rounded-lg bg-green-50">
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon={faDollarSign} className="text-green-600 mr-2" />
                <h3 className="font-medium text-gray-800">{t('expense_summary') || 'Expense Summary'}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <div className="text-xs text-gray-500">{t('total_expenses') || 'Total Expenses'}</div>
                  <div className="text-xl font-semibold text-green-700">
                    ${crops.reduce((total, crop) => {
                      return total + (crop.costs ? crop.costs.reduce((cropTotal, cost) => cropTotal + (cost.amount || 0), 0) : 0);
                    }, 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <div className="text-xs text-gray-500">{t('active_crops') || 'Active Crops'}</div>
                  <div className="text-xl font-semibold text-green-700">
                    {crops.filter(crop => crop.status !== 'Completed' && crop.status !== 'Failed').length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and filter */}
          <div className="flex mb-4 gap-2">
            <div className="relative flex-grow">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_crops') || "Search crops"}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="relative">
              <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="all_status">{t('all_status') || "All Status"}</option>
                <option value="Planning">Planning</option>
                <option value="Growing">Growing</option>
                <option value="Harvested">Harvested</option>
              </select>
            </div>
          </div>

          {/* Crop cards */}
          <div className="space-y-4">
            {filteredCrops.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery || filterStatus !== 'all_status'
                  ? t('no_crops_match') || "No crops match your filters"
                  : t('no_crops_yet') || "No crops yet. Add your first crop!"}
              </div>
            ) : (
              filteredCrops.map((crop) => (
                <div
                  key={crop._id}
                  className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/crops/${crop._id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-medium text-gray-800">{crop.name}</h3>
                    <button
                      onClick={(e) => handleRemoveCrop(crop._id, e)}
                      className="text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50"
                      title={t('delete_crop') || "Delete crop"}
                      aria-label={t('delete_crop') || "Delete crop"}
                    >
                      <FontAwesomeIcon icon={faTrash} size="sm" />
                    </button>
                  </div>

                  <div className="mb-3">
                    <CropStatusBadge status={crop.status || 'Planning'} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">{t('planting_date') || "Planting Date"}</div>
                        <div className="text-sm">{formatDate(crop.plantingDate)}</div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faChartLine} className="text-green-500 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">{t('growth_stage') || "Growth Stage"}</div>
                        <div className="text-sm">{crop.growthStage || t('not_recorded') || 'Not recorded'}</div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faDroplet} className="text-blue-500 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">{t('last_irrigation') || "Last Irrigation"}</div>
                        <div className="text-sm">{crop.lastIrrigation ? format(new Date(crop.lastIrrigation), 'MMM d') : t('never') || 'Never'}</div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faLeaf} className="text-amber-500 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">{t('last_fertilization') || "Last Fertilization"}</div>
                        <div className="text-sm">{crop.lastFertilization ? format(new Date(crop.lastFertilization), 'MMM d') : t('never') || 'Never'}</div>
                      </div>
                    </div>

                    {/* Expense Information */}
                    {crop.costs && crop.costs.length > 0 && (
                      <div className="col-span-2 mt-2 pt-2 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faDollarSign} className="text-green-600 mr-2" />
                            <div className="text-xs text-gray-500">{t('expenses') || 'Expenses'}</div>
                          </div>
                          <div className="text-sm font-medium">
                            ${crop.costs.reduce((total, cost) => total + (cost.amount || 0), 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Next Actions Section */}
                    {crop.nextActions && crop.nextActions.length > 0 && (
                      <div className="col-span-2 mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center mb-1">
                          <FontAwesomeIcon icon={faClipboardList} className="text-blue-600 mr-2" />
                          <div className="text-xs font-medium text-gray-700">{t('next_actions') || 'Next Actions'}</div>
                        </div>
                        <ul className="text-xs text-gray-600 space-y-1 mt-1">
                          {crop.nextActions.slice(0, 2).map((action, idx) => (
                            <li key={idx} className="flex items-start">
                              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-1 mt-0.5" size="xs" />
                              <span>{action}</span>
                            </li>
                          ))}
                          {crop.nextActions.length > 2 && (
                            <li className="text-blue-500 text-xs">
                              +{crop.nextActions.length - 2} {t('more_actions') || 'more actions'}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <button
                      className="text-blue-600 text-sm font-medium hover:bg-blue-50 py-1 px-3 rounded-full transition"
                      onClick={(e) => openExpenseModal(crop._id, e)}
                    >
                      <FontAwesomeIcon icon={faDollarSign} className="mr-1" />
                      {t('add_expense') || 'Add Expense'}
                    </button>
                    <span className="text-green-600 text-sm font-medium hover:underline flex items-center">
                      {t('details') || 'Details'}
                      <FontAwesomeIcon icon={faArrowRight} className="ml-1" size="sm" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Crop Modal */}
        <CropModal
          isOpen={isCropModalOpen}
          onClose={closeCropModal}
          onAddCrop={handleAddCrop}
          loading={cropLoading}
          preloadedCropDetails={preloadedCropDetails}
          error={cropError}
        />

        {/* Expense Modal */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4">{t('add_expense') || 'Add Expense'}</h2>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  {t('description') || 'Description'}
                </label>
                <input
                  type="text"
                  value={expense.description}
                  onChange={(e) => setExpense({ ...expense, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t('expense_description') || 'Expense description'}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  {t('category') || 'Category'}
                </label>
                <select
                  value={expense.category}
                  onChange={(e) => setExpense({ ...expense, category: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Seed">{t('seed') || 'Seed'}</option>
                  <option value="Fertilizer">{t('fertilizer') || 'Fertilizer'}</option>
                  <option value="Pesticide">{t('pesticide') || 'Pesticide'}</option>
                  <option value="Irrigation">{t('irrigation') || 'Irrigation'}</option>
                  <option value="Labor">{t('labor') || 'Labor'}</option>
                  <option value="Equipment">{t('equipment') || 'Equipment'}</option>
                  <option value="Other">{t('other') || 'Other'}</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  {t('amount') || 'Amount'} ($)
                </label>
                <input
                  type="number"
                  value={expense.amount}
                  onChange={(e) => setExpense({ ...expense, amount: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeExpenseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleAddExpense}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  disabled={cropLoading}
                >
                  {cropLoading ? (t('saving') || 'Saving...') : (t('save_expense') || 'Save Expense')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LightThemeHome;