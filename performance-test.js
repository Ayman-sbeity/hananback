import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002/api';

const testAPIPerformance = async () => {
  console.log('🚀 Starting API Performance Tests...\n');

  const tests = [
    {
      name: 'Get Products (All)',
      url: `${API_BASE_URL}/products?showAll=true`,
      method: 'GET'
    },
    {
      name: 'Get Products (Filtered by Category)',
      url: `${API_BASE_URL}/products?category=electronics`,
      method: 'GET'
    },
    {
      name: 'Search Products',
      url: `${API_BASE_URL}/products?search=phone`,
      method: 'GET'
    },
    {
      name: 'Get Products with Price Filter',
      url: `${API_BASE_URL}/products?minPrice=100&maxPrice=500`,
      method: 'GET'
    },
    {
      name: 'Get Users Count',
      url: `${API_BASE_URL}/users/count`,
      method: 'GET'
    },
    {
      name: 'Get Products Count',
      url: `${API_BASE_URL}/products/count`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      const startTime = Date.now();
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 10000
      });
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`✅ ${test.name}`);
      console.log(`   Response Time: ${duration}ms`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data Size: ${JSON.stringify(response.data).length} bytes`);
      console.log('');
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      console.log('');
    }
  }

  console.log('🔄 Testing Concurrent Requests...');
  const concurrentTests = Array(5).fill().map(() => 
    axios.get(`${API_BASE_URL}/products?showAll=true`)
  );

  try {
    const startTime = Date.now();
    await Promise.all(concurrentTests);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ 5 Concurrent Requests`);
    console.log(`   Total Time: ${duration}ms`);
    console.log(`   Average per request: ${duration / 5}ms`);
  } catch (error) {
    console.log(`❌ Concurrent requests failed: ${error.message}`);
  }

  console.log('\n🎉 Performance tests completed!');
};

testAPIPerformance().catch(console.error);
