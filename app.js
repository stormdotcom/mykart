const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const Handlebars = require('handlebars');
const hbs = require('express-handlebars')
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');
const orderRouter = require('./routes/orderRoute')
const fileUpload = require('express-fileupload')
const app = express();
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const db = require('./config/connection')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
  uri: process.ENV.MONGODB_URL,
  collection: 'mySessions'
});
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs({
  extname: 'hbs', defaultLayout: 'layout', hbs: allowInsecurePrototypeAccess(Handlebars),
  layoutsDir: path.join(__dirname, 'views/layouts/'), partialsDir: path.join(__dirname, 'views/partials')
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));
app.use(session({
  secret: "ajmal",
  store: store,
  resave: true,
  saveUninitialized: true, 
  cookie: {
    maxAge: 3600000 
  }
      }))
db.connect((err) => {
  if (err) console.log("DB Connection Err \n" + err);
  else console.log("DB Connected ");

})
app.use(fileUpload());

app.use('/', usersRouter);
app.use('/admin', adminRouter);
app.use('/orders', orderRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
