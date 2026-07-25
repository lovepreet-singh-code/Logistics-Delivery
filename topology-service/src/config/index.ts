import dotenv from "dotenv";
dotenv.config();

interface IConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  redis: {
    host: string;
    port: number;
    password: string;
  };
  kafka: {
    brokers: string[];
    clientId: string;
    groupId: string;
  };
}

const config: IConfig = {
  port: parseInt(process.env.PORT || "4002", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri:
    process.env.MONGO_URI ||
    "mongodb://admin:admin_secret@mongodb:27017/logistics_platform?authSource=admin",
  redis: {
    host: process.env.REDIS_HOST || "redis",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || "",
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || "kafka:29092").split(","),
    clientId: process.env.KAFKA_CLIENT_ID || "topology-service",
    groupId: process.env.KAFKA_GROUP_ID || "topology-group",
  },
};

export default config;
