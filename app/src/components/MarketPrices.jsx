import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { FaSearch, FaFilter, FaSyncAlt, FaLeaf, FaMapMarkerAlt, FaRupeeSign } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Get API key from environment variables
const GOV_API_KEY = import.meta.env.VITE_GOV_API_KEY;
const GOV_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const DATA_ID = "9ef84268-d588-465a-a308-a864a43d0070";

// Common crops in India
const commonCrops = [
  "Rice", "Wheat", "Maize", "Jowar", "Bajra", "Ragi",
  "Pulses", "Gram", "Moong", "Urad", "Lentil",
  "Groundnut", "Soybean", "Sunflower", "Mustard",
  "Cotton", "Jute", "Sugarcane", "Potato", "Onion", "Tomato",
  "Apple", "Banana", "Mango", "Orange", "Grapes"
];

const cropImages = {
  Rice: "https://storage.googleapis.com/a1aa/image/dfacf51c-4439-49db-e185-fc674bf808d5.jpg",
  Wheat: "https://storage.googleapis.com/a1aa/image/3bd0901a-748b-4579-3362-3bcbabcaa020.jpg",
  Maize: "https://storage.googleapis.com/a1aa/image/36192153-5529-4c03-1c06-c82ed080ecd2.jpg",
  Vegetables: "https://storage.googleapis.com/a1aa/image/66694345-5244-4928-8654-e7bf1554898a.jpg",
  Fruits: "https://storage.googleapis.com/a1aa/image/5beca4ed-ce87-41c0-226d-f8badcf32503.jpg",
  Pulses: "https://storage.googleapis.com/a1aa/image/2f0b3c4d-6a5e-4b8c-1f7d-9f0c8e2a3b6b.jpg",
  Onion: "https://storage.googleapis.com/a1aa/image/onion-123456.jpg",
  Potato: "https://storage.googleapis.com/a1aa/image/potato-123456.jpg",
  Tomato: "https://storage.googleapis.com/a1aa/image/tomato-123456.jpg",
  Default: "https://storage.googleapis.com/a1aa/image/66694345-5244-4928-8654-e7bf1554898a.jpg"
};

const MarketPrices = () => {
  const [userCrops, setUserCrops] = useState([]);
  const [products, setProducts] = useState([]);
  const [allCrops, setAllCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedCropType, setSelectedCropType] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [districts, setDistricts] = useState(['All', 'Erode', 'Chennai', 'Coimbatore', 'Madurai', 'Salem']);
  const [showUserCrops, setShowUserCrops] = useState(true);

  // Fetch user crops once on component mount
  useEffect(() => {
    const fetchUserCrops = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUserCrops([]);
          return;
        }

        const res = await fetch('http://localhost:5000/api/crops', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            toast.error('Your session has expired. Please log in again.');
            return;
          }
          throw new Error('Failed to fetch crops');
        }

        const crops = await res.json();
        setUserCrops(crops);

        // Fetch prices for user crops
        await fetchPricesForCrops(crops);
      } catch (error) {
        console.error('Error fetching user crops:', error);
        setUserCrops([]);
        setLoading(false);
      }
    };

    fetchUserCrops();
  }, []);

  // Function to fetch prices for a set of crops
  const fetchPricesForCrops = async (crops) => {
    setLoading(true);
    try {
      // Extract crop names from the crops objects
      const cropNames = crops.map(crop => crop.name);

      // For each crop, fetch today's price from the API
      const pricePromises = cropNames.map(async (cropName) => {
        let district = selectedDistrict !== 'All' ? selectedDistrict : '';

        const apiUrl = `https://api.data.gov.in/resource/${DATA_ID}?api-key=${GOV_API_KEY}&format=json&filters[commodity]=${encodeURIComponent(cropName)}${district ? `&filters[district]=${encodeURIComponent(district)}` : ''}&limit=1`;

        try {
          const apiRes = await fetch(apiUrl);
          const apiData = await apiRes.json();
          let price = "N/A";
          let marketLocation = "Unknown";

          if (apiData.records && apiData.records.length > 0) {
            const rec = apiData.records[0];
            price = `₹${parseInt(rec.modal_price, 10) / 100} per kg`;
            marketLocation = `${rec.market}, ${rec.district}, ${rec.state}`;
          }

          return {
            name: cropName,
            price,
            marketLocation,
            img: cropImages[cropName] || cropImages.Default,
            alt: cropName,
            date: new Date().toLocaleDateString()
          };

        } catch (error) {
          console.error(`Error fetching price for ${cropName}:`, error);
          return {
            name: cropName,
            price: "N/A",
            marketLocation: "Data unavailable",
            img: cropImages[cropName] || cropImages.Default,
            alt: cropName,
            date: new Date().toLocaleDateString()
          };
        }
      });

      const productsWithPrices = await Promise.all(pricePromises);
      setProducts(productsWithPrices);
    } catch (error) {
      console.error('Error fetching prices:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to search for a crop that isn't in user's crops
  const searchForCrop = async () => {
    if (!searchTerm.trim()) {
      toast.warning('Please enter a crop name to search');
      return;
    }

    setIsSearching(true);
    try {
      const cropName = searchTerm.trim();

      // Fetch price for the searched crop
      let district = selectedDistrict !== 'All' ? selectedDistrict : '';

      const apiUrl = `https://api.data.gov.in/resource/${DATA_ID}?api-key=${GOV_API_KEY}&format=json&filters[commodity]=${encodeURIComponent(cropName)}${district ? `&filters[district]=${encodeURIComponent(district)}` : ''}&limit=1`;

      const apiRes = await fetch(apiUrl);
      const apiData = await apiRes.json();

      if (apiData.records && apiData.records.length > 0) {
        const rec = apiData.records[0];
        const newProduct = {
          name: cropName,
          price: `₹${parseInt(rec.modal_price, 10) / 100} per kg`,
          marketLocation: `${rec.market}, ${rec.district}, ${rec.state}`,
          img: cropImages[cropName] || cropImages.Default,
          alt: cropName,
          date: new Date().toLocaleDateString(),
          isSearchResult: true
        };

        // Add to products but don't duplicate
        setProducts(prev => {
          const exists = prev.some(p => p.name.toLowerCase() === cropName.toLowerCase());
          if (exists) {
            return prev.map(p =>
              p.name.toLowerCase() === cropName.toLowerCase() ? newProduct : p
            );
          } else {
            return [...prev, newProduct];
          }
        });

        setShowUserCrops(false);
        toast.success(`Found price data for ${cropName}`);

      } else {
        // If no data from API, add a placeholder
        const newProduct = {
          name: cropName,
          price: "Price data unavailable",
          marketLocation: "No market data found",
          img: cropImages.Default,
          alt: cropName,
          date: new Date().toLocaleDateString(),
          isSearchResult: true
        };

        setProducts(prev => {
          const exists = prev.some(p => p.name.toLowerCase() === cropName.toLowerCase());
          if (exists) return prev;
          return [...prev, newProduct];
        });

        setShowUserCrops(false);
        toast.info(`No price data found for ${cropName}`);
      }

    } catch (error) {
      console.error('Error searching for crop:', error);
      toast.error('Failed to search for crop prices');
    } finally {
      setIsSearching(false);
      setSearchTerm('');
    }
  };

  // Function to handle district selection change
  const handleDistrictChange = (e) => {
    setSelectedDistrict(e.target.value);
    if (userCrops.length > 0 && showUserCrops) {
      fetchPricesForCrops(userCrops);
    }
  };

  // Function to handle crop type selection
  const handleCropTypeChange = (e) => {
    setSelectedCropType(e.target.value);
  };

  // Function to toggle between user crops and searched crops
  const toggleCropView = () => {
    setShowUserCrops(!showUserCrops);
    if (!showUserCrops && userCrops.length > 0) {
      fetchPricesForCrops(userCrops);
    }
  };

  const { t } = useTranslation();

  // Filter displayed products based on current view mode
  const displayedProducts = showUserCrops
    ? products
    : products.filter(p => p.isSearchResult);

  // Get suggestions for search
  const getSuggestions = () => {
    const userCropNames = userCrops.map(c => c.name.toLowerCase());
    return commonCrops.filter(crop =>
      !userCropNames.includes(crop.toLowerCase()) &&
      crop.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  };

  const suggestions = searchTerm ? getSuggestions() : [];

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-0 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Market Prices Header */}
        <div className="bg-white p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-50 to-green-100 text-green-600 text-2xl">
              <FaRupeeSign />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1 tracking-tight">{t('market_prices')}</h2>
              <p className="text-gray-500 text-sm">{t('stay_updated_with_latest_prices') || 'Check current prices for your crops and others'}</p>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="mt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for any crop price..."
                    className="w-full border-b-2 border-green-300 pl-10 pr-4 py-3 text-gray-700 focus:outline-none focus:border-green-500 bg-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaSearch />
                  </div>
                </div>

                {/* Search Suggestions */}
                {suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                        onClick={() => {
                          setSearchTerm(suggestion);
                          setSearchTerm(suggestion);
                        }}
                      >
                        <FaLeaf className="text-green-500 text-sm" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={searchForCrop}
                disabled={isSearching}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 flex items-center justify-center gap-2 min-w-[120px]"
              >
                {isSearching ? (
                  <>
                    <FaSyncAlt className="animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <FaSearch />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              {/* District Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  className="bg-white border border-gray-200 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  {districts.map(district => (
                    <option key={district} value={district}>
                      {district === 'All' ? 'All Districts' : district}
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop Type Filter */}
              <div className="flex items-center gap-2">

                <select
                  value={selectedCropType}
                  onChange={handleCropTypeChange}
                  className="bg-white border border-gray-200 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="All">All Crop Types</option>
                  <option value="Grain">Grains</option>
                  <option value="Vegetable">Vegetables</option>
                  <option value="Fruit">Fruits</option>
                  <option value="Pulse">Pulses</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="ml-auto">
                <button
                  onClick={toggleCropView}
                  className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2
                    ${showUserCrops
                      ? 'border-blue-500 text-blue-700'
                      : 'border-green-500 text-green-700'}`}
                >
                  {showUserCrops ? 'Viewing: My Crops' : 'Viewing: Search Results'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="bg-white p-4 sm:p-6">
          <h3 className="text-xl mb-6 flex items-center gap-2 pl-3 py-1" >
            {showUserCrops ? (
              <>
                <FaLeaf className="text-green-500" />
                <span className="font-medium text-gray-800">Your Crops Prices</span>
              </>
            ) : (
              <>
                <FaSearch className="text-blue-500" />
                <span className="font-medium text-gray-800">Search Results</span>
              </>
            )}
          </h3>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-gray-500">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
                <p>{t('loading_crop_prices') || 'Loading crop prices...'}</p>
              </div>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              {showUserCrops ? (
                <>
                  <p className="mb-4 text-lg">{t('no_crop_prices_found') || 'No crop prices found'}</p>
                  <p className="text-sm">Add crops in your profile to see their market prices here</p>
                </>
              ) : (
                <>
                  <p className="mb-4 text-lg">No search results found</p>
                  <p className="text-sm">Try searching for different crops using the search box above</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedProducts.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className={`bg-gradient-to-r ${index % 3 === 0 ? 'from-green-50 to-blue-50' :
                    index % 3 === 1 ? 'from-blue-50 to-green-50' :
                      'from-green-50 to-yellow-50'} mb-4`}
                >
                  <div className="relative h-48 overflow-hidden border-l-4 border-green-500">
                    <img
                      src={item.img}
                      alt={item.alt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                      <h4 className="text-white font-semibold text-lg">{item.name}</h4>
                    </div>
                  </div>

                  <div className="p-2 sm:p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-green-600 text-lg flex items-center gap-2">
                        {item.price}
                        {/* Add a small indicator arrow based on trending price */}
                        {index % 2 === 0 ?
                          <span className="text-green-500 text-xs">↑</span> :
                          <span className="text-red-500 text-xs">↓</span>
                        }
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{item.date}</span>
                    </div>

                    <div className="text-xs text-gray-600 flex items-start gap-1 border-t border-gray-100 pt-2">
                      <FaMapMarkerAlt className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{item.marketLocation}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketPrices;
