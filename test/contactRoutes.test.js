const mongoose = require("mongoose");
const { connect, closeDatabase, clearDatabase } = require("./testDb");
const { app, api, TEST_USER, OTHER_USER } = require("./authRequest");
const request = require("supertest");
const { Contact } = require("../models/jobModel");

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

it("rejects a request with no token", async () => {
  const res = await request(app).get("/api/contacts/getAll/x");
  expect(res.status).toBe(401);
});

describe("GET /api/contacts/getAll/:boardID", () => {
  it("returns contacts belonging to the board", async () => {
    const boardID = new mongoose.Types.ObjectId().toString();
    await Contact.create({ createdBy: TEST_USER, contactName: "Jamie", boardID });
    await Contact.create({ createdBy: TEST_USER, contactName: "Alex", boardID: new mongoose.Types.ObjectId().toString() });

    const res = await api.get(`/api/contacts/getAll/${boardID}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].contactName).toBe("Jamie");
  });

  it("returns an empty array when the board has no contacts", async () => {
    const res = await api.get(
      `/api/contacts/getAll/${new mongoose.Types.ObjectId()}`
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /api/contacts/getOne/:id", () => {
  it("finds a contact by id", async () => {
    const contact = await Contact.create({ createdBy: TEST_USER, contactName: "Jamie" });

    const res = await api.get(`/api/contacts/getOne/${contact._id}`);

    expect(res.status).toBe(200);
    expect(res.body.contactName).toBe("Jamie");
  });

  it("does not return another user's contact", async () => {
    const contact = await Contact.create({ createdBy: OTHER_USER, contactName: "Theirs" });
    const res = await api.get(`/api/contacts/getOne/${contact._id}`);
    expect(res.status).toBe(404);
  });

  it("returns 404 for a contact that does not exist", async () => {
    const res = await api.get(
      `/api/contacts/getOne/${new mongoose.Types.ObjectId()}`
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});

describe("DELETE /api/contacts/delete/:contactID", () => {
  it("deletes the contact", async () => {
    const contact = await Contact.create({ createdBy: TEST_USER, contactName: "Jamie" });

    const res = await api.delete(`/api/contacts/delete/${contact._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
    expect(await Contact.findById(contact._id)).toBeNull();
  });

  it("returns 404 when deleting a contact that does not exist", async () => {
    const res = await api.delete(
      `/api/contacts/delete/${new mongoose.Types.ObjectId()}`
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});
