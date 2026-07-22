import { Kafka, Producer, logLevel } from "kafkajs";
import config from "./index";

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
  logLevel: logLevel.WARN,
});

export const producer: Producer = kafka.producer();

export default kafka;
