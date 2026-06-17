require('dotenv').config();
const config = require("./src/util/config");
console.log("Cloud Name:", config.cloudinary.cloud_name);
console.log("API Key:", config.cloudinary.api_key);
console.log("API Secret:", config.cloudinary.api_secret ? "******" : "MISSING");
