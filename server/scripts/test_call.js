const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:8080/api/subscription/packages/public');
        console.log("Response:", res.data);
    } catch (err) {
        console.error("Error calling API:", err.response ? err.response.data : err.message);
    }
}

test();
