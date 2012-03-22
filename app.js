
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , sio = require('socket.io');

var app = module.exports = express.createServer();


// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);



function getRandomNumber(){
  return Math.round(Math.random(12) * 10);
};

function getRandomOperator(){
  var val = getRandomNumber();
  switch(true){
    case (val < 4):
      return "+";
      break;
    case (val >= 4 && val < 6):
      return "*";
      break;
    case (val >= 6 && val < 8):
      return "/";
      break;
    default:
      return "-";
      break;
  }
}

app.listen(3000);
var io = sio.listen(app);

io.sockets.on('connection', function (socket) {
  socket.emit('setup', { first: getRandomNumber(), second: getRandomNumber(), operator: getRandomOperator() });
});
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
