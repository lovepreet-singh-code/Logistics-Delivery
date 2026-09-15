const axios = require('axios');
const chalk = require('chalk');

const API_BASE = 'http://localhost:8080/api';
// Assuming we have a way to get admin token or just mocking one if not verified.
// The user says "(using axios and the Admin JWT token)".
// Let's authenticate as admin first, or use a hardcoded token. We can register an admin or login.
// Let's create an admin, or register an admin to get the token.

async function getAdminToken() {
  try {
    const res = await axios.post(`${API_BASE}/auth/register`, {
      name: "Super Admin",
      email: `admin_${Date.now()}@test.com`,
      password: "password123",
      role: "ADMIN"
    });
    return res.data.data.token;
  } catch (err) {
    if (err.response && err.response.status === 409) {
      // already exists? login
      // wait, we generated unique email.
    }
    console.error("Failed to get admin token", err.response?.data || err.message);
    throw err;
  }
}

async function runSeed() {
  console.log(chalk.bold.blue("Starting Master Data Seed..."));
  
  const token = await getAdminToken();
  const config = { headers: { Authorization: `Bearer ${token}` } };
  
  console.log(chalk.green("✓ Admin Authenticated"));

  // 1. Create Hubs
  console.log(chalk.bold.cyan("\n--- Creating Hubs ---"));
  const hub1 = await axios.post(`${API_BASE}/topology/franchises`, {
    name: "Amritsar Central Hub",
    region: "Punjab",
    basePinCode: "143001",
    location: { type: "Point", coordinates: [74.8723, 31.6340] },
    volumeCapacity: 100000
  }, config).catch(e => { console.log(e.response.data); throw e; });
  const amritsarHubId = hub1.data.data._id || hub1.data.data.id;
  console.log(chalk.green(`✓ Amritsar Central Hub created with ID: ${chalk.yellow(amritsarHubId)}`));

  const hub2 = await axios.post(`${API_BASE}/topology/franchises`, {
    name: "Gurdaspur Hub",
    region: "Punjab",
    basePinCode: "143521",
    location: { type: "Point", coordinates: [75.4012, 32.0419] },
    volumeCapacity: 80000
  }, config).catch(e => { console.log(e.response.data); throw e; });
  const gurdaspurHubId = hub2.data.data._id || hub2.data.data.id;
  console.log(chalk.green(`✓ Gurdaspur Hub created with ID: ${chalk.yellow(gurdaspurHubId)}`));

  // 2. Create Vehicles
  console.log(chalk.bold.cyan("\n--- Creating Vehicles ---"));
  const v1 = await axios.post(`${API_BASE}/fleet/vehicles`, {
    registrationNumber: `PB02-${Math.floor(Math.random()*9000)+1000}`,
    type: "TRUCK",
    capacity: { maxWeightKg: 1500, maxVolumeCm3: 8000 },
    franchiseId: amritsarHubId,
    status: "AVAILABLE"
  }, config).catch(e => { console.log(e.response.data); throw e; });
  const vehicle1Id = v1.data.data._id || v1.data.data.id;
  console.log(chalk.green(`✓ Tata Ace (Truck) created with ID: ${chalk.yellow(vehicle1Id)} and assigned to Amritsar Hub`));

  const v2 = await axios.post(`${API_BASE}/fleet/vehicles`, {
    registrationNumber: `PB06-${Math.floor(Math.random()*9000)+1000}`,
    type: "BIKE",
    capacity: { maxWeightKg: 50, maxVolumeCm3: 200 },
    franchiseId: gurdaspurHubId,
    status: "AVAILABLE"
  }, config).catch(e => { console.log(e.response.data); throw e; });
  const vehicle2Id = v2.data.data._id || v2.data.data.id;
  console.log(chalk.green(`✓ Delivery Bike created with ID: ${chalk.yellow(vehicle2Id)} and assigned to Gurdaspur Hub`));

  // 3. Create Agents
  console.log(chalk.bold.cyan("\n--- Creating Agents ---"));
  // Agent 1
  const u1 = await axios.post(`${API_BASE}/auth/register`, {
    name: "Ramesh - Agent",
    email: `ramesh_${Date.now()}@test.com`,
    password: "password123",
    role: "AGENT"
  });
  const u1Id = u1.data.data.user.id || u1.data.data.user._id;
  
  const a1 = await axios.post(`${API_BASE}/management/agents`, {
    name: "Ramesh - Agent",
    userId: u1Id,
    assignedHubId: amritsarHubId,
    vehicleId: vehicle1Id,
    status: "AVAILABLE"
  }, config).catch(e => { console.log(e.response.data); throw e; });
  const agent1Id = a1.data.data._id || a1.data.data.id;
  console.log(chalk.green(`✓ Ramesh - Agent created with ID: ${chalk.yellow(agent1Id)} (User ID: ${u1Id})`));

  // Agent 2
  const u2 = await axios.post(`${API_BASE}/auth/register`, {
    name: "Suresh - Agent",
    email: `suresh_${Date.now()}@test.com`,
    password: "password123",
    role: "AGENT"
  });
  const u2Id = u2.data.data.user.id || u2.data.data.user._id;
  
  const a2 = await axios.post(`${API_BASE}/management/agents`, {
    name: "Suresh - Agent",
    userId: u2Id,
    assignedHubId: gurdaspurHubId,
    vehicleId: vehicle2Id,
    status: "AVAILABLE"
  }, config).catch(e => { console.log(e.response.data); throw e; });
  const agent2Id = a2.data.data._id || a2.data.data.id;
  console.log(chalk.green(`✓ Suresh - Agent created with ID: ${chalk.yellow(agent2Id)} (User ID: ${u2Id})`));

  console.log(chalk.bold.magenta("\nMaster Data Seeding Complete!\n"));
}

runSeed().catch(console.error);
