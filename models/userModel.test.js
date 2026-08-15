const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { connect, closeDatabase, clearDatabase } = require("../test/testDb");
const User = require("./userModel");

beforeAll(async () => {
  await connect();
  await User.syncIndexes();
});
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

describe("User model", () => {
  it("hashes the password on save", async () => {
    const user = await User.create({
      name: "Ada",
      email: "ada@example.com",
      password: "plaintext1",
    });

    expect(user.password).not.toBe("plaintext1");
    expect(await bcrypt.compare("plaintext1", user.password)).toBe(true);
  });

  it("does not rehash the password when other fields change", async () => {
    const user = await User.create({
      name: "Ada",
      email: "ada@example.com",
      password: "plaintext1",
    });
    const originalHash = user.password;

    user.name = "Ada Lovelace";
    await user.save();

    expect(user.password).toBe(originalHash);
  });

  it("rehashes the password when it is changed", async () => {
    const user = await User.create({
      name: "Ada",
      email: "ada@example.com",
      password: "plaintext1",
    });
    const originalHash = user.password;

    user.password = "newpassword1";
    await user.save();

    expect(user.password).not.toBe(originalHash);
    expect(await bcrypt.compare("newpassword1", user.password)).toBe(true);
  });

  it("requires name, email and password", async () => {
    await expect(User.create({})).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it("rejects a password shorter than 9 characters", async () => {
    await expect(
      User.create({ name: "Ada", email: "ada@example.com", password: "short" })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it("enforces a unique email", async () => {
    await User.create({
      name: "Ada",
      email: "ada@example.com",
      password: "plaintext1",
    });

    await expect(
      User.create({
        name: "Someone Else",
        email: "ada@example.com",
        password: "plaintext2",
      })
    ).rejects.toThrow();
  });
});
