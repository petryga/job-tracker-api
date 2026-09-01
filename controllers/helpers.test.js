const { getRandomColor, jobSearchLists, jobSearchCards, notFoundError } = require("./helpers");

describe("getRandomColor", () => {
  it("returns a hex color from the known palette", () => {
    for (let i = 0; i < 20; i++) {
      expect(getRandomColor()).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});

describe("jobSearchCards", () => {
  it("seeds a Google and a Figma card with the given ids", () => {
    const cards = jobSearchCards("card-1", "card-2");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({ _id: "card-1", text: "Google", isFavorite: true });
    expect(cards[1]).toMatchObject({ _id: "card-2", text: "Figma", isFavorite: false });
  });
});

describe("jobSearchLists", () => {
  it("seeds seven lists with cards only in the first", () => {
    const lists = jobSearchLists("card-1", "card-2");
    expect(lists.map((l) => l.title)).toEqual([
      "Wishlist",
      "Applied",
      "Follow-up",
      "Interview",
      "Offers",
      "Rejected",
      "Accepted",
    ]);
    expect(lists[0].cards).toHaveLength(2);
    expect(lists.slice(1).every((l) => l.cards.length === 0)).toBe(true);
  });
});

describe("notFoundError", () => {
  it("sends a 404 with a name-specific message", () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    notFoundError(res, "Board");

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Board not found" });
  });
});
