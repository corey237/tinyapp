//FUNCTION FOR USER LOOKUP BASED ON EMAIL

const findUserByEmail = function (email, userDatabase) {
  for (let user in userDatabase) {
    if (email === userDatabase[user].email) {
      return userDatabase[user];
    }
  }
  return null;
};

//FUNCTION THAT RETURNS OBJECT CONTAINING URL's THAT BELONG TO THE USER
const urlsForUser = function (user, database) {
  const urlList = {};
  for (const urlID in database) {
    if (database[urlID].userID === user) {
      urlList[urlID] = database[urlID].longURL;
    }
  }
  return urlList;
};

//FUNCTION FOR GENERATING RANDOM SHORTURL OR USERID
const generateRandomString = function () {
  return Math.random().toString(20).substr(2, 6);
};

module.exports = { findUserByEmail, urlsForUser, generateRandomString };
