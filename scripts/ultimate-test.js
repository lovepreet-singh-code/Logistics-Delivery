const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:8080';

const c = { 
  green: '\x1b[32m', 
  blue: '\x1b[34m', 
  yellow: '\x1b[33m', 
  red: '\x1b[31m', 
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (msg) => console.log(msg);
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function run() {
  log(`\n${c.bold}${c.magenta}🚀 Starting Ultimate Clean E2E Test (Agent Dashboard Logic)${c.reset}\n`);

  try {
    // 1. RESET DATABASE
    log(`${c.yellow}🧹 Step 1: Wiping Database...${c.reset}`);
    execSync('docker exec logistics-mongodb mongosh -u admin -p admin_secret --authenticationDatabase admin logistics_platform --eval "db.dropDatabase()"', { stdio: 'ignore' });
    log(`${c.green}✅ Database Wiped! Start with a 100% clean slate.${c.reset}`);

    // Wait a brief moment for any backend reconnects/cleanups if necessary
    await delay(1000);

    // Helper function to register & login
    const setupUser = async (name, email, role) => {
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: 'password123', role })
      });
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' })
      }).then(r => r.json());
      if (!loginRes.success) throw new Error(`${role} login failed`);
      return loginRes.data.token;
    };

    // 2. AUTHENTICATE
    log(`${c.yellow}🔐 Step 2: Authenticating Users...${c.reset}`);
    const adminToken = await setupUser('Admin', 'admin@logicore.com', 'ADMIN');
    log(`${c.green}✅ Admin Authenticated${c.reset}`);
    
    const agentToken = await setupUser('Agent', 'agent@logicore.com', 'AGENT');
    log(`${c.green}✅ Agent Authenticated${c.reset}`);
    
    // Setup Customer as well for order creation
    const customerLoginRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Customer', email: 'customer@logicore.com', password: 'password123', role: 'CUSTOMER' })
    });
    const cLogin = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'customer@logicore.com', password: 'password123' })
    }).then(r => r.json());
    const customerToken = cLogin.data.token;
    const customerId = cLogin.data.user.id;
    log(`${c.green}✅ Customer Authenticated${c.reset}`);

    // Helper to fetch Agent Stats
    const getAgentStats = async () => {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${agentToken}` }
      }).then(r => r.json());
      
      const orders = res.data || [];
      const total = orders.length;
      const done = orders.filter(o => o.status === 'DELIVERED').length;
      const pending = total - done;
      const earnings = done * 50;
      return { total, done, pending, earnings };
    };

    // 3. ASSERT INITIAL STATE
    log(`\n${c.yellow}📊 Step 3: Asserting Initial Agent Dashboard State...${c.reset}`);
    const initialStats = await getAgentStats();
    log(`${c.blue}   Stops: ${initialStats.total} | Pending: ${initialStats.pending} | Done: ${initialStats.done} | Earnings: ₹${initialStats.earnings}${c.reset}`);
    if (initialStats.total !== 0 || initialStats.earnings !== 0) throw new Error("Initial state is not clean!");
    log(`${c.green}✅ Initial State Verified: Completely Empty!${c.reset}`);

    // 4. BOOKING & DISPATCH
    log(`\n${c.yellow}📦 Step 4: Booking & Dispatching a new Order...${c.reset}`);
    const orderPayload = {
      customerId: customerId,
      pickupAddress: { pinCode: "10001", lat: 40.7128, lng: -74.0060, fullAddress: "123 Warehouse" },
      deliveryAddress: { pinCode: "10001", lat: 40.7306, lng: -73.9352, fullAddress: "456 Customer" },
      parcelDetails: { weightKg: 5, dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10 }, category: "DOCUMENT" }
    };
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify(orderPayload)
    }).then(r => r.json());
    if (!orderRes.success) throw new Error("Order creation failed");
    const orderId = orderRes.data._id;
    log(`${c.blue}   Order Created - ID: ${orderId}${c.reset}`);

    await delay(500); // Give kafka a tiny bit of time if needed

    // Admin updates status to OUT_FOR_DELIVERY
    await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' })
    });
    log(`${c.blue}🚚 Order Dispatched (Status: OUT_FOR_DELIVERY)${c.reset}`);

    // 5. ASSERT PENDING STATE
    log(`\n${c.yellow}📊 Step 5: Asserting Pending Agent Dashboard State...${c.reset}`);
    const pendingStats = await getAgentStats();
    log(`${c.blue}   Stops: ${pendingStats.total} | Pending: ${pendingStats.pending} | Done: ${pendingStats.done} | Earnings: ₹${pendingStats.earnings}${c.reset}`);
    if (pendingStats.total !== 1 || pendingStats.pending !== 1 || pendingStats.earnings !== 0) {
      throw new Error("Pending state incorrect!");
    }
    log(`${c.green}✅ Pending State Verified: 1 Stop added, ₹0 Earned yet!${c.reset}`);

    // 6. DELIVERY
    log(`\n${c.yellow}🛵 Step 6: Delivering the Order...${c.reset}`);
    const trackRes = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    }).then(r => r.json());
    
    // We need to fetch full order to get OTP (status doesn't have it)
    const fullOrderRes = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    }).then(r => r.json());
    const otp = fullOrderRes.data.otp;
    log(`${c.blue}   Retrieved Customer OTP: ${otp}${c.reset}`);

    const deliverRes = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${agentToken}` },
      body: JSON.stringify({ status: 'DELIVERED', otp })
    }).then(r => r.json());
    if (!deliverRes.success) throw new Error("Delivery failed: " + deliverRes.message);
    log(`${c.blue}✅ Delivery marked as Successful!${c.reset}`);

    // 7. ASSERT FINAL STATE
    log(`\n${c.yellow}💰 Step 7: Asserting Final Agent Dashboard State (Earnings)...${c.reset}`);
    const finalStats = await getAgentStats();
    log(`${c.blue}   Stops: ${finalStats.total} | Pending: ${finalStats.pending} | Done: ${finalStats.done} | Earnings: ₹${finalStats.earnings}${c.reset}`);
    
    if (finalStats.done !== 1 || finalStats.pending !== 0 || finalStats.earnings !== 50) {
      throw new Error("Final state incorrect!");
    }
    log(`${c.green}✅ Final State Verified: Stops=1, Pending=0, Done=1, Earnings=₹50!${c.reset}`);

    log(`\n${c.bold}${c.magenta}🎉 ULTIMATE E2E TEST PASSED! The Dynamic Dashboard is flawlessly connected!${c.reset}\n`);

  } catch (error) {
    log(`\n${c.bold}${c.red}❌ TEST FAILED: ${error.message}${c.reset}`);
    console.error(error);
  }
}

run();
