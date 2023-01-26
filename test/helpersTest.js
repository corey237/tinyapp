const { assert } = require("chai");

const { findUserByEmail } = require("../helpers");

const testUsers = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

describe("getUserByEmail", function () {
  it("should return a user with a valid email address", function () {
    const user = findUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });
  it("Should return null for a user that doesnt exist", function () {
    const user = findUserByEmail("testuser3@example.com", testUsers);
    assert.equal(user, null);
  });
});
