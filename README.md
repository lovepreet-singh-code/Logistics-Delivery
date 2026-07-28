# Logistics Delivery Platform

A scalable, robust, and highly available microservices-based logistics and fleet management platform. 

## Project Highlights

**Tech Stack**: 
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend Core**: Node.js, Express.js, TypeScript
- **Database & Messaging**: MongoDB, Redis, Apache Kafka (KRaft)
- **Architecture & DevOps**: Event-driven Microservices, Docker, NGINX

**Key Achievements**:
- **Blazing Fast Analytics**: Built custom Admin Dashboard UI utilizing highly-optimized MongoDB querying resulting in instant fleet metrics aggregation.
- **Resilient Event Streaming**: Implemented Apache Kafka for asynchronous inter-service communication (dispatching, fleet tracking, and order states).
- **Sub-10ms Tracking Latency**: Reduced order tracking latency from 60ms to 7ms through a Cache-Aside pattern powered by Redis.
- **Robust Topology Engine**: Automated bin-packing and vehicle assignment algorithms to dynamically calculate payload capacities and route dependencies.

## Architecture

This project is built using a strict MVC design pattern split across independent microservices:
1. `order-service` - Handles customer operations and order ledgers.
2. `fleet-service` - Manages vehicles, status, and payload capacities.
3. `topology-service` - Manages franchises, serviceability regions, and pin codes.
4. `dispatch-service` - Advanced engine for manifest generation and routing logic.
5. `frontend` - Premium web applications for Customers, Delivery Agents, and Admins.

## Local Development Requirements

To run this project locally, ensure you have Docker installed and running.

- **Backend**: Microservices and infrastructure orchestrated via `docker-compose`. Exposed via NGINX API Gateway at `http://localhost:8080`.
- **Frontend**: Next.js Client Portal running locally at `http://localhost:3000`.

## API Testing & Automation

For ease of testing and portfolio demonstration, the full end-to-end (E2E) workflow is documented and automated using Postman.

### Setup Instructions

1. **Import the Collection**: Import `Logistics_End_to_End_Flow.postman_collection.json` (located in the project root) into your Postman workspace.
2. **Import the Environment**: Import `Logistics_Platform_Environment.json` into Postman and set it as your active environment.
3. **Ensure Services are Live**: Ensure your backend Docker containers are running (`localhost:8080`).

### Usage

The Postman collection is divided into logical phases:
- **Phase 1: Admin Setup** (Creates franchises, vehicles, agents, and topology rules).
- **Phase 2: Customer Ordering** (Tests serviceability and places an order).
- **Phase 3: Dispatch & Delivery** (Automated assignment and final delivery).

> **Note on Environment Variables**: You do not need to manually copy/paste IDs or JWT tokens! The collection is configured with automated pre-request scripts and test hooks. When you successfully authenticate or create an entity (e.g., logging in as an Admin), Postman will automatically extract the token/ID from the JSON response and update the active environment variables (e.g., `{{baseUrl}}`, `{{adminToken}}`, `{{orderId}}`).
