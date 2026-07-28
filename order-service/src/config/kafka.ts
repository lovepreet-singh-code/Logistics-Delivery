import { Kafka, Producer, Consumer, logLevel } from "kafkajs";
import config from "./index";

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
  logLevel: logLevel.WARN,
});

export const producer: Producer = kafka.producer();

export const consumer: Consumer = kafka.consumer({
  groupId: config.kafka.groupId,
});

// Second consumer for dispatch.manifested (KafkaJS requires separate instances)
export const dispatchConsumer: Consumer = kafka.consumer({
  groupId: `${config.kafka.groupId}-dispatch`,
});

export const connectProducer = async () => {
  try {
    await producer.connect();
    console.log("✅ Kafka Producer connected (order-service)");
  } catch (error) {
    console.error("❌ Kafka Producer connection error:", error);
  }
};

export const publishOrderEvent = async (topic: string, message: any) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
    console.log(`📤 Published event to ${topic}`);
  } catch (error) {
    console.error(`❌ Error publishing to ${topic}:`, error);
  }
};

export const startConsumer = async () => {
  try {
    const testConsumer = kafka.consumer({ groupId: 'order-service-group' });
    await testConsumer.connect();
    await testConsumer.subscribe({ topic: 'logistics.orders', fromBeginning: true });
    console.log("✅ Kafka Test Consumer subscribed to logistics.orders");
    
    await testConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(`Event Received via Kafka [${topic}]: ${message.value?.toString()}`);
      },
    });
  } catch (error) {
    console.error("❌ Kafka Consumer connection error:", error);
  }
};

export const disconnectKafka = async () => {
  try {
    await producer.disconnect();
    await consumer.disconnect();
    await dispatchConsumer.disconnect();
    console.log("🛑 Kafka connections closed");
  } catch (err) {
    console.error("Error disconnecting Kafka:", err);
  }
};

export default kafka;
