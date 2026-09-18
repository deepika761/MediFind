const mongoose = require("mongoose");
require("dotenv").config();

const Pharmacy = require("./models/Pharmacy");
const Medicine = require("./models/Medicine");
const Inventory = require("./models/Inventory");

const pharmacies = [
  {
    name: "MediCare Pharmacy",
    address: "MG Road, Bengaluru",
    phone: "9876543210",
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    name: "HealthPlus Pharmacy",
    address: "Indiranagar, Bengaluru",
    phone: "9876543211",
    latitude: 12.9784,
    longitude: 77.6408,
  },
  {
    name: "CityMed Pharmacy",
    address: "Koramangala, Bengaluru",
    phone: "9876543212",
    latitude: 12.9352,
    longitude: 77.6245,
  },
];

const medicines = [
  {
    name: "Paracetamol 500mg",
    manufacturer: "ABC Pharma",
    batchNumber: "PARA001",
    expiryDate: "2027-12-31",
    price: 25,
  },
  {
    name: "Amoxicillin 500mg",
    manufacturer: "XYZ Pharma",
    batchNumber: "AMOX001",
    expiryDate: "2027-10-31",
    price: 80,
  },
  {
    name: "Cetirizine 10mg",
    manufacturer: "Health Pharma",
    batchNumber: "CET001",
    expiryDate: "2028-06-30",
    price: 40,
  },
];

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("MongoDB Connected");

    // Clear old data
    await Pharmacy.deleteMany({});
    await Medicine.deleteMany({});
    await Inventory.deleteMany({});

    // Add pharmacies
    const savedPharmacies = await Pharmacy.insertMany(pharmacies);

    // Add medicines
    const savedMedicines = await Medicine.insertMany(medicines);

    // Add inventory
    const inventory = [
      {
        medicine: savedMedicines[0]._id,
        pharmacy: savedPharmacies[0]._id,
        quantity: 50,
      },
      {
        medicine: savedMedicines[0]._id,
        pharmacy: savedPharmacies[1]._id,
        quantity: 20,
      },
      {
        medicine: savedMedicines[0]._id,
        pharmacy: savedPharmacies[2]._id,
        quantity: 5,
      },

      {
        medicine: savedMedicines[1]._id,
        pharmacy: savedPharmacies[0]._id,
        quantity: 15,
      },
      {
        medicine: savedMedicines[1]._id,
        pharmacy: savedPharmacies[2]._id,
        quantity: 8,
      },

      {
        medicine: savedMedicines[2]._id,
        pharmacy: savedPharmacies[1]._id,
        quantity: 30,
      },
      {
        medicine: savedMedicines[2]._id,
        pharmacy: savedPharmacies[2]._id,
        quantity: 12,
      },
    ];

    await Inventory.insertMany(inventory);

    console.log("Pharmacies added successfully!");
    console.log("Medicines added successfully!");
    console.log("Inventory added successfully!");

    await mongoose.connection.close();
    console.log("Database connection closed.");
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });