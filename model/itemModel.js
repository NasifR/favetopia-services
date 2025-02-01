import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    rating: { type: Number, required: true },
    status: { type: String, required: true },
    cover: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const models = {};

export const getItemModel = (category) => {
  if (!models[category]) {
    models[category] = mongoose.model(category, itemSchema);
  }
  return models[category];
};
