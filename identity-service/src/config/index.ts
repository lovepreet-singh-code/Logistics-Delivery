import dotenv from "dotenv";
dotenv.config();

interface IConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  redisUrl: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

const config: IConfig = {
  port: parseInt(process.env.PORT || "4001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri:
    process.env.MONGO_URI ||
    "mongodb://localhost:27017/logistics_platform",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  jwt: {
    secret: process.env.JWT_SECRET || "fallback_secret_do_not_use",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
};

export default config;
