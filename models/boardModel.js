const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const card = {
  text: {
    type: String,
    required: [true, "Please enter a card name"],
  },
  subtext: {
    type: String,
  },
  color: { type: String, default: "#89949f" },
  isFavorite: { type: Boolean, default: false },
};

const boardSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter a board name"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    lists: [
      {
        title: {
          type: String,
          required: [true, "Please enter a list name"],
        },
        cards: [card],
      },
    ],
    isJobSearchBoard: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Board = mongoose.model("Board", boardSchema);

module.exports = Board;
