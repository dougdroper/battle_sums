var socket = io.connect();
var first, second, operator, answers;
var your_user;
var count = 0;
var correct = 0;
var wrong = 0;
var battler;
var startTime;
var endTime;
var play_time;
var BATTLE_LINE = 10;

$("document").ready(function(){
  $("#user").bind('keypress', function(e){
    if(e.keyCode == 13){
      your_user = $("input#user").val();
      socket.emit('user', your_user, function(success){
        if(success){
          socket.emit('users');
          show_online_users();
        } else {
          $("#user").prepend($('<p>')
          .text('Sorry the username is already taken'));
          $("input#user").val('');
        }
      });
    }
  });

  $("#new_game").click(function(){
    socket.emit('users');
    show_online_users();
  });

  $("li.online_users").live("click" , function(){
    socket.emit('battle_user', $(this).attr("id"), function(success){
      if(success){
        $("#request").empty().show().append($("<p>")
        .text("Your request has been sent!"));
      } else {
        $("#users").prepend($('<p>')
        .text("Sorry user unavailable"));
      }
    });
  });

  $(".accept").live("click", function(){
    socket.emit('begin_battle', $(this).attr("id"), function(success){
      if(success){

      } else {

      }
    });
  });

  $("#calc_box input").bind("keypress", function(e){
    if(e.keyCode == 13){
      check_answer();
    }
  });

  $("#abandon_battle").click(function(){
    socket.emit("abandon", {battler: battler});
    socket.emit('users');
    show_online_users();
  });
});

function updateContent(){
  $("#request").hide();
  $("#users").hide();
  $("#calc_box").show();
  $(".battle_zone").show();
  $("#left").html(first[count]);
  $("#operation").html(operator[count]);
  $("#right").html(second[count]);
  $("#battler").html("You are fighting " + battler);
  $("#battler").attr('class', battler);
  $("#battler_2").empty().css("background-color", "green")
  $("input#answer").val('');
}

function reset(){
  $("#battler_1").show();
  $("#battler_line_1").show();
  count = 0;
  correct = 0;
  wrong = 0;
  $("#result").hide();
  $("#player_2_score").hide();
  $("#battler").hide();
  $("#battler_1").css("left", 0);
  $("#battler_2").css("left", 0);
}

socket.on('setup', function(data) {
  first = data.first;
  second = data.second;
  operator = data.operator;
  answers = data.answers;
  battler = data.battler;
  startTime = new Date();
  updateContent();
});

socket.on('users', function (users) {
  listUsers(users);
});

function listUsers(users){
  $('#users ul').empty();
  users.users.splice(users.users.indexOf(your_user), 1);
  for (var i in users.users) {
    $('#users ul').append($('<li>')
    .attr('id', users.users[i])
    .attr('class', "online_users")
    .text(users.users[i]));
  }
}

socket.on('request_battle', function(data) {
  showRequest(data);
});

function showRequest(data){
  $("#request").empty().show().append($("<p>")
  .text(data.requester + " wants to do battle"))
  .append($("<span>")
  .attr('id', data.requester)
  .attr("class", "accept")
  .text("accept?"));
}

socket.on("player_finished", function(data){
  opponent_score(data);
});

socket.on("correct_move", function(){
  var left = parseInt($("#battler_2").css('left'));
  $("#battler_2").css("left", left + 91);
});

socket.on("opponent_quit", function(){
  $("#battler_2").css("background-color", "#000");
  $("#battler_2").html(battler + " has quit");
});

function show_online_users(){
  reset();
  $("#user").hide();
  $("#users").show();
  $(".battle_zone").hide();
  $("#calc_box").hide();
};

function check_answer(){
  var a = $("input#answer").val();
  if(a == answers[count]){
    correct++;
    var left = parseInt($("#battler_1").css('left'));
    $("#battler_1").css("left", left + 91);
    socket.emit("correct", {player: $("#battler").attr("class")});
  } else{
    wrong++;
  }
  count++;
  if(correct == BATTLE_LINE){
    endTime = new Date();
    play_time = (endTime - startTime) / 1000;
    your_score();
    socket.emit('battle_over', {
      count: count, 
      wrong: wrong, 
      correct: correct, 
      play_time: play_time, 
      player: $("#battler").attr("class")
    });
  } else {
    updateContent();  
  }
}

function your_score(){
  var a = parseInt($("#battler_1").css('left'));
  var b = parseInt($("#battler_2").css('left'));
  $("#result").empty();
  if(a > b){
    $("#result").append($("<h2>").text("Your score: You Win"));
  } else {
    $("#result").append($("<h2>").text("Your score: You Lose"));
  }
  your_result();
}

function your_result(){
  $("#calc_box").hide();
  $("#battler_1").hide();
  $("#battler_line_1").hide();
  $("#abandon_battle").hide();
  $("#new_game").show();

  $("#result").show();
  $("#result").append($("<p>").text("Correct: " + correct));
  $("#result").append($("<p>").text("Wrong: " + wrong));
  $("#result").append($("<p>").text("Play time: " + play_time)); 
  $("#result").append($("<p>").text("Count: " + count));
}

function opponent_score(data){
  $("#player_2_score").empty().show();
  $("#player_2_score").append($("<h2>").text(data.player + " score"));
  $("#player_2_score").append($("<p>").text("Correct: " + data.correct));
  $("#player_2_score").append($("<p>").text("Wrong: " + data.wrong));
  $("#player_2_score").append($("<p>").text("Play time: " + data.play_time));
  $("#player_2_score").append($("<p>").text("Count: " + data.count));
}

