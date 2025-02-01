import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { getItemModel } from "../models/itemModel.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Middleware to check category parameter
const validateCategory = (req, res, next) => {
  const { category } = req.params;
  const allowedCategories = ["anime", "games", "movies", "shows", "books"];
  
  if (!allowedCategories.includes(category)) {
    return res.status(400).json({ error: "Invalid category" });
  }
  req.model = getItemModel(category);
  next();
};

// Get all items for a category
app.get("/:category", validateCategory, async (req, res) => {
  try {
    const items = await req.model.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new item
app.post("/:category", validateCategory, async (req, res) => {
  try {
    const newItem = new req.model(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an item by ID
app.put("/:category/:id", validateCategory, async (req, res) => {
  try {
    const updatedItem = await req.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedItem) return res.status(404).json({ error: "Item not found" });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an item by ID
app.delete("/:category/:id", validateCategory, async (req, res) => {
  try {
    const deletedItem = await req.model.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
