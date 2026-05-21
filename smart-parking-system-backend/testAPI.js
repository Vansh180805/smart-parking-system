const axios = require('axios');

// Test the nearest parking API
async function testAPI() {
    try {
        // New Delhi coordinates (where parking lot should be)
        const lat = 28.6328;
        const lon = 77.2167;
        const radius = 50; // Increase to 50km to find parking

        console.log(`\n🔍 Testing API with coordinates: ${lat}, ${lon}`);
        console.log(`📏 Search radius: ${radius}km\n`);

        const response = await axios.get(`http://localhost:5000/api/bookings/nearest-parking`, {
            params: { lat, lon, radius },
            headers: {
                'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need a valid token
            }
        });

        console.log('✅ API Response:');
        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testAPI();
