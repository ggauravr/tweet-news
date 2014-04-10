/*
  workers can't use jQuery
*/
function ajax(url, callback, type, params){
  var xhr = new XMLHttpRequest();
  xhr.addEventListener('load', function(e) {
    callback(e);
  });
  xhr.open(type ? type : 'GET', url);

  if(type == 'POST'){
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
  }

  xhr.send(params);
}


function getRandomBetween(min, max){

  return Math.floor(Math.random() * (max - min) + min);
}