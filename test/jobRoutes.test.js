const mongoose = require("mongoose");
const { connect, closeDatabase, clearDatabase } = require("./testDb");
const { app, api, TEST_USER } = require("./authRequest");
const request = require("supertest");
const Board = require("../models/boardModel");
const { Job, Contact } = require("../models/jobModel");

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

it("rejects a request with no token", async () => {
  const res = await request(app).get("/api/jobs/getOne/x");
  expect(res.status).toBe(401);
});

describe("GET /api/jobs/getOne/:id", () => {
  it("finds a job by its cardID", async () => {
    const cardID = new mongoose.Types.ObjectId();
    await Job.create({ createdBy: TEST_USER, cardID, companyName: "Acme" });

    const res = await api.get(`/api/jobs/getOne/${cardID}`);

    expect(res.status).toBe(200);
    expect(res.body.companyName).toBe("Acme");
  });

  it("returns 404 when no job matches the cardID", async () => {
    const res = await api.get(
      `/api/jobs/getOne/${new mongoose.Types.ObjectId()}`
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});

describe("PUT /api/jobs/:id", () => {
  const setUp = async () => {
    const listID = new mongoose.Types.ObjectId();
    const cardID = new mongoose.Types.ObjectId();
    const board = await Board.create({ createdBy: TEST_USER,
      title: "Job Search",
      isJobSearchBoard: true,
      lists: [
        {
          _id: listID,
          title: "Wishlist",
          cards: [{ _id: cardID, text: "Acme" }],
        },
      ],
    });
    const job = await Job.create({ createdBy: TEST_USER, cardID, boardID: board._id, companyName: "Acme" });
    return { board, job, listID, cardID };
  };

  it("updates the job and syncs the card's text/subtext/isFavorite", async () => {
    const { board, job, listID, cardID } = await setUp();

    const res = await api.put(`/api/jobs/${job._id}`).send({
      companyName: "Acme Corp",
      position: "Engineer",
      isFavorite: true,
      boardID: board._id.toString(),
      cardID: cardID.toString(),
      listID: listID.toString(),
      contacts: [],
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Job updated");
    expect(res.body.data.companyName).toBe("Acme Corp");

    const updatedBoard = await Board.findById(board._id);
    const card = updatedBoard.lists[0].cards[0];
    expect(card.text).toBe("Acme Corp");
    expect(card.subtext).toBe("Engineer");
    expect(card.isFavorite).toBe(true);
  });

  it("creates new contact documents from the submitted contacts", async () => {
    const { board, job, listID, cardID } = await setUp();

    const res = await api
      .put(`/api/jobs/${job._id}`)
      .send({
        companyName: "Acme",
        boardID: board._id.toString(),
        cardID: cardID.toString(),
        listID: listID.toString(),
        contacts: [{ contactName: "Jamie", contactEmail: "jamie@acme.com" }],
      });

    expect(res.status).toBe(200);
    const stored = await Contact.find({ boardID: board._id.toString() });
    expect(stored).toHaveLength(1);
    expect(stored[0].contactName).toBe("Jamie");
  });

  it("updates an existing contact rather than duplicating it", async () => {
    const { board, job, listID, cardID } = await setUp();
    const contactID = new mongoose.Types.ObjectId();
    await Contact.create({ createdBy: TEST_USER,
      _id: contactID,
      contactName: "Jamie",
      boardID: board._id.toString(),
    });

    const res = await api
      .put(`/api/jobs/${job._id}`)
      .send({
        companyName: "Acme",
        boardID: board._id.toString(),
        cardID: cardID.toString(),
        listID: listID.toString(),
        contacts: [
          { _id: contactID.toString(), contactName: "Jamie Doe" },
        ],
      });

    expect(res.status).toBe(200);
    const stored = await Contact.find({ boardID: board._id.toString() });
    expect(stored).toHaveLength(1);
    expect(stored[0].contactName).toBe("Jamie Doe");
  });

  it("requires a company name", async () => {
    const { board, job, listID, cardID } = await setUp();

    const res = await api.put(`/api/jobs/${job._id}`).send({
      boardID: board._id.toString(),
      cardID: cardID.toString(),
      listID: listID.toString(),
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/company name/i);
  });

  it("returns 404 when the board does not exist", async () => {
    const res = await api
      .put(`/api/jobs/${new mongoose.Types.ObjectId()}`)
      .send({ companyName: "Acme", boardID: new mongoose.Types.ObjectId().toString() });

    expect(res.status).toBe(404);
  });

  it("returns 404 when the list does not exist on the board", async () => {
    const { board, job } = await setUp();

    const res = await api.put(`/api/jobs/${job._id}`).send({
      companyName: "Acme",
      boardID: board._id.toString(),
      listID: new mongoose.Types.ObjectId().toString(),
      cardID: new mongoose.Types.ObjectId().toString(),
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 when the card does not exist in the list", async () => {
    const { board, job, listID } = await setUp();

    const res = await api.put(`/api/jobs/${job._id}`).send({
      companyName: "Acme",
      boardID: board._id.toString(),
      listID: listID.toString(),
      cardID: new mongoose.Types.ObjectId().toString(),
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 when the job itself does not exist", async () => {
    const { board, listID, cardID } = await setUp();

    const res = await api
      .put(`/api/jobs/${new mongoose.Types.ObjectId()}`)
      .send({
        companyName: "Acme",
        boardID: board._id.toString(),
        listID: listID.toString(),
        cardID: cardID.toString(),
        contacts: [],
      });

    expect(res.status).toBe(404);
  });
});
