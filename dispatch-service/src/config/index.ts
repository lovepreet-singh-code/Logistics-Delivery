import dotenv from "dotenv";
dotenv.config();

interface IConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  kafka: {
    brokers: string[];
    clientId: string;
  };
  services: {
    orderServiceUrl: string;
    fleetServiceUrl: string;
  };
}

const config: IConfig = {
  port: parseInt(process.env.PORT || "4005", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri:
    process.env.MONGO_URI ||
    "mongodb://localhost:27017/logistics_platform",
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    clientId: process.env.KAFKA_CLIENT_ID || "dispatch-service",
  },
  services: {
    orderServiceUrl: process.env.ORDER_SERVICE_URL || "http://localhost:4004",
    fleetServiceUrl: process.env.FLEET_SERVICE_URL || "http://localhost:4003",
  },
};

export default config;
