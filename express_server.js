//LOAD EXPRESS AND SET PORT NUMBER
const express = require("express");
const app = express();
const PORT = 8080;

//FUNCTION FOR GENERATING RANDOM SHORTURL
const generateRandomString = function () {
  return Math.random().toString(20).substr(2, 6);
};

//FUNCTION FOR FINDING A USER BASED ON EMAIL

const findUser = function (email) {
  for (let user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return null;
};

//MIDDLEWARE
const cookieParser = require("cookie-parser");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//DATABASES (URLS & USERS)
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render("./user_registration", templateVars);
  console.log(req.body);
});

app.get("/urls.json", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.json(urlDatabase, templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_new", templateVars);
});

app.get("/u/:id", (req, res) => {
  res.redirect(urlDatabase[req.params.id]);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

//POST ROUTES
app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
});

app.post("/login", (req, res) => {
  res.cookie("user_id", req.body.email);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  //If the email or password is empty, return an error
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Invalid Email or Password");
  }
  //If the user already exists return an error, otherwise continue with user creation
  const doesUserExist = findUser(req.body.email);
  if (doesUserExist !== null) {
    return res.status(400).send("User already exists");
  }
  //Generate random user ID
  const userID = generateRandomString();
  //Create new user object based on submitted form and add it to users database
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: req.body.password,
  };
  res.cookie("user_id", userID);
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect("/urls");
});

//RUN WHEN SERVER IS STARTED

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});
