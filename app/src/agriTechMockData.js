// Mock data for AgriTech application components

// Data for global state store
export const mockStore = {
  user: {
    id: "user123",
    name: "John Farmer",
    email: "john@example.com",
    phone: "+1234567890",
    location: {
      type: "Point",
      coordinates: [77.5946, 12.9716] // Bangalore coordinates
    }
  },
  isAuthenticated: true,
  token: "mock-jwt-token"
};

// Data returned by API queries
export const mockQuery = {
  crops: [
    { _id: "crop1", name: "Tomato", status: "Growing", price: 45 },
    { _id: "crop2", name: "Rice", status: "Harvested", price: 25 },
    { _id: "crop3", name: "Wheat", status: "Planted", price: 30 }
  ],
  weather: {
    temp: 28,
    desc: "Partly Cloudy",
    icon: "03d",
    time: "2024-01-15T10:30:00Z",
    humidity: 65
  },
  hourlyForecast: [
    { time: "2024-01-15T11:00:00Z", values: { temperature: 29, weatherCode: 1101 } },
    { time: "2024-01-15T12:00:00Z", values: { temperature: 31, weatherCode: 1100 } },
    { time: "2024-01-15T13:00:00Z", values: { temperature: 33, weatherCode: 1000 } }
  ],
  dailyForecast: [
    { time: "2024-01-15T00:00:00Z", values: { temperatureMax: 33, temperatureMin: 22, weatherCodeMax: 1101, precipitationSum: 0 } },
    { time: "2024-01-16T00:00:00Z", values: { temperatureMax: 31, temperatureMin: 20, weatherCodeMax: 4001, precipitationSum: 5 } }
  ],
  marketPrices: [
    { name: "Tomato", price: "₹45 per kg", img: "tomato.jpg", alt: "Tomato" },
    { name: "Rice", price: "₹25 per kg", img: "rice.jpg", alt: "Rice" }
  ],
  diseaseAnalysis: {
    detected: "Leaf Spot",
    description: "Leaf spot is characterized by small, circular, tan or brown spots on the leaves.",
    treatment: "Use fungicides containing chlorothalonil or copper to treat the affected plants.",
    advice: "Ensure adequate spacing between plants to improve air circulation. Avoid overhead watering to minimize leaf wetness duration."
  },
  cropRecommendations: [
    { crop: "Wheat", reason: "Wheat is suitable for loamy soil and moderate water requirements during winter season." },
    { crop: "Maize", reason: "Maize grows well in summer with high water availability and adapts to various soil types." }
  ]
};

// Data passed as props to the root component
export const mockRootProps = {
  initialRoute: "/",
  theme: "light"
};