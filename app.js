var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs =  require('express-handlebars');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

var app = express();


var db=require('./config/connection')
var session=require('express-session')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({helpers:{
  inc:function(value,options){
    return parseInt(value)+1;
  },
  eqPacked: (status)=>{
    return status==='packed'? true : false
  },
  eqShipped: (status)=>{
    return status==='Shipped'? true : false
  }
  ,
  eqPlaced: (status)=>{
    return status==='placed'? true : false
  },
  
  eqDelivered: (status)=>{
    return status==='delivered'? true : false
  },
  eqPending: (status)=>{
    return status==='pending'? true : false
  },
  isoToDate:(date)=>{
    return date.toDateString()
  },
  
  multiply:(num1,num2)=>num1*num2,
  Subtraction:(n1,n2)=>n1-n2
},


  extname:'hbs',
  defaultLayout:'admin-layout',
  layoutsDir:__dirname+'/views/layout/',
  partialsDir:__dirname+'/views/partials/', 
  runtimeOptions: { 
    allowProtoPropertiesByDefault: true, 
    allowProtoMethodsByDefault: true,}}))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:"key",cookie:{maxAge:600000}}))
app.use(function(req,res,next){
  res.header('Cache-Control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
  next();
})
db.connect((err)=>{
  if(err)
  console.log("connection error"+err)
  else
  console.log("Database connected")
})
// app.post('/multiple',(req,res)=>{
//   res.send('multiple')
// })
app.use('/', usersRouter);


app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('user/error',{layout: "user-layout"});
});

module.exports = app;
