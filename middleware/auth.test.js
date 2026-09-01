const { jwtVerify } = require("jose"); // mocked in test/setup.js
const { requireAuth } = require("./auth");

const makeRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json };
};

const ENV_KEYS = ["SUPABASE_URL", "AUTH_DISABLED", "AUTH_DISABLED_USER_ID"];

describe("requireAuth", () => {
  const saved = {};

  beforeEach(() => {
    ENV_KEYS.forEach((k) => {
      saved[k] = process.env[k];
      delete process.env[k];
    });
    jwtVerify.mockReset();
  });

  afterEach(() => {
    ENV_KEYS.forEach((k) => {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    });
  });

  it("passes through with userId=null when SUPABASE_URL is unset and AUTH_DISABLED=true", async () => {
    process.env.AUTH_DISABLED = "true";
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(req.userId).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("uses AUTH_DISABLED_USER_ID when provided", async () => {
    process.env.AUTH_DISABLED = "true";
    process.env.AUTH_DISABLED_USER_ID = "local-dev-user";
    const req = { headers: {} };
    const next = jest.fn();

    await requireAuth(req, makeRes(), next);

    expect(req.userId).toBe("local-dev-user");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("responds 500 when SUPABASE_URL is unset and AUTH_DISABLED is not set (fail closed)", async () => {
    const res = makeRes();
    const next = jest.fn();

    await requireAuth({ headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server auth is not configured" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responds 401 when a token is required but missing", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    const res = makeRes();
    const next = jest.fn();

    await requireAuth({ headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("sets req.userId from the token's sub on a valid token", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    jwtVerify.mockResolvedValue({ payload: { sub: "user-123" } });
    const req = { headers: { authorization: "Bearer good" } };
    const next = jest.fn();

    await requireAuth(req, makeRes(), next);

    expect(req.userId).toBe("user-123");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("responds 401 when the verified token has no sub", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    jwtVerify.mockResolvedValue({ payload: {} });
    const res = makeRes();
    const next = jest.fn();

    await requireAuth({ headers: { authorization: "Bearer x" } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responds 401 when jwtVerify rejects", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    jwtVerify.mockRejectedValue(new Error("bad signature"));
    const res = makeRes();
    const next = jest.fn();

    await requireAuth({ headers: { authorization: "Bearer bad" } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
