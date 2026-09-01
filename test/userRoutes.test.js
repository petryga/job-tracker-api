const request = require("supertest");
const mongoose = require("mongoose");
const { connect, closeDatabase, clearDatabase } = require("./testDb");
const { app, api, TEST_USER, OTHER_USER } = require("./authRequest");
const Board = require("../models/boardModel");
const { Job, Contact } = require("../models/jobModel");

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

describe("DELETE /api/users/me", () => {
  it("deletes everything the caller owns and nothing else", async () => {
    const mine = await Board.create({ createdBy: TEST_USER, title: "Mine", lists: [] });
    await Job.create({
      createdBy: TEST_USER,
      cardID: new mongoose.Types.ObjectId(),
      companyName: "Acme",
      boardID: mine._id,
    });
    await Contact.create({ createdBy: TEST_USER, contactName: "Jamie", boardID: mine._id.toString() });

    const theirs = await Board.create({ createdBy: OTHER_USER, title: "Theirs", lists: [] });

    const res = await api.delete("/api/users/me");

    expect(res.status).toBe(200);
    expect(await Board.countDocuments({ createdBy: TEST_USER })).toBe(0);
    expect(await Job.countDocuments({ createdBy: TEST_USER })).toBe(0);
    expect(await Contact.countDocuments({ createdBy: TEST_USER })).toBe(0);
    // the other user's board is untouched
    expect(await Board.findById(theirs._id)).not.toBeNull();
  });

  it("rejects a request with no token", async () => {
    const res = await request(app).delete("/api/users/me");
    expect(res.status).toBe(401);
  });
});
