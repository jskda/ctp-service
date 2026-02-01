// test-api.ts
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function main() {
  console.log('🧪 Starting API smoke test...\n');

  try {
    // 1. Health check
    console.log('1. Checking /health...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ OK:', health.data);

    // 2. Clients
    console.log('\n2. Testing clients...');
    let clientRes = await axios.post(`${BASE_URL}/clients`, {
      name: 'Тестовый клиент',
      techNotes: ['CMYK 300dpi'],
    });
    const clientId = clientRes.data.data.id;
    console.log('✅ Created client:', clientId);

    const clients = await axios.get(`${BASE_URL}/clients`);
    console.log(`✅ Got ${clients.data.data.length} clients`);

    const client = await axios.get(`${BASE_URL}/clients/${clientId}`);
    console.log('✅ Got client by ID');

    // 3. Plate types
    console.log('\n3. Testing plate types...');
    let plateTypeRes = await axios.post(`${BASE_URL}/plates/types`, {
      format: 'A2',
      manufacturer: 'Kodak',
      minStockThreshold: 5,
    });
    const plateTypeId = plateTypeRes.data.data.id;
    console.log('✅ Created plate type:', plateTypeId);

    const plateTypes = await axios.get(`${BASE_URL}/plates/types`);
    console.log(`✅ Got ${plateTypes.data.data.length} plate types`);

    const plateType = await axios.get(`${BASE_URL}/plates/types/${plateTypeId}`);
    console.log('✅ Got plate type by ID');

    // 4. Orders
    console.log('\n4. Testing orders...');
    let orderRes = await axios.post(`${BASE_URL}/orders`, {
      clientId,
      colorMode: 'CMYK',
    });
    const orderId = orderRes.data.data.id;
    console.log('✅ Created order:', orderId);

    const orders = await axios.get(`${BASE_URL}/orders`);
    console.log(`✅ Got ${orders.data.data.length} orders`);

    const order = await axios.get(`${BASE_URL}/orders/${orderId}`);
    console.log('✅ Got order by ID');

    // 5. Start processing
    console.log('\n5. Testing start-processing...');
    const startRes = await axios.post(`${BASE_URL}/orders/${orderId}/start-processing`);
    console.log('✅ Started processing:', startRes.data.success);

    // 6. Usage (plate movement)
    console.log('\n6. Testing plate usage...');
    const usageRes = await axios.post(`${BASE_URL}/plates/movements/usage`, {
      plateTypeId,
      orderId,
      quantity: 2,
    });
    console.log('✅ Recorded usage:', usageRes.data.success);

    // 7. Scrap (client)
    console.log('\n7. Testing scrap (client)...');
    const scrapRes = await axios.post(`${BASE_URL}/plates/movements/scrap/client`, {
      plateTypeId,
      orderId,
      quantity: 1,
      reason: 'Несоответствие макета',
    });
    console.log('✅ Recorded scrap (client):', scrapRes.data.success);

    // 8. Complete order
    console.log('\n8. Testing complete...');
    const completeRes = await axios.post(`${BASE_URL}/orders/${orderId}/complete`);
    console.log('✅ Completed order:', completeRes.data.success);

    // 9. Stock check
    console.log('\n9. Testing stock...');
    const stock = await axios.get(`${BASE_URL}/plates/stock`);
    console.log(`✅ Got ${stock.data.data.length} stock entries`);

    console.log('\n🎉 All tests passed!');
  } catch (err: any) {
    console.error('\n❌ Test failed:', err.message);
    if (err.response) {
      console.error('Response:', err.response.status, err.response.data);
    }
  }
}

main();