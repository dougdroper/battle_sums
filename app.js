
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , sio = require('socket.io')
  , sum = require('./lib/random_sum_generator');

var f, s, o, answer;

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

app.listen(3000);
var io = sio.listen(app);

function setup(){
  f = sum.getRandomNumber();
  s = sum.getRandomNumber();
  o = sum.getRandomOperator();
  answer = eval(f + o + s);
  if(answer < 0 || answer % 1 != 0){
    setup();
  }
}

io.sockets.on('connection', function (socket) {
  setup();

  socket.emit("setup", { first: f, second: s, operator: o });
  socket.broadcast.emit('setup', { first: f, second: s, operator: o });
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
