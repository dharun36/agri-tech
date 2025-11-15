const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

// GET /api/market/prices?commodities=Rice,Wheat&district=Chennai
router.get('/prices', async (req, res) => {
  try {
    const { commodities = '', district = '' } = req.query;
    if (!commodities) return res.status(400).json({ message: 'commodities query param required' });

    const GOV_KEY = process.env.GOV_API_KEY;
    if (!GOV_KEY) return res.status(500).json({ message: 'Server missing GOV_API_KEY' });

    const DATA_ID = '9ef84268-d588-465a-a308-a864a43d0070';

    const commodityList = commodities.split(',').map(s => s.trim()).filter(Boolean);

    // Helper with timeout using AbortController
    const fetchWithTimeout = async (url, timeout = 8000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const r = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return r;
      } catch (e) {
        clearTimeout(id);
        throw e;
      }
    };

    const results = await Promise.all(commodityList.map(async (commodity) => {
      const q = `https://api.data.gov.in/resource/${DATA_ID}?api-key=${GOV_KEY}&format=json&filters[commodity]=${encodeURIComponent(commodity)}${district ? `&filters[district]=${encodeURIComponent(district)}` : ''}&limit=1`;
      try {
        const r = await fetchWithTimeout(q, 8000);
        if (!r.ok) return { commodity, error: `Status ${r.status}` };
        const j = await r.json();
        if (j.records && j.records.length > 0) {
          const rec = j.records[0];
          return {
            commodity,
            price: rec.modal_price ? `₹${parseInt(rec.modal_price, 10) / 100} per kg` : 'N/A',
            marketLocation: `${rec.market || ''}${rec.district ? `, ${rec.district}` : ''}${rec.state ? `, ${rec.state}` : ''}`.replace(/^,\s*/, ''),
            raw: rec
          };
        }
        return { commodity, price: 'N/A', marketLocation: 'No data' };
      } catch (err) {
        return { commodity, price: 'N/A', marketLocation: 'Data unavailable', error: err.message };
      }
    }));

    res.json({ results });
  } catch (error) {
    console.error('Market proxy error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
