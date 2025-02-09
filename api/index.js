const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const admin = require("firebase-admin");
const { getItemModel } = require("../model/itemModel");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

// Middleware: Authenticate Firebase Users
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// Middleware: Validate Category
const validateCategory = (req, res, next) => {
  const { category } = req.params;
  const allowedCategories = ["anime", "games", "movies", "shows", "books"];

  if (!allowedCategories.includes(category)) {
    return res.status(400).json({ error: "Invalid category" });
  }
  req.model = getItemModel(category);
  next();
};

// Get all items for the logged-in user
app.get("/:category", authenticateUser, validateCategory, async (req, res) => {
  try {
    const items = await req.model.find({ userId: req.user.uid });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new item for the logged-in user
app.post("/:category", authenticateUser, validateCategory, async (req, res) => {
  try {
    const { title, rating, status, cover } = req.body;
    const newItem = new req.model({ title, rating, status, cover, userId: req.user.uid });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an item (Only if the user is the owner)
app.put("/:category/:id", authenticateUser, validateCategory, async (req, res) => {
  try {
    const updatedItem = await req.model.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.uid }, // Ensure user owns the item
      req.body,
      { new: true }
    );
    if (!updatedItem) return res.status(404).json({ error: "Item not found or unauthorized" });

    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an item (Only if the user is the owner)
app.delete("/:category/:id", authenticateUser, validateCategory, async (req, res) => {
  try {
    const deletedItem = await req.model.findOneAndDelete({ _id: req.params.id, userId: req.user.uid });

    if (!deletedItem) return res.status(404).json({ error: "Item not found or unauthorized" });

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
