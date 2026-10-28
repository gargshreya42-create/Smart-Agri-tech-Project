const mongoose = require('mongoose');

// Cached weather snapshot per location; used to avoid repeated API calls and as an
// offline fallback when the external weather service is unreachable.
const weatherDataSchema = new mongoose.Schema(
  {
    locationKey: { type: String, required: true, unique: true, lowercase: true, trim: true },
    location: {
      name: String,
      region: String,
      country: String,
      latitude: Number,
      longitude: Number,
    },
    current: {
      temperature: Number,
      feelsLike: Number,
      condition: String,
      icon: String,
      humidity: Number,
      windSpeed: Number,
      rainProbability: Number,
      precipitation: Number,
    },
    forecast: [
      {
        date: String,
        min: Number,
        max: Number,
        condition: String,
        icon: String,
        rainProbability: Number,
        rainfall: Number,
      },
    ],
    source: { type: String, default: 'open-meteo' },
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WeatherData', weatherDataSchema);
