const mongoose = require("mongoose");
const { connect, closeDatabase, clearDatabase } = require("../test/testDb");
const Board = require("./boardModel");

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

describe("Board model", () => {
  it("requires a title", async () => {
    await expect(Board.create({ lists: [] })).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  it("defaults isJobSearchBoard to false", async () => {
    const board = await Board.create({ title: "My Board", lists: [] });
    expect(board.isJobSearchBoard).toBe(false);
  });

  it("requires a title for every list", async () => {
    await expect(
      Board.create({ title: "My Board", lists: [{ cards: [] }] })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it("requires text for every card", async () => {
    await expect(
      Board.create({
        title: "My Board",
        lists: [{ title: "To Do", cards: [{ color: "#fff" }] }],
      })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it("defaults a card's color and isFavorite", async () => {
    const board = await Board.create({
      title: "My Board",
      lists: [{ title: "To Do", cards: [{ text: "Task" }] }],
    });

    const card = board.lists[0].cards[0];
    expect(card.color).toBe("#89949f");
    expect(card.isFavorite).toBe(false);
  });

  it("stamps createdAt and updatedAt", async () => {
    const board = await Board.create({ title: "My Board", lists: [] });
    expect(board.createdAt).toBeInstanceOf(Date);
    expect(board.updatedAt).toBeInstanceOf(Date);
  });
});
