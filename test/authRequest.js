const request = require("supertest");
const app = require("../app");

const TEST_USER = "11111111-1111-1111-1111-111111111111";
const OTHER_USER = "22222222-2222-2222-2222-222222222222";

// request(app) but every call carries a Bearer token for `userId`.
const asUser = (userId) => {
  const send = (method) => (url) =>
    request(app)[method](url).set("Authorization", `Bearer ${userId}`);
  return {
    get: send("get"),
    post: send("post"),
    put: send("put"),
    delete: send("delete"),
  };
};

module.exports = { app, asUser, api: asUser(TEST_USER), TEST_USER, OTHER_USER };
