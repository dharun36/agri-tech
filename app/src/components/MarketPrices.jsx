import React, { useEffect, useState } from "react";

const GOV_API_KEY = "579b464db66ec23bdd0000013f7611f40d8544e97c38a95e33add5b7";
const GOV_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const DATA_ID = "9ef84268-d588-465a-a308-a864a43d0070";

const cropImages = {
  Rice: "https://storage.googleapis.com/a1aa/image/dfacf51c-4439-49db-e185-fc674bf808d5.jpg",
  Wheat: "https://storage.googleapis.com/a1aa/image/3bd0901a-748b-4579-3362-3bcbabcaa020.jpg",
  Corn: "https://storage.googleapis.com/a1aa/image/36192153-5529-4c03-1c06-c82ed080ecd2.jpg",
  Vegetables: "https://storage.googleapis.com/a1aa/image/66694345-5244-4928-8654-e7bf1554898a.jpg",
  Fruits: "https://storage.googleapis.com/a1aa/image/5beca4ed-ce87-41c0-226d-f8badcf32503.jpg",
};

const MarketPrices = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCropsAndPrices = async () => {
      setLoading(true);
      try {
        // 1. Fetch crops from backend
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/crops', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Failed to fetch crops');
        const crops = await res.json();
        // 2. For each crop, fetch today's price from the API
        const pricePromises = crops.map(async (crop) => {
          // Replace with the district you want, or remove the filter for all locations
          const district = "Erode"; // You can also make this dynamic

          const apiUrl = `https://api.data.gov.in/resource/${DATA_ID}?api-key=${GOV_API_KEY}&format=json&filters[commodity]=${encodeURIComponent(crop.name)}&filters[district]=${encodeURIComponent(district)}&limit=1`;

          try {
            const apiRes = await fetch(apiUrl);
            const apiData = await apiRes.json();
            let price = "N/A";

            if (apiData.records && apiData.records.length > 0) {
              const rec = apiData.records[0];
              price = `₹${parseInt(rec.modal_price, 10) / 100} per kg`;
            }

            return {
              name: crop.name,
              price,
              img: cropImages[crop.name] || cropImages.Vegetables,
              alt: crop.name
            };

          } catch {
            return {
              name: crop.name,
              price: "N/A",
              img: cropImages[crop.name] || cropImages.Vegetables,
              alt: crop.name
            };
          }
        });
        const productsWithPrices = await Promise.all(pricePromises);
        setProducts(productsWithPrices);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCropsAndPrices();
  }, []);

  return (
    <div className="bg-white text-black font-sans">
      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:space-x-6">
          {/* Search Input */}
          <div className="flex-1 md:max-w-xs mb-6 md:mb-0">
            <input
              type="text"
              placeholder="Search for crops or market locations"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              disabled
            />
          </div>
          {/* Crop Tags */}
          <div className="flex-1 flex items-center space-x-6 text-xs font-semibold text-gray-700">
            <span>Rice</span>
            <span>Wheat</span>
            <span>Corn</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:space-x-6 mt-6">
          {/* Sidebar Filters */}
          <aside
            aria-label="Filters"
            className="bg-gray-100 rounded-lg p-4 w-full md:w-64 text-xs text-gray-700"
          >
            <h2 className="font-semibold mb-3">Filters</h2>
            <div className="mb-4">
              <p className="font-semibold mb-1">Market Location</p>
              <label className="flex items-center space-x-2 mb-1 cursor-pointer">
                <input type="checkbox" className="form-checkbox" disabled />
                <span>Local Market 1</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="form-checkbox" disabled />
                <span>Local Market 2</span>
              </label>
            </div>
            <div>
              <p className="font-semibold mb-1">Crop Type</p>
              <label className="flex items-center space-x-2 mb-1 cursor-pointer">
                <input type="checkbox" className="form-checkbox" disabled />
                <span>Organic</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="form-checkbox" disabled />
                <span>Non-Organic</span>
              </label>
            </div>
          </aside>

          {/* Product Grid */}
          <section className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-6 mt-6 md:mt-0">
            {loading ? (
              <div className="text-gray-500 col-span-2">Loading crop prices...</div>
            ) : products.length === 0 ? (
              <div className="text-gray-500 col-span-2">No crop prices found.</div>
            ) : (
              products.map((item) => (
                <div key={item.name}>
                  <img
                    src={item.img}
                    alt={item.alt}
                    className="rounded-lg w-full h-auto object-cover"
                    width="150"
                    height="120"
                  />
                  <p className="mt-2 text-sm font-normal">{item.name}</p>
                  <p className="text-xs text-gray-600">{item.price}</p>
                </div>
              ))
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default MarketPrices;
