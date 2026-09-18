const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Pharmacy = require("./models/Pharmacy");
const Medicine = require("./models/Medicine");
const Inventory = require("./models/Inventory");

const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("MediFind Backend is Running!");
});

// Search medicine
app.post("/api/search", async (req, res) => {
  try {
    const { medicine, quantity } = req.body;

    if (!medicine || !quantity) {
      return res.status(400).json({
        message: "Please enter medicine name and quantity.",
      });
    }

    const requestedQuantity = Number(quantity);

    // Find medicine
    const medicineData = await Medicine.findOne({
      name: { $regex: medicine, $options: "i" },
    });

    if (!medicineData) {
      return res.json({
        message: "Medicine not found.",
        results: [],
      });
    }

    // Find pharmacies having this medicine
    const inventoryData = await Inventory.find({
      medicine: medicineData._id,
    })
      .populate("pharmacy")
      .populate("medicine");

    // Keep pharmacies that have enough quantity
    const results = inventoryData
      .filter((item) => item.quantity >= requestedQuantity)
      .map((item) => ({
        pharmacyName: item.pharmacy.name,
        address: item.pharmacy.address,
        phone: item.pharmacy.phone,
        quantityAvailable: item.quantity,
        medicineName: item.medicine.name,
        manufacturer: item.medicine.manufacturer,
        batchNumber: item.medicine.batchNumber,
        expiryDate: item.medicine.expiryDate,
        price: item.medicine.price,
        latitude: item.pharmacy.latitude,
        longitude: item.pharmacy.longitude,
      }));

    if (results.length === 0) {
      return res.json({
        message: "Medicine found, but requested quantity is not available.",
        results: [],
      });
    }

    res.json({
      message: `${results.length} pharmacy/pharmacies found.`,
      results,
    });
  } catch (error) {
    console.error("Search Error:", error);

    res.status(500).json({
      message: "Server error while searching.",
    });
  }
});

// Connect MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error.message);
  });