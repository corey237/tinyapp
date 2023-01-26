//LOAD EXPRESS, HELPER FUNCTIONS AND SET PORT NUMBER
const express = require("express");
const app = express();
const PORT = 8080;

//FUNCTION FOR GENERATING RANDOM SHORTURL OR USERID
const generateRandomString = function () {
  return Math.random().toString(20).substr(2, 6);
};

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
const urlsForUser = function (user) {
  const urlList = {};
  for (const urlID in urlDatabase) {
    if (urlDatabase[urlID].userID === user) {
      urlList[urlID] = urlDatabase[urlID].longURL;
    }
  }
  return urlList;
};

//MIDDLEWARE
var cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const { resolveInclude } = require("ejs");
const bcrypt = require("bcryptjs");
const { findUserByEmail } = require("./helpers");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "TinyApp",
    keys: ["This is my secret key. Dont tell anyone."],
  })
);
app.use(cookieParser());

//DATABASES (URLS & USERS)
const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
  },
  f46gs2: {
    longURL: "http://reddit.com",
    userID: "user2RandomID",
  },
};

const users = {
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

//GET ROUTES
app.get("/", (req, res) => {
  if (!req.session["user_id"]) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  if (!req.session["user_id"]) {
    return res
      .status(400)
      .send("Cannot access URL's. Please sign or or create an account.");
  }
  const templateVars = {
    urls: urlsForUser(req.session["user_id"]),
    user: users[req.session["user_id"]],
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session["user_id"]) {
    return res.redirect("/urls");
  }
  const templateVars = {
    urls: urlsForUser(req.session["user_id"]),
    user: users[req.session["user_id"]],
  };
  res.render("./user_registration", templateVars);
});

app.get("/urls.json", (req, res) => {
  const templateVars = {
    user: users[req.session["user_id"]],
    urls: urlsForUser(req.session["user_id"]),
  };
  res.json(urlDatabase, templateVars);
});

app.get("/login", (req, res) => {
  if (req.session["user_id"]) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: users[req.session["user_id"]],
  };
  res.render("user_login", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session["user_id"]) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[req.session["user_id"]],
  };
  res.render("urls_new", templateVars);
});

app.get("/u/:id", (req, res) => {
  res.redirect(urlDatabase[req.params.id].longURL);
});

app.get("/urls/:id", (req, res) => {
  if (!req.session["user_id"]) {
    return res.status(400).send("Please sign in.");
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("URL ID not found.");
  }
  const usersURLS = urlsForUser(req.session["user_id"]);
  if (!usersURLS[req.params.id]) {
    return res.status(400).send("Permission denied");
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session["user_id"]],
  };
  res.render("urls_show", templateVars);
});

//POST ROUTES
app.post("/urls", (req, res) => {
  if (!req.session["user_id"]) {
    return res.status(400).send("Cannot Shorten URL. Please sign in.");
  }
  const randomString = generateRandomString();
  urlDatabase[randomString] = {
    longURL: req.body.longURL,
    userID: req.session["user_id"],
  };
  res.redirect(`/urls/${randomString}`);
});

app.post("/login", (req, res) => {
  //Confirm that the user is registered
  const login = findUserByEmail(req.body.email, users);
  if (login === null) {
    return res.status(403).send("Invalid email. Please try again");
  }
  //Confirm that the password provided matches whats in the database
  if (!bcrypt.compareSync(req.body.password, login.password)) {
    return res.status(403).send("Invalid password. Please try again");
  }
  //Set login cookie based on object return from loginAuth
  req.session["user_id"] = login.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  //If the email or password is empty, return an error
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Invalid Email or Password. Please try again.");
  }
  //If the user already exists return an error, otherwise continue with user creation
  const doesUserExist = findUserByEmail(req.body.email, users);
  if (doesUserExist !== null) {
    return res.status(400).send("User already exists.");
  }
  //Generate random user ID
  const userID = generateRandomString();
  //Create new user object based on submitted form and add it to users database
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
  };
  req.session["user_id"] = userID;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  if (!req.session["user_id"]) {
    return res.status(400).send("Please sign in.");
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("URL ID not found.");
  }
  const usersURLS = urlsForUser(req.session["user_id"]);
  if (!usersURLS[req.params.id]) {
    return res.status(400).send("Permission denied");
  }
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/urls/:id/update", (req, res) => {
  if (!req.session["user_id"]) {
    return res.status(400).send("Please sign in.");
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("URL ID not found.");
  }
  const usersURLS = urlsForUser(req.session["user_id"]);
  if (!usersURLS[req.params.id]) {
    return res.status(400).send("Permission denied");
  }
  urlDatabase[req.params.id].longURL = req.body.newURL;
  res.redirect("/urls");
});

//RUN WHEN SERVER IS STARTED

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});
