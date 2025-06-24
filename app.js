const express = require('express');
require('express-async-errors');
const session = require('express-session');
const jobsRouter = require('./routes/jobs');
const auth = require('./middleware/auth');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const flash = require('connect-flash');
const passport = require('passport');
const passportInit = require('./passport/passportInit');

const app = express();

app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.urlencoded({ extended: true }));
app.use(require('body-parser').urlencoded({ extended: true }));

const MongoDBStore = require('connect-mongodb-session')(session);
const url = process.env.MONGO_URI;

const store = new MongoDBStore({
  uri: url,
  collection: 'mySessions'
});
store.on('error', function (error) {
  console.log(error);
});

require('dotenv').config(); // to load the .env file into the process.env object

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: 'strict' }
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParms));
app.use(flash());

app.use(helmet());
app.use(xss());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use(csrf({ cookie: true }));
app.use((req, res, next) => {
  res.locals._csrf = req.csrfToken();
  next();
});

passportInit();
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');

app.use(require('./middleware/storeLocals'));

app.use('/jobs', auth, jobsRouter);

app.get('/', (req, res) => {
  res.render('index');
});
app.use('/sessions', require('./routes/sessionRoutes'));

// secret word handling
const secretWordRouter = require('./routes/secretWord');
app.use('/secretWord', auth, secretWordRouter);

//let secretWord = "syzygy";

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await require('./db/connect')(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
