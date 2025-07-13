
console.log("GOOGLE_MAPS_API_KEY:", process.env.GOOGLE_MAPS_API_KEY);

const axios = require("axios");

async function geocode(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  const res = await axios.get(url);
  const result = res.data.results[0];

  if (!result) return null;

  const { lat, lng } = result.geometry.location;
  return { lat, lng };
}

module.exports = { geocode };
