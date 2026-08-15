const mongoose = require("mongoose");
const { connect, closeDatabase, clearDatabase } = require("../test/testDb");
const { Job, Contact } = require("./jobModel");

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

describe("Job model", () => {
  it("requires a cardID", async () => {
    await expect(Job.create({ companyName: "Acme" })).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  it("requires a companyName", async () => {
    await expect(
      Job.create({ cardID: new mongoose.Types.ObjectId() })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it("defaults isFavorite to false", async () => {
    const job = await Job.create({
      cardID: new mongoose.Types.ObjectId(),
      companyName: "Acme",
    });
    expect(job.isFavorite).toBe(false);
  });

  it("creates with an embedded contacts array", async () => {
    const job = await Job.create({
      cardID: new mongoose.Types.ObjectId(),
      companyName: "Acme",
      contacts: [{ contactName: "Jamie" }],
    });

    expect(job.contacts).toHaveLength(1);
    expect(job.contacts[0].contactName).toBe("Jamie");
  });
});

describe("Contact model", () => {
  it("accepts a valid email", async () => {
    const contact = await Contact.create({
      contactName: "Jamie",
      contactEmail: "jamie@example.com",
    });
    expect(contact.contactEmail).toBe("jamie@example.com");
  });

  it("rejects a malformed email", async () => {
    await expect(
      Contact.create({ contactName: "Jamie", contactEmail: "not-an-email" })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it("allows an empty email", async () => {
    const contact = await Contact.create({ contactName: "Jamie", contactEmail: "" });
    expect(contact.contactEmail).toBe("");
  });
});
