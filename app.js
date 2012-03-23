
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , sio = require('socket.io')
  , sum = require('./lib/random_sum_generator');

var f, s, o, answer;
var users = [];
var clients = {};

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
  socket.on('user', function (data, fn) {
    if(users.indexOf(data) != -1) {
      fn(false);
    } else {
      fn(true);
      users.push(data);
      socket.user = data;
      clients[socket.user] = socket;
      socket.broadcast.emit('users', { users : users })
    }
  });

  socket.on('users', function() {
    socket.emit('users', { users : users })
  })

  socket.on('disconnect', function () {
    if (!socket.user) return;
    users.splice(users.indexOf(socket.user), 1);
    socket.broadcast.emit('users', { users : users })
  });

  socket.on("battle_user", function(data, fn) {
    if (!socket.user && users.indexOf(data) != -1) {
      fn(false);
    } else{
      fn(true);
      clients[data].emit('request_battle', { requester : socket.user })
    };
  });

  socket.on('begin_battle', function (data, fn) {
    setup();
    socket.emit("setup", { first: f, second: s, operator: o });
    clients[data].emit('setup', { first: f, second: s, operator: o });
  });

});



console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
