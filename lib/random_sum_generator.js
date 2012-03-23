exports.getRandomNumber = function(){
  return Math.round(Math.random(10) * 10);
};

exports.getRandomOperator = function(){
  var val = exports.getRandomNumber();
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