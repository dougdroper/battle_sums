
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , sio = require('socket.io')
  , sum = require('./lib/random_sum_generator');

var f = [];
var s = [];
var o = [];
var answers = [];
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

var port = process.env.PORT || 3000;
app.listen(port);
var io = sio.listen(app);
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

function setup_sums(i){
  f[i] = sum.getRandomNumber();
  s[i] = sum.getRandomNumber();
  o[i] = sum.getRandomOperator();
  answers[i] = eval(f[i] + o[i] + s[i]);
  if(answers[i] < 0 || answers[i] % 1 != 0){
    setup_sums(i);
  }
}

function setup(){
  for(var i = 0; i <= 40; i++){
    setup_sums(i)
  }
}

function online_players(user){
  var online_players = [];
  for(var i in users){
    if(!clients[users[i]].inBattle){
      online_players.push(users[i]);
    }
  }
  return online_players;
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
      socket.emit('users', { users : online_players() })
      socket.broadcast.emit('users', { users : online_players() })
    }
  });

  socket.on('users', function() {
    socket.broadcast.emit('users', { users : online_players() });
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

  socket.on("correct", function(data){
    clients[data.player].emit('correct_move');
  })

  socket.on("battle_over", function(data){
    socket.inBattle = false;
    clients[data.player].emit('player_finished', data);  
  });

  socket.on('begin_battle', function (data, fn) {
    setup();
    socket.inBattle = true;
    clients[data].inBattle = true;
    socket.broadcast.emit('users', { users : online_players() });
    socket.emit("setup", { first: f, second: s, operator: o, answers: answers, battler: clients[data].user });
    clients[data].emit('setup', { first: f, second: s, operator: o , answers: answers, battler: socket.user });
  });
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
