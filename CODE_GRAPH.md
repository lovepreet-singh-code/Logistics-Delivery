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

## 3. Microservice Deep Dives

### 📦 Order Service (`order-service`)
**Entry Point:** `src/server.ts`
**Database:** MongoDB (`Order`, `Hub` models) + Redis (Tracking Cache)
**Kafka Topics Published:** 
- `orders.created` (Upon Booking)
- `order.status.updated` (Pickup/Delivery execution)
**Kafka Topics Consumed:**
- `orders.routed` -> Handled by `orderRoutedWorker.ts`
- `dispatch.manifested` -> Handled by `dispatchManifestedWorker.ts`
- `delivery.completed` -> Handled by `deliveryCompletedWorker.ts`
**Internal Controllers:**
- `orderController.ts`: Handles CRUD, Zero-Touch Auto-Dispatch Cron Engine (`runAutoDispatchLogic`), and pricing calculation (`calculateTotalAmount`).
- `hubController.ts`: Handles Hub lookups.

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

- **/customer/book** -> POST `/api/orders` (Order Service)
- **/customer/track/[orderId]** -> GET `/api/orders/:id` (Order Service Cache) & Socket.io for Real-time maps (`TrackingMap.tsx`).
- **/agent/pickup-dashboard** -> GET `/api/orders` & PUT `/api/orders/:id/pickup-confirm` (Order Service)
- **/admin/planning** -> Connects to `dispatch-service` for manifests and `order-service` for auto-seeding.
- **/admin/inwarding** -> PUT `/api/orders/:trackingId/inward` (Order Service)
- **/admin/outwarding** -> PUT `/api/orders/:trackingId/transit` (Order Service)
- **/admin/destination-hub** -> PUT `/api/orders/:trackingId/destination-inward` (Order Service)

*(Note: Raw dependency AST data from `madge` is located in `frontend-graph.json`, `order-graph.json`, and `identity-graph.json` at the root directory.)*
