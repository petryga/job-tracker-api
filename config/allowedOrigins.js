const allowedOrigins = [
  "https://job-tracker-ibdv.onrender.com",
  "http://localhost:3007",
  "https://job-tracker-api-hn7k.onrender.com",
  //regex for subdomains
  /^https:\/\/job-tracker-ibdv\.onrender\.com$/,
  /^https:\/\/job-tracker-api-hn7k\.onrender\.com$/,
];

module.exports = allowedOrigins;
