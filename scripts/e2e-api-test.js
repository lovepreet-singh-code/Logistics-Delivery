const BASE_URL = 'http://localhost:8080';

// ANSI escape codes for colorful console logs
const c = { 
  green: '\x1b[32m', 
  blue: '\x1b[34m', 
  yellow: '\x1b[33m', 
  red: '\x1b[31m', 
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (msg) => console.log(msg);

async function run() {
  log(`\n${c.bold}${c.blue}🚀 Starting E2E Logistics Workflow Test (Customer -> Admin -> Agent)${c.reset}\n`);

  try {
    // 1. ADMIN LOGIN / REGISTER
    // Attempt registration first in case it doesn't exist
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Admin User', email: 'admin@logicore.com', password: 'password123', role: 'ADMIN' })
    });
    
    let adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@logicore.com', password: 'password123' })
    }).then(res => res.json());
    
    if (!adminLogin.success) throw new Error("Admin login failed");
    const adminToken = adminLogin.data.token;
    log(`${c.green}✅ Step 1: Admin Authenticated (admin@logicore.com)${c.reset}`);


    // 2. AGENT LOGIN / REGISTER
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Agent User', email: 'agent@logicore.com', password: 'password123', role: 'AGENT' })
    });

    let agentLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'agent@logicore.com', password: 'password123' })
    }).then(res => res.json());

    if (!agentLogin.success) throw new Error("Agent login failed");
    const agentToken = agentLogin.data.token;
    log(`${c.green}✅ Step 2: Agent Authenticated (agent@logicore.com)${c.reset}`);


    // PRE-STEP: CUSTOMER LOGIN / REGISTER (Needed to place order)
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Customer User', email: 'customer@logicore.com', password: 'password123', role: 'CUSTOMER' })
    });

    let customerLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@logicore.com', password: 'password123' })
    }).then(res => res.json());
    const customerToken = customerLogin.data.token;
    const customerId = customerLogin.data.user.id;


    // 3. CUSTOMER (Book)
    const orderPayload = {
      customerId: customerId,
      pickupAddress: { pinCode: "10001", lat: 40.7128, lng: -74.0060, fullAddress: "123 Logicore Warehouse" },
      deliveryAddress: { pinCode: "10001", lat: 40.7306, lng: -73.9352, fullAddress: "456 Customer Ave" },
      parcelDetails: { weightKg: 5, dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10 }, parcelType: "Box" }
    };
    
    let orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify(orderPayload)
    }).then(res => res.json());
    
    if (!orderRes.success) throw new Error("Order creation failed: " + JSON.stringify(orderRes));
    
    const orderId = orderRes.data._id;
    log(`${c.yellow}📦 Step 3: Order Created successfully - ID: ${orderId}${c.reset}`);


    // 4. ADMIN (Dispatch) -> IN_TRANSIT & OUT_FOR_DELIVERY
    await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'IN_TRANSIT' })
    });
    log(`${c.blue}🚚 Step 4.1: Admin updated status to IN_TRANSIT${c.reset}`);
    
    await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' })
    });
    log(`${c.blue}🛵 Step 4.2: Admin updated status to OUT_FOR_DELIVERY${c.reset}`);


    // 5. CUSTOMER (Track)
    let trackRes = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    }).then(res => res.json());
    
    if (!trackRes.success) throw new Error("Tracking fetch failed");
    
    const otp = trackRes.data.otp;
    log(`${c.yellow}🔍 Step 5: Customer Fetched Tracking. Retrieved OTP: ${otp}${c.reset}`);


    // 6. AGENT (Deliver)
    await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${agentToken}` },
      body: JSON.stringify({ status: 'DELIVERED', otp: otp })
    });
    log(`${c.green}✅ Step 6: Agent submitted OTP & marked as DELIVERED!${c.reset}`);


    // 7. FINAL VERIFICATION
    let finalTrack = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    }).then(res => res.json());
    
    const finalStatus = finalTrack.data.status;
    if (finalStatus === 'DELIVERED') {
      log(`${c.green}${c.bold}🎉 Step 7: Final Verification Passed! Final Order Status is EXACTLY: ${finalStatus}${c.reset}\n`);
    } else {
      throw new Error(`Expected DELIVERED, but got: ${finalStatus}`);
    }

  } catch (error) {
    log(`\n${c.red}${c.bold}❌ Test Failed: ${error.message}${c.reset}\n`);
  }
}

run();
