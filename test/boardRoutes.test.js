const request = require("supertest");
const mongoose = require("mongoose");
const { connect, closeDatabase, clearDatabase } = require("./testDb");
const app = require("../app");
const Board = require("../models/boardModel");
const { Job, Contact } = require("../models/jobModel");

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

const userId = () => new mongoose.Types.ObjectId().toString();

describe("POST /api/boards/create", () => {
  it("creates a plain board with no lists", async () => {
    const res = await request(app)
      .post("/api/boards/create")
      .send({ title: "To Do", userId: userId() });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("To Do");
    expect(res.body.lists).toEqual([]);
    expect(res.body.isJobSearchBoard).toBe(false);
  });

  it("seeds a full Job Search board with two jobs and matching contacts", async () => {
    const res = await request(app)
      .post("/api/boards/create")
      .send({ title: "Job Search", userId: userId() });

    expect(res.status).toBe(201);
    expect(res.body.isJobSearchBoard).toBe(true);
    expect(res.body.lists.map((l) => l.title)).toEqual([
      "Wishlist",
      "Applied",
      "Follow-up",
      "Interview",
      "Offers",
      "Rejected",
      "Accepted",
    ]);
    expect(res.body.lists[0].cards.map((c) => c.text)).toEqual(["Google", "Meta"]);

    const jobs = await Job.find({ boardID: res.body._id });
    expect(jobs).toHaveLength(2);
    expect(jobs.map((j) => j.companyName).sort()).toEqual(["Google", "Meta"]);

    const contacts = await Contact.find({ boardID: res.body._id });
    expect(contacts).toHaveLength(2);
  });

  it("requires a title and a userId", async () => {
    const res = await request(app).post("/api/boards/create").send({});
    expect(res.status).toBe(400);
  });
});

describe("GET /api/boards/getAll/:userId", () => {
  it("returns only boards created by the given user", async () => {
    const mine = userId();
    await Board.create({ title: "Mine", createdBy: mine, lists: [] });
    await Board.create({ title: "Theirs", createdBy: userId(), lists: [] });

    const res = await request(app).get(`/api/boards/getAll/${mine}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe("Mine");
  });
});

describe("GET /api/boards/:id", () => {
  it("returns a board by id", async () => {
    const board = await Board.create({ title: "My Board", lists: [] });
    const res = await request(app).get(`/api/boards/${board._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("My Board");
  });

  it("returns 404 for a board that does not exist", async () => {
    const res = await request(app).get(`/api/boards/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/boards/:id", () => {
  it("updates a board's fields", async () => {
    const board = await Board.create({ title: "Old Title", lists: [] });
    const res = await request(app)
      .put(`/api/boards/${board._id}`)
      .send({ title: "New Title" });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("New Title");
  });

  it("returns 404 for a board that does not exist", async () => {
    const res = await request(app)
      .put(`/api/boards/${new mongoose.Types.ObjectId()}`)
      .send({ title: "New Title" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/boards/:id", () => {
  it("deletes the board along with its jobs and contacts", async () => {
    const board = await Board.create({ title: "My Board", lists: [] });
    await Job.create({
      cardID: new mongoose.Types.ObjectId(),
      companyName: "Acme",
      boardID: board._id,
    });
    await Contact.create({ contactName: "Jamie", boardID: board._id.toString() });

    const res = await request(app).delete(`/api/boards/${board._id}`);

    expect(res.status).toBe(200);
    expect(await Board.findById(board._id)).toBeNull();
    expect(await Job.countDocuments({ boardID: board._id })).toBe(0);
    expect(await Contact.countDocuments({ boardID: board._id.toString() })).toBe(0);
  });

  it("returns 404 for a board that does not exist", async () => {
    const res = await request(app).delete(`/api/boards/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });
});

describe("Lists", () => {
  it("creates a list on a board", async () => {
    const board = await Board.create({ title: "My Board", lists: [] });

    const res = await request(app)
      .post("/api/boards/lists/createList")
      .send({ title: "To Do", boardID: board._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe("To Do");
  });

  it("requires a title and boardID to create a list", async () => {
    const res = await request(app).post("/api/boards/lists/createList").send({});
    expect(res.status).toBe(400);
  });

  it("returns 404 creating a list on a board that does not exist", async () => {
    const res = await request(app)
      .post("/api/boards/lists/createList")
      .send({ title: "To Do", boardID: new mongoose.Types.ObjectId().toString() });
    expect(res.status).toBe(404);
  });

  it("updates a list's title", async () => {
    const listID = new mongoose.Types.ObjectId();
    const board = await Board.create({
      title: "My Board",
      lists: [{ _id: listID, title: "To Do", cards: [] }],
    });

    const res = await request(app)
      .put(`/api/boards/lists/updateList/${listID}`)
      .send({ title: "Backlog", boardID: board._id.toString() });

    expect(res.status).toBe(201);
    const updated = await Board.findById(board._id);
    expect(updated.lists[0].title).toBe("Backlog");
  });

  it("requires a title and boardID to update a list", async () => {
    const res = await request(app)
      .put(`/api/boards/lists/updateList/${new mongoose.Types.ObjectId()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 404 updating a list on a board that does not exist", async () => {
    const res = await request(app)
      .put(`/api/boards/lists/updateList/${new mongoose.Types.ObjectId()}`)
      .send({
        title: "Backlog",
        boardID: new mongoose.Types.ObjectId().toString(),
      });
    expect(res.status).toBe(404);
  });

  it("returns 404 updating a list that does not exist on the board", async () => {
    const board = await Board.create({ title: "My Board", lists: [] });
    const res = await request(app)
      .put(`/api/boards/lists/updateList/${new mongoose.Types.ObjectId()}`)
      .send({ title: "Backlog", boardID: board._id.toString() });
    expect(res.status).toBe(404);
  });

  it("deletes a list", async () => {
    const listID = new mongoose.Types.ObjectId();
    const board = await Board.create({
      title: "My Board",
      lists: [{ _id: listID, title: "To Do", cards: [] }],
    });

    const res = await request(app)
      .delete(`/api/boards/lists/deleteList/${listID}`)
      .send({ boardID: board._id.toString() });

    expect(res.status).toBe(201);
    const updated = await Board.findById(board._id);
    expect(updated.lists).toHaveLength(0);
  });

  it("returns 404 deleting a list on a board that does not exist", async () => {
    const res = await request(app)
      .delete(`/api/boards/lists/deleteList/${new mongoose.Types.ObjectId()}`)
      .send({ boardID: new mongoose.Types.ObjectId().toString() });
    expect(res.status).toBe(404);
  });
});

describe("Cards", () => {
  const boardWithList = async (isJobSearchBoard = false) => {
    const listID = new mongoose.Types.ObjectId();
    const board = await Board.create({
      title: "My Board",
      isJobSearchBoard,
      lists: [{ _id: listID, title: "To Do", cards: [] }],
    });
    return { board, listID };
  };

  it("creates a card on a plain board", async () => {
    const { board, listID } = await boardWithList(false);

    const res = await request(app).post("/api/boards/cards/createCard").send({
      text: "Task 1",
      listID: listID.toString(),
      boardID: board._id.toString(),
      isJobSearchBoard: false,
    });

    expect(res.status).toBe(201);
    expect(res.body.text).toBe("Task 1");
    const updated = await Board.findById(board._id);
    expect(updated.lists[0].cards).toHaveLength(1);
  });

  it("also creates a job and contact when the board is a job-search board", async () => {
    const { board, listID } = await boardWithList(true);

    const res = await request(app).post("/api/boards/cards/createCard").send({
      text: "Acme",
      listID: listID.toString(),
      boardID: board._id.toString(),
      isJobSearchBoard: true,
      userId: userId(),
    });

    expect(res.status).toBe(201);
    const jobs = await Job.find({ boardID: board._id.toString() });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].companyName).toBe("Acme");
    const contacts = await Contact.find({ boardID: board._id.toString() });
    expect(contacts).toHaveLength(1);
  });

  it("requires text, listID and boardID to create a card", async () => {
    const res = await request(app).post("/api/boards/cards/createCard").send({});
    expect(res.status).toBe(400);
  });

  it("returns 404 creating a card on a list that does not exist", async () => {
    const { board } = await boardWithList(false);
    const res = await request(app).post("/api/boards/cards/createCard").send({
      text: "Task 1",
      listID: new mongoose.Types.ObjectId().toString(),
      boardID: board._id.toString(),
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 creating a card on a board that does not exist", async () => {
    const res = await request(app).post("/api/boards/cards/createCard").send({
      text: "Task 1",
      listID: new mongoose.Types.ObjectId().toString(),
      boardID: new mongoose.Types.ObjectId().toString(),
    });
    expect(res.status).toBe(404);
  });

  it("updates a card's text", async () => {
    const cardID = new mongoose.Types.ObjectId();
    const listID = new mongoose.Types.ObjectId();
    const board = await Board.create({
      title: "My Board",
      lists: [{ _id: listID, title: "To Do", cards: [{ _id: cardID, text: "Old" }] }],
    });

    const res = await request(app).put(`/api/boards/cards/updateCard/${cardID}`).send({
      text: "New",
      listID: listID.toString(),
      boardID: board._id.toString(),
    });

    expect(res.status).toBe(201);
    const updated = await Board.findById(board._id);
    expect(updated.lists[0].cards[0].text).toBe("New");
  });

  it("returns 404 updating a card that does not exist", async () => {
    const { board, listID } = await boardWithList(false);
    const res = await request(app)
      .put(`/api/boards/cards/updateCard/${new mongoose.Types.ObjectId()}`)
      .send({ text: "New", listID: listID.toString(), boardID: board._id.toString() });
    expect(res.status).toBe(404);
  });

  it("requires text, listID and boardID to update a card", async () => {
    const res = await request(app)
      .put(`/api/boards/cards/updateCard/${new mongoose.Types.ObjectId()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 404 updating a card on a board that does not exist", async () => {
    const res = await request(app)
      .put(`/api/boards/cards/updateCard/${new mongoose.Types.ObjectId()}`)
      .send({
        text: "New",
        listID: new mongoose.Types.ObjectId().toString(),
        boardID: new mongoose.Types.ObjectId().toString(),
      });
    expect(res.status).toBe(404);
  });

  it("returns 404 updating a card on a list that does not exist", async () => {
    const { board } = await boardWithList(false);
    const res = await request(app)
      .put(`/api/boards/cards/updateCard/${new mongoose.Types.ObjectId()}`)
      .send({
        text: "New",
        listID: new mongoose.Types.ObjectId().toString(),
        boardID: board._id.toString(),
      });
    expect(res.status).toBe(404);
  });

  it("deletes a card and its associated job", async () => {
    const cardID = new mongoose.Types.ObjectId();
    const listID = new mongoose.Types.ObjectId();
    const board = await Board.create({
      title: "My Board",
      lists: [{ _id: listID, title: "To Do", cards: [{ _id: cardID, text: "Task" }] }],
    });
    await Job.create({ cardID, companyName: "Acme", boardID: board._id });

    const res = await request(app)
      .delete(`/api/boards/cards/deleteCard/${cardID}`)
      .send({ listID: listID.toString(), boardID: board._id.toString() });

    expect(res.status).toBe(201);
    const updated = await Board.findById(board._id);
    expect(updated.lists[0].cards).toHaveLength(0);
    expect(await Job.findOne({ cardID })).toBeNull();
  });

  it("deletes a card with no associated job just fine", async () => {
    const { board, listID } = await boardWithList(false);
    const cardRes = await request(app).post("/api/boards/cards/createCard").send({
      text: "Task 1",
      listID: listID.toString(),
      boardID: board._id.toString(),
    });

    const res = await request(app)
      .delete(`/api/boards/cards/deleteCard/${cardRes.body._id}`)
      .send({ listID: listID.toString(), boardID: board._id.toString() });

    expect(res.status).toBe(201);
    const updated = await Board.findById(board._id);
    expect(updated.lists[0].cards).toHaveLength(0);
  });

  it("returns 404 deleting a card on a board that does not exist", async () => {
    const res = await request(app)
      .delete(`/api/boards/cards/deleteCard/${new mongoose.Types.ObjectId()}`)
      .send({
        listID: new mongoose.Types.ObjectId().toString(),
        boardID: new mongoose.Types.ObjectId().toString(),
      });
    expect(res.status).toBe(404);
  });

  it("returns 404 deleting a card on a list that does not exist", async () => {
    const { board } = await boardWithList(false);
    const res = await request(app)
      .delete(`/api/boards/cards/deleteCard/${new mongoose.Types.ObjectId()}`)
      .send({
        listID: new mongoose.Types.ObjectId().toString(),
        boardID: board._id.toString(),
      });
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/boards/all/drag", () => {
  it("reorders lists", async () => {
    const listA = new mongoose.Types.ObjectId();
    const listB = new mongoose.Types.ObjectId();
    const board = await Board.create({
      title: "My Board",
      lists: [
        { _id: listA, title: "A", cards: [] },
        { _id: listB, title: "B", cards: [] },
      ],
    });

    const res = await request(app).put("/api/boards/all/drag").send({
      type: "list",
      boardID: board._id.toString(),
      droppableIndexStart: 0,
      droppableIndexEnd: 1,
    });

    expect(res.status).toBe(201);
    expect(res.body.lists.map((l) => l.title)).toEqual(["B", "A"]);
  });

  it("reorders cards within the same list", async () => {
    const listID = new mongoose.Types.ObjectId();
    const board = await Board.create({
      title: "My Board",
      lists: [
        {
          _id: listID,
          title: "To Do",
          cards: [{ text: "One" }, { text: "Two" }],
        },
      ],
    });

    const res = await request(app).put("/api/boards/all/drag").send({
      type: "card",
      boardID: board._id.toString(),
      droppableIdStart: listID.toString(),
      droppableIdEnd: listID.toString(),
      droppableIndexStart: 0,
      droppableIndexEnd: 1,
    });

    expect(res.status).toBe(201);
    expect(res.body.lists[0].cards.map((c) => c.text)).toEqual(["Two", "One"]);
  });

  it("moves a card to a different list", async () => {
    const listA = new mongoose.Types.ObjectId();
    const listB = new mongoose.Types.ObjectId();
    const board = await Board.create({
      title: "My Board",
      lists: [
        { _id: listA, title: "A", cards: [{ text: "One" }] },
        { _id: listB, title: "B", cards: [] },
      ],
    });

    const res = await request(app).put("/api/boards/all/drag").send({
      type: "card",
      boardID: board._id.toString(),
      droppableIdStart: listA.toString(),
      droppableIdEnd: listB.toString(),
      droppableIndexStart: 0,
      droppableIndexEnd: 0,
    });

    expect(res.status).toBe(201);
    expect(res.body.lists[0].cards).toHaveLength(0);
    expect(res.body.lists[1].cards.map((c) => c.text)).toEqual(["One"]);
  });

  it("returns 404 when the board does not exist", async () => {
    const res = await request(app).put("/api/boards/all/drag").send({
      type: "list",
      boardID: new mongoose.Types.ObjectId().toString(),
      droppableIndexStart: 0,
      droppableIndexEnd: 1,
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when the same-list drag targets a list that does not exist", async () => {
    const board = await Board.create({ title: "My Board", lists: [] });
    const sameId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).put("/api/boards/all/drag").send({
      type: "card",
      boardID: board._id.toString(),
      droppableIdStart: sameId,
      droppableIdEnd: sameId,
      droppableIndexStart: 0,
      droppableIndexEnd: 0,
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when a cross-list drag's source list does not exist", async () => {
    const listB = new mongoose.Types.ObjectId();
    const board = await Board.create({
      title: "My Board",
      lists: [{ _id: listB, title: "B", cards: [] }],
    });
    const res = await request(app).put("/api/boards/all/drag").send({
      type: "card",
      boardID: board._id.toString(),
      droppableIdStart: new mongoose.Types.ObjectId().toString(),
      droppableIdEnd: listB.toString(),
      droppableIndexStart: 0,
      droppableIndexEnd: 0,
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when a cross-list drag's destination list does not exist", async () => {
    const listA = new mongoose.Types.ObjectId();
    const board = await Board.create({
      title: "My Board",
      lists: [{ _id: listA, title: "A", cards: [{ text: "One" }] }],
    });
    const res = await request(app).put("/api/boards/all/drag").send({
      type: "card",
      boardID: board._id.toString(),
      droppableIdStart: listA.toString(),
      droppableIdEnd: new mongoose.Types.ObjectId().toString(),
      droppableIndexStart: 0,
      droppableIndexEnd: 0,
    });
    expect(res.status).toBe(404);
  });
});
