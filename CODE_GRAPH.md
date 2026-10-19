# 🧠 Graphify Knowledge Graph & Dependency Map

## 1. High-Level Architecture Flow
`Frontend (Next.js) --> NGINX API Gateway (Port 8080) --> Microservices (Ports 4001-4006) --> MongoDB/Redis/Kafka`

## 2. API Gateway Routing Map
The central NGINX Gateway (`api-gateway/nginx.conf`) handles CORS and routes traffic:
- `http://localhost:8080/api/auth` -> **Identity Service** (`identity-service:4001/api/auth`)
- `http://localhost:8080/api/management` -> **Identity Service** (`identity-service:4001/api/management`)
- `http://localhost:8080/api/orders` -> **Order Service** (`order-service:4004/api/orders`)
- `http://localhost:8080/socket.io/` -> **Order Service** (`order-service:4004/socket.io/` via Websocket Upgrade)
- `http://localhost:8080/api/dispatch` -> **Dispatch Service** (`dispatch-service:4005/api/dispatch`)
- `http://localhost:8080/api/planning` -> **Dispatch Service** (`dispatch-service:4005/api/planning`)
- `http://localhost:8080/api/deliveries` -> **Dispatch Service** (`dispatch-service:4005/api/deliveries`)
- `http://localhost:8080/api/agent` -> **Dispatch Service** (`dispatch-service:4005/api/agent`)
- `http://localhost:8080/api/topology` -> **Topology Service** (`topology-service:4002/api/topology`)
- `http://localhost:8080/api/warehouses` -> **Topology Service** (`topology-service:4002/api/warehouses`)
- `http://localhost:8080/api/fleet` -> **Fleet Service** (`fleet-service:4003/api/fleet`)
- `http://localhost:8080/api/analytics` -> **Analytics Service** (`analytics-service:4006/api/analytics`)
- `http://localhost:8080/api/serviceability` -> **Order Service** (`order-service:4004/api/serviceability`) ⭐ *Phase 2 — CX Upgrade*
- `http://localhost:8080/api/pricing` -> **Order Service** (`order-service:4004/api/pricing`) ⭐ *Phase 2 Feature 2 — Live Price Calculator*
- `http://localhost:8080/api/users` -> **Order Service** (`order-service:4004/api/users` / `available-agents`) ⭐ *Phase 3 Feature 2 — Available Agents Query*

## 3. Microservice Deep Dives

### 📦 Order Service (`order-service`)
**Entry Point:** `src/server.ts`
**Database:** MongoDB (`Order`, `Hub`, `User` models) + Redis (Tracking Cache)
**Kafka Topics Published:** 
- `orders.created` (Upon Booking)
- `order.status.updated` (Pickup/Delivery execution)
**Kafka Topics Consumed:**
- `orders.routed` -> Handled by `orderRoutedWorker.ts`
- `dispatch.manifested` -> Handled by `dispatchManifestedWorker.ts`
- `delivery.completed` -> Handled by `deliveryCompletedWorker.ts`
**Internal Controllers:**
- `orderController.ts`: Handles CRUD, Zero-Touch Auto-Dispatch Cron Engine (`runAutoDispatchLogic`), pricing calculation (`calculateTotalAmount`), `assignAgentToOrder` (`PUT /api/orders/:id/assign-agent`), `getAvailableAgents` (`GET /api/orders/available-agents` & `GET /api/users`), `verifyOrderWeight` (`PUT /api/orders/:id/verify-weight`) ⭐ *Phase 3 Feature 3*, `getDashboardStats` (`GET /api/orders/stats/dashboard`) ⭐ *Phase 3 Feature 4*, `getAgentOrders` (`GET /api/orders/agent/:agentId`) ⭐ *Phase 4 Feature 1*, enhanced `updateOrderStatus` (`PUT /api/orders/:id/status`) ⭐ *Phase 4 Feature 1*, `inwardParcel` (`POST /api/orders/inward` & `PUT /api/orders/:trackingId/inward`) ⭐ *Phase 4 Feature 2*, `dispatchToTransit` (`POST /api/orders/outward` & `PUT /api/orders/:trackingId/transit`) ⭐ *Phase 4 Feature 3*, and `receiveAtDestinationHub` (`POST /api/orders/destination-inward` & `PUT /api/orders/:trackingId/destination-inward`) + `markOutForDelivery` (`POST /api/orders/out-for-delivery` & `PUT /api/orders/:trackingId/out-for-delivery`) ⭐ *Phase 4 Feature 4: Destination Hub Receiving & Out for Delivery APIs*.
- `hubController.ts`: Handles Hub lookups.
- `serviceabilityRoutes.ts`: ⭐ *Phase 2* — `GET /api/serviceability/check?pincode=XXXXXX` — **Dynamically** queries `Hub.findOne({ serviceablePincodes: pincode, isActive: true })`. City name sourced from `hub.hubName`. Returns `{ serviceable: boolean, city, hubCode, message }`. Zero hardcoding — fully driven by Admin-managed Hub records in MongoDB.
- `pricingRoutes.ts`: ⭐ *Phase 2 Feature 2* — `POST /api/pricing/calculate` — Live parcel pricing engine. Calculates volumetric weight (`(L*W*H)/5000`), chargeable weight (`max(actual, volumetric)`), base charge (`₹50/kg`), flat premium (`₹100` for `FRAGILE`/`ELECTRONICS`), and `18% GST`. Returns `{ baseCharge, tax, totalAmount, chargeableWeight, volumetricWeight }`.

### 🔐 Identity Service (`identity-service`)
**Entry Point:** `src/server.ts`
**Database:** MongoDB (`User` model)
**Controllers:**
- `authRoutes.ts` / `authController.ts`: Handles JWT generation, login, and registration.
- `managementRoutes.ts`: Admin management endpoints.

### 🚚 Dispatch Service (`dispatch-service`)
**Entry Point:** `src/server.ts`
**Cron:** `dailyDispatch.ts`
**Controllers:**
- `dispatchRoutes.ts`, `planningRoutes.ts`, `agentRoutes.ts`, `deliveryRoutes.ts`: Core routing/manifest algorithms and agent assignments.

## 4. Frontend Routes & Service Interactions
**Entry Point:** `src/app/layout.tsx` (Next.js 14 App Router)
**API Client:** Uses `src/lib/apiClient.ts` connecting to `http://localhost:8080/api`

- **/customer/book** -> POST `/api/orders` (Order Service with `pickupTimeSlot` & `pickupDetails`) + GET `/api/serviceability/check?pincode=XXXXXX` (Phase 2 Feature 1) + POST `/api/pricing/calculate` (Phase 2 Feature 2) ⭐ *Phase 3 Feature 2: Pickup Scheduling dropdown*
- **/customer/track/[orderId]** -> GET `/api/orders/:id` (Order Service Cache) & Socket.io for Real-time maps (`TrackingMap.tsx`).
- **/agent** -> GET `/api/orders/agent/:agentId` (Order Service KPI Stats) ⭐ *Phase 4: Agent KPI metrics*
- **/agent/pickup-dashboard** -> GET `/api/orders/agent/:agentId` & PUT `/api/orders/:id/status` (Order Service) ⭐ *Phase 4 Feature 1: Real-time Pickup Agent Workflow, Exact Field Mapping & In-Custody Reflection*
- **/agent/delivery-dashboard** -> GET `/api/orders?status=OUT_FOR_DELIVERY` & PUT `/api/orders/:id/complete-delivery` (Order Service)
- **/admin** -> GET `/api/orders/stats/dashboard` (Order Service) ⭐ *Phase 3 Feature 4: Live KPI operations overview (Total Orders, Pending Pickups, In Transit, Delivered)*
- **/admin/planning** -> Connects to `dispatch-service` for manifests and `order-service` for auto-seeding.
- **/admin/orders** -> GET `/api/orders` (Order Service) + GET `/api/users` / `/api/orders/available-agents` + PUT `/api/orders/:id/assign-agent` + PUT `/api/orders/:id/verify-weight` ⭐ *Phase 3: Route & Fleet agent assignment, real-time fleet status, and Weight Verification & Price Adjustment modal*
- **/admin/inwarding** -> POST `/api/orders/inward` & PUT `/api/orders/:trackingId/inward` (Order Service) ⭐ *Phase 4 Feature 2: Hub Inwarding Station & Custody Transfer*
- **/admin/outwarding** -> POST `/api/orders/outward` & PUT `/api/orders/:trackingId/transit` (Order Service) ⭐ *Phase 4 Feature 3: Hub Outwarding Station & Transit Dispatch*
- **/admin/destination-hub** -> POST `/api/orders/destination-inward` & POST `/api/orders/out-for-delivery` (Order Service) ⭐ *Phase 4 Feature 4: Destination Hub Station, continuous scanning, live session summary & instant Out for Delivery dispatch*

*(Note: Raw dependency AST data from `madge` is located in `frontend-graph.json`, `order-graph.json`, and `identity-graph.json` at the root directory.)*
