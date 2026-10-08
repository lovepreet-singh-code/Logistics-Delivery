@echo off
echo Starting all Logistics Microservices...
start "API Gateway" cmd /k "cd api-gateway && npm run dev"
start "Order Service" cmd /k "cd order-service && npm run dev"
start "Dispatch Service" cmd /k "cd dispatch-service && npm run dev"
start "Frontend" cmd /k "cd frontend && npm run dev"
echo All services are booting up!
