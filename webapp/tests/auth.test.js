const {
  getAuthPassword,
  hashPasswordWithBcrypt,
  comparePassword
} = require("../utils/authHelper");

// Test1
test("Test User Password with base64 decoding", async () => {
  const authHeader = "Basic YWRtaW46dGVzdA==";
  const {
    username,
    password
  } = await getAuthPassword(authHeader);
  expect(username).toBe("admin");
  expect(password).toBe("test");
});

// Test2
test("Test Hashing and comparing Password", async () => {
  let password = "password";
  const hashedPassword = await hashPasswordWithBcrypt(password);
  expect(hashedPassword).not.toBe(password);

  const compareResult = await comparePassword(password, hashedPassword);
  expect(compareResult).toBe(true);

  password = "notapassword";
  const compareOutput = await comparePassword(password, hashedPassword);
  expect(compareOutput).toBe(false);
});