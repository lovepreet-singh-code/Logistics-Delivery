import { Kafka, Producer, Consumer, logLevel } from "kafkajs";
import config from "./index";

export let isKafkaAvailable = false;

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  logLevel: logLevel.ERROR,
  connectionTimeout: 3000,
  requestTimeout: 5000,
  retry: {
    initialRetryTime: 300,
    retries: 2,
  },
});

export const producer: Producer = kafka.producer({
  retry: {
    initialRetryTime: 300,
    retries: 2,
  },
});

export const consumer: Consumer = kafka.consumer({
  groupId: config.kafka.groupId,
  retry: { retries: 2 },
});

// Second consumer for dispatch.manifested (KafkaJS requires separate instances)
export const dispatchConsumer: Consumer = kafka.consumer({
  groupId: `${config.kafka.groupId}-dispatch`,
  retry: { retries: 2 },
});

// Third consumer for delivery.completed
export const deliveryConsumer: Consumer = kafka.consumer({
  groupId: `${config.kafka.groupId}-delivery`,
  retry: { retries: 2 },
});

export const connectProducer = async (): Promise<void> => {
  try {
    await producer.connect();
    isKafkaAvailable = true;
    console.log("✅ Kafka Producer connected (order-service)");
  } catch (error) {
    isKafkaAvailable = false;
    console.warn("[KAFKA WARNING] Broker not ready, running in degraded mode");
  }
};

export const publishOrderEvent = async (topic: string, message: any): Promise<void> => {
  if (!isKafkaAvailable) {
    return;
  }
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
    console.log(`📤 Published event to ${topic}`);
  } catch (error) {
    console.warn("[KAFKA WARNING] Broker not ready, running in degraded mode");
  }
};

export const startConsumer = async (): Promise<void> => {
  if (!isKafkaAvailable) {
    return;
  }
  try {
    const testConsumer = kafka.consumer({ 
      groupId: 'order-service-group',
      retry: { retries: 2 },
    });
    await testConsumer.connect();
    await testConsumer.subscribe({ topic: 'logistics.orders', fromBeginning: true });
    console.log("✅ Kafka Test Consumer subscribed to logistics.orders");
    
    await testConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(`Event Received via Kafka [${topic}]: ${message.value?.toString()}`);
      },
    });
  } catch (error) {
    console.warn("[KAFKA WARNING] Broker not ready, running in degraded mode");
  }
};

export const disconnectKafka = async (): Promise<void> => {
  try {
    if (isKafkaAvailable) {
      await producer.disconnect().catch(() => {});
      await consumer.disconnect().catch(() => {});
      await dispatchConsumer.disconnect().catch(() => {});
      await deliveryConsumer.disconnect().catch(() => {});
      console.log("🛑 Kafka connections closed");
    }
  } catch (err) {
    // Ignore errors on shutdown
  }
};

export default kafka;
