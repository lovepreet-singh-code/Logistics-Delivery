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
  port: parseInt(process.env.PORT || "4004", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri:
    process.env.MONGO_URI ||
    "mongodb://localhost:27017/logistics_platform",
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    clientId: process.env.KAFKA_CLIENT_ID || "order-service",
    groupId: process.env.KAFKA_GROUP_ID || "order-group",
  },
};

export default config;
