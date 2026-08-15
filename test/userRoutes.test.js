const request = require("supertest");
const mongoose = require("mongoose");
const { connect, closeDatabase, clearDatabase } = require("./testDb");
const app = require("../app");
const User = require("../models/userModel");
const Board = require("../models/boardModel");
const { Job } = require("../models/jobModel");

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

describe("POST /api/users/register", () => {
  it("creates a user and returns a token", async () => {
    const res = await request(app).post("/api/users/register").send({
      name: "Ada",
      email: "ada@example.com",
      password: "plaintext1",
      confirm_password: "plaintext1",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("ada@example.com");
    expect(res.body.data.token).toEqual(expect.any(String));

    const stored = await User.findOne({ email: "ada@example.com" });
    expect(stored).not.toBeNull();
  });

  // Note: registerUser's validation `if` blocks don't `return` after
  // res.status().json() (see controllers/userController.js). In practice this
  // is harmless from the client's point of view — Express only honors the
  // first response written, so the checks below still observe correct status
  // codes and messages — but it does mean every one of these requests throws
  // an unhandled error server-side after the response is already flushed
  // (e.g. calling `.match` on an undefined email, or `.length` on an
  // undefined password). Worth cleaning up with early `return`s.
  it("requires an email", async () => {
    const res = await request(app).post("/api/users/register").send({
      name: "Ada",
      password: "plaintext1",
      confirm_password: "plaintext1",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/enter an email/i);
  });

  it("requires a name", async () => {
    const res = await request(app).post("/api/users/register").send({
      email: "ada@example.com",
      password: "plaintext1",
      confirm_password: "plaintext1",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/enter a name/i);
  });

  it("requires a password and confirm_password", async () => {
    const res = await request(app).post("/api/users/register").send({
      name: "Ada",
      email: "ada@example.com",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/enter a password/i);
  });

  it("rejects a password shorter than 6 characters", async () => {
    const res = await request(app).post("/api/users/register").send({
      name: "Ada",
      email: "ada@example.com",
      password: "abc12",
      confirm_password: "abc12",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 6 characters/i);
  });

  it("rejects a malformed email", async () => {
    const res = await request(app).post("/api/users/register").send({
      name: "Ada",
      email: "not-an-email",
      password: "plaintext1",
      confirm_password: "plaintext1",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/valid email/i);
  });

  it("rejects a duplicate email", async () => {
    await User.create({
      name: "Ada",
      email: "ada@example.com",
      password: "plaintext1",
    });

    const res = await request(app).post("/api/users/register").send({
      name: "Ada Two",
      email: "ada@example.com",
      password: "plaintext2",
      confirm_password: "plaintext2",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });
});

describe("POST /api/users/login", () => {
  beforeEach(async () => {
    await User.create({
      name: "Ada",
      email: "ada@example.com",
      password: "plaintext1",
    });
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "ada@example.com", password: "plaintext1" });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("ada@example.com");
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("rejects a login for a nonexistent user", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "nobody@example.com", password: "whatever1" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not exist/i);
  });

  it("rejects a login with the wrong password", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "ada@example.com", password: "wrongpassword" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it("requires an email", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ password: "plaintext1" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/enter an email/i);
  });

  it("requires a password", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "ada@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/enter a password/i);
  });
});

describe("DELETE /api/users/delete/:userId", () => {
  it("deletes the user along with their boards and jobs", async () => {
    const user = await User.create({
      name: "Ada",
      email: "ada@example.com",
      password: "plaintext1",
    });
    const board = await Board.create({
      title: "My Board",
      createdBy: user._id,
      lists: [],
    });
    await Job.create({
      cardID: new mongoose.Types.ObjectId(),
      companyName: "Acme",
      createdBy: user._id,
      boardID: board._id,
    });

    const res = await request(app).delete(`/api/users/delete/${user._id}`);

    expect(res.status).toBe(200);
    expect(await User.findById(user._id)).toBeNull();
    expect(await Board.findById(board._id)).toBeNull();
    expect(await Job.countDocuments({ createdBy: user._id })).toBe(0);
  });

  it("returns 404 for a user that does not exist", async () => {
    const res = await request(app).delete(
      `/api/users/delete/${new mongoose.Types.ObjectId()}`
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});
