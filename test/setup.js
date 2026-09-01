// In tests the bearer token IS the user id: the mocked jwtVerify echoes it back
// as `sub`. Lets the route tests assert per-user scoping without a real Supabase.
jest.mock("jose", () => ({
  createRemoteJWKSet: jest.fn(() => ({})),
  jwtVerify: jest.fn(async (token) => ({ payload: { sub: token } })),
}));
