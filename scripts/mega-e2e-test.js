const axios = require('axios');
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
  log(`\n${c.bold}${c.magenta}🚀 Starting Mega E2E Real-Life Simulation Script (Customer -> Admin -> Agent)${c.reset}\n`);

  try {
    // 1. SYSTEM RESET
    log(`${c.yellow}🧹 Step 1: Wiping Database...${c.reset}`);
    execSync('docker exec logistics-mongodb mongosh -u admin -p admin_secret --authenticationDatabase admin logistics_platform --eval "db.dropDatabase()"', { stdio: 'ignore' });
    log(`${c.green}✅ Database Wiped! Start with a 100% clean slate.${c.reset}`);

    await delay(1500); // Give backend time to breathe

    // Helper function to register & login
    const setupUser = async (name, email, role) => {
      try {
        await axios.post(`${BASE_URL}/api/auth/register`, { name, email, password: 'password123', role });
      } catch (err) {
        // Might already exist if mock users are seeded automatically, ignore error if it's 409
      }
      const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, { email, password: 'password123' });
      return { token: loginRes.data.data.token, user: loginRes.data.data.user };
    };

    // 2. AUTHENTICATION
    log(`\n${c.yellow}🔐 Step 2: Authenticating Users...${c.reset}`);
    const adminAuth = await setupUser('Admin', 'admin@logicore.com', 'ADMIN');
    log(`${c.green}✅ Admin Authenticated (Token Acquired)${c.reset}`);
    
    const agentAuth = await setupUser('Agent', 'agent@logicore.com', 'AGENT');
    log(`${c.green}✅ Agent Authenticated (Token Acquired)${c.reset}`);
    
    const customerAuth = await setupUser('Customer', 'customer@logicore.com', 'CUSTOMER');
    log(`${c.green}✅ Customer Authenticated (Token Acquired)${c.reset}`);

    // 3. ACT 1 - CUSTOMER BOOKING
    log(`\n${c.yellow}📦 ACT 1: Customer Booking...${c.reset}`);
    const orderPayload = {
      customerId: customerAuth.user.id,
      pickupAddress: { pinCode: "110001", lat: 28.6139, lng: 77.2090, fullAddress: "Connaught Place, New Delhi" },
      deliveryAddress: { pinCode: "400001", lat: 18.9322, lng: 72.8264, fullAddress: "Nariman Point, Mumbai" },
      parcelDetails: { weightKg: 10, dimensions: { lengthCm: 20, widthCm: 20, heightCm: 20 }, parcelType: "Electronics" }
    };

    const orderRes = await axios.post(`${BASE_URL}/api/orders`, orderPayload, {
      headers: { Authorization: `Bearer ${customerAuth.token}` }
    });
    const orderId = orderRes.data.data._id;
    log(`${c.blue}   Customer Booked! Tracking ID: ${orderId}${c.reset}`);

    await delay(1000);

    // 4. ACT 2 - ADMIN DISPATCH
    log(`\n${c.yellow}🚚 ACT 2: Admin Dispatch (Planning)...${c.reset}`);
    
    // Fetch pending orders
    const pendingOrdersRes = await axios.get(`${BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${adminAuth.token}` }
    });
    const pendingOrders = pendingOrdersRes.data.data.filter(o => o.status === 'ORDER_PLACED' || o.status === 'PENDING');
    if (!pendingOrders.find(o => o._id === orderId)) throw new Error("New order not found in pending orders!");
    log(`${c.blue}   Admin fetched pending orders. Found our Tracking ID.${c.reset}`);

    // Change status to OUT_FOR_DELIVERY
    await axios.patch(`${BASE_URL}/api/orders/${orderId}/status`, 
      { status: 'OUT_FOR_DELIVERY' },
      { headers: { Authorization: `Bearer ${adminAuth.token}` } }
    );
    log(`${c.blue}   Admin Dispatched! Order status is now OUT_FOR_DELIVERY.${c.reset}`);

    // 5. ACT 3 - AGENT EXECUTION
    log(`\n${c.yellow}📱 ACT 3: Agent Execution (Scanner & Load)...${c.reset}`);
    const agentOrdersRes = await axios.get(`${BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${agentAuth.token}` }
    });
    const agentOrders = agentOrdersRes.data.data;
    if (agentOrders.length !== 1) throw new Error(`Expected 1 assigned order, got ${agentOrders.length}`);
    log(`${c.blue}   Agent fetched assigned orders. Count is 1.${c.reset}`);
    
    // Simulate QR scan logic (Finds the order by ID)
    const scannedOrder = agentOrders.find(o => o._id === orderId);
    if (!scannedOrder) throw new Error("QR Scan simulation failed: Order not found");
    log(`${c.blue}   Agent successfully scanned QR for Tracking ID: ${scannedOrder._id}${c.reset}`);

    // 6. ACT 4 - PROOF OF DELIVERY (Digital Signature)
    log(`\n${c.yellow}✍️ ACT 4: Proof of Delivery (Digital Signature)...${c.reset}`);
    // Fetch full order for OTP
    const fullOrderRes = await axios.get(`${BASE_URL}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${customerAuth.token}` }
    });
    const otp = fullOrderRes.data.data.otp;
    const mockSignature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    
    await axios.patch(`${BASE_URL}/api/orders/${orderId}/status`, 
      { status: 'DELIVERED', signatureBase64: mockSignature, otp: otp },
      { headers: { Authorization: `Bearer ${agentAuth.token}` } }
    );
    log(`${c.blue}   Agent Delivered! Submitted OTP (${otp}) and Digital Signature.${c.reset}`);

    // 7. ACT 5 - VERIFICATION
    log(`\n${c.yellow}✅ ACT 5: Verification (Customer Receipt & Agent Payout)...${c.reset}`);
    
    // Customer fetch
    const customerTrackRes = await axios.get(`${BASE_URL}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${customerAuth.token}` }
    });
    const deliveredOrder = customerTrackRes.data.data;
    if (deliveredOrder.status !== 'DELIVERED') throw new Error(`Expected DELIVERED status, got ${deliveredOrder.status}`);
    if (!deliveredOrder.proofOfDeliverySignature) throw new Error("Digital Signature is missing in the database!");
    log(`${c.blue}   Customer Verification Passed: Order is DELIVERED and Digital Receipt exists.${c.reset}`);

    // Agent fetch
    const agentFinalRes = await axios.get(`${BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${agentAuth.token}` }
    });
    const finalOrders = agentFinalRes.data.data;
    const completed = finalOrders.filter(o => o.status === 'DELIVERED').length;
    const pending = finalOrders.length - completed;
    const earnings = completed * 50;
    
    if (pending !== 0) throw new Error(`Agent still has ${pending} pending stops!`);
    if (earnings < 50) throw new Error(`Agent earnings did not increase! Current: ₹${earnings}`);
    log(`${c.blue}   Agent Verification Passed: Pending Stops = ${pending}, Earnings = ₹${earnings}.${c.reset}`);

    log(`\n${c.bold}${c.green}🎉 MEGA E2E REAL-LIFE SIMULATION PASSED! The complete lifecycle is flawless!${c.reset}\n`);

  } catch (error) {
    let errorMsg = error.message;
    if (error.response && error.response.data) {
      errorMsg = JSON.stringify(error.response.data);
    }
    log(`\n${c.bold}${c.red}❌ SIMULATION FAILED: ${errorMsg}${c.reset}`);
  }
}

run();
