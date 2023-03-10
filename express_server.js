//LOAD EXPRESS, HELPER FUNCTIONS AND SET PORT NUMBER
const express = require("express");
const app = express();
const PORT = 8080;

//HELPER FUNCTIONS
const {
  findUserByEmail,
  urlsForUser,
  generateRandomString,
} = require("./helpers");

//MIDDLEWARE
var cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const { resolveInclude } = require("ejs");
const bcrypt = require("bcryptjs");
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
const urlDatabase = {};
const users = {};

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
    urls: urlsForUser(req.session["user_id"], urlDatabase),
    user: users[req.session["user_id"]],
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session["user_id"]) {
    return res.redirect("/urls");
  }
  const templateVars = {
    urls: urlsForUser(req.session["user_id"], urlDatabase),
    user: users[req.session["user_id"]],
  };
  res.render("./user_registration", templateVars);
});

app.get("/urls.json", (req, res) => {
  const templateVars = {
    user: users[req.session["user_id"]],
    urls: urlsForUser(req.session["user_id"], urlDatabase),
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
  if (!urlDatabase[req.params.id]) {
    return res
      .status(404)
      .send(
        "Error 404: Specified Short URL ID does not exist. Please try again."
      );
  }
  res.redirect(urlDatabase[req.params.id].longURL);
});

app.get("/urls/:id", (req, res) => {
  if (!req.session["user_id"]) {
    return res.status(400).send("Please sign in.");
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("URL ID not found.");
  }
  const usersURLS = urlsForUser(req.session["user_id"], urlDatabase);
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
  const usersURLS = urlsForUser(req.session["user_id"], urlDatabase);
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
  const usersURLS = urlsForUser(req.session["user_id"], urlDatabase);
  if (!usersURLS[req.params.id]) {
    return res.status(400).send("Permission denied");
  }
  urlDatabase[req.params.id].longURL = req.body.newURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});
