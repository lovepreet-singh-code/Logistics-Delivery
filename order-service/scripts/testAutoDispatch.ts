import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// If running locally on host machine, mapping the container name 'mongodb' to 'localhost' may be needed
const MONGO_URI = process.env.MONGO_URI 
  ? process.env.MONGO_URI.replace('mongodb:27017', 'localhost:27017')
  : "mongodb://admin:admin_secret@localhost:27017/logistics_platform?authSource=admin";

const run = async () => {
  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB.`);

    const usersCollection = mongoose.connection.db!.collection("users");
    const ordersCollection = mongoose.connection.db!.collection("orders");

    // a. Update all users with the role of agent or driver to explicitly have status: 'AVAILABLE' and availabilityStatus: 'AVAILABLE'
    console.log(`Updating agents and drivers to AVAILABLE...`);
    const updateResult = await usersCollection.updateMany(
      { role: { $in: ["AGENT", "DRIVER", "agent", "driver"] } },
      { $set: { status: "AVAILABLE", availabilityStatus: "AVAILABLE" } }
    );
    console.log(`Updated ${updateResult.modifiedCount} agents/drivers.`);

    // Also update vehicles just in case
    const vehiclesCollection = mongoose.connection.db!.collection("vehicles");
    await vehiclesCollection.updateMany({}, { $set: { status: "AVAILABLE" } });

    // b. Insert 3 new mock orders with status: 'ORDER_PLACED'
    const mockOrders = [
      {
        customerId: new mongoose.Types.ObjectId(),
        awb: "TEST-100",
        trackingId: "TRK-TEST-100",
        status: "ORDER_PLACED",
        pickupAddress: {
          pinCode: "100001",
          fullAddress: "Test Pickup 1",
          lat: 0,
          lng: 0
        },
        deliveryAddress: {
          pinCode: "100002",
          fullAddress: "Test Delivery 1",
          lat: 0,
          lng: 0
        },
        parcelDetails: {
          weightKg: 1,
          dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10 },
          declaredValue: 100,
          restrictedItemsConfirmed: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        customerId: new mongoose.Types.ObjectId(),
        awb: "TEST-200",
        trackingId: "TRK-TEST-200",
        status: "ORDER_PLACED",
        pickupAddress: {
          pinCode: "200001",
          fullAddress: "Test Pickup 2",
          lat: 0,
          lng: 0
        },
        deliveryAddress: {
          pinCode: "200002",
          fullAddress: "Test Delivery 2",
          lat: 0,
          lng: 0
        },
        parcelDetails: {
          weightKg: 2,
          dimensions: { lengthCm: 20, widthCm: 20, heightCm: 20 },
          declaredValue: 200,
          restrictedItemsConfirmed: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        customerId: new mongoose.Types.ObjectId(),
        awb: "TEST-300",
        trackingId: "TRK-TEST-300",
        status: "ORDER_PLACED",
        pickupAddress: {
          pinCode: "300001",
          fullAddress: "Test Pickup 3",
          lat: 0,
          lng: 0
        },
        deliveryAddress: {
          pinCode: "300002",
          fullAddress: "Test Delivery 3",
          lat: 0,
          lng: 0
        },
        parcelDetails: {
          weightKg: 3,
          dimensions: { lengthCm: 30, widthCm: 30, heightCm: 30 },
          declaredValue: 300,
          restrictedItemsConfirmed: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log(`Inserting mock orders...`);
    await ordersCollection.insertMany(mockOrders);
    console.log(`Inserted 3 mock orders.`);

    console.log(`✅ Test data seeded successfully! Keep the order-service terminal open and watch for the next Cron tick to assign these orders.`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error seeding test data:", err);
    process.exit(1);
  }
};

run();
