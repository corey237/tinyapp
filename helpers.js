//FUNCTION FOR USER LOOKUP BASED ON EMAIL

const findUserByEmail = function (email, userDatabase) {
  for (let user in userDatabase) {
    if (email === userDatabase[user].email) {
      return userDatabase[user];
    }
  }
  return null;
};

module.exports = { findUserByEmail };
