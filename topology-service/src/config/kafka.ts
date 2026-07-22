import { Kafka, Producer, Consumer, logLevel } from "kafkajs";
import config from "./index";

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
  logLevel: logLevel.WARN,
});

export const producer: Producer = kafka.producer();
export const consumer: Consumer = kafka.consumer({
  groupId: config.kafka.groupId,
});

export default kafka;
