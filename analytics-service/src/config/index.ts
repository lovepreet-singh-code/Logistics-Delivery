import dotenv from "dotenv";
dotenv.config();

interface IConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  kafka: {
    brokers: string[];
    clientId: string;
    groupId: string;
  };
}

const config: IConfig = {
  port: parseInt(process.env.PORT || "4006", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri:
    process.env.MONGO_URI ||
    "mongodb://admin:admin_secret@mongodb:27017/logistics_platform?authSource=admin",
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || "kafka:29092").split(","),
    clientId: process.env.KAFKA_CLIENT_ID || "analytics-service",
    groupId: process.env.KAFKA_GROUP_ID || "analytics-group",
  },
};

export default config;
