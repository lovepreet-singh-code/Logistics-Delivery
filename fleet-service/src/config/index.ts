import dotenv from "dotenv";
dotenv.config();

interface IConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
}

const config: IConfig = {
  port: parseInt(process.env.PORT || "4003", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri:
    process.env.MONGO_URI ||
    "mongodb://admin:admin_secret@mongodb:27017/logistics_platform?authSource=admin",
};

export default config;
