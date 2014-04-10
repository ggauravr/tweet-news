var a,
  nWorkers = 3,
  workersCreated = false,
  isFetching = false,
  workers = [];

function getSamples(){

  isFetching = true;
  $('.status').text('fetching samples from server');

  $.ajax({
    url : '/samples',
    dataType : 'json',
    success : handleResponse
  });

}

function handleResponse(response){

  switch(response.status){

    case 'success':
      // samples fetched successfully
      storeSamples(response.data);
      break;

    case 'done':
    // no more samples, response contains the trained model parameter
    $('.status').text('Model is trained.. parameter is printed in console');
    // alert('No Samples Sent from the Server !');
    
    setTimeout(function(){
      terminateWorkers(nWorkers);
    }, getRandomBetween(5, 8));

    console.log(response.data);
  }

}

function storeSamples(data){
  $('.status').text(data.length + ' samples loaded from server. storing them in local storage');

  // if no samples sent from the server, terminate all workers
  
  localStorage.clear();
  for(index in data){
    item = data[index];
    localStorage.setItem( item.k , JSON.stringify({ f : item.f, l : item.l } ) );
  }
  
  $('.status').text('samples stored in local storage.. beginning procesing..');    
  isFetching = false;

  if(!workersCreated){
    workersCreated = true;
    spawnWorkers(nWorkers);  
  }
    
  
}

function spawnWorkers(n){

  var t = 1;

  for(var i=0; i < n; ++i){
    workers[i] = new Worker('scripts/worker.js')

    workers[i].addEventListener('message', function(e){

      var sample, noSamples = true;

      switch(e.data.cmd){

        case 'print':
          console.log(e.data.msg);
          break;

        case 'getSample' :
          t++;
          for(key in localStorage){
            noSamples = false;
            sample = localStorage.getItem(key);
            // remove the sample from local storage
            localStorage.removeItem(key);
            // exit after one sample
            break;
          }

          if(noSamples){
            // if no local samples, make the thread wait for some time, before making another request
            e.target.postMessage({ cmd : 'wait', msg : 'Waiting for the main thread to fetch some samples from server'});
            if(!isFetching){
              getSamples();  
            }
            
          }
          else{
            e.target.postMessage({ cmd : 'train', 'msg' : sample, 'time' : t });
          }
          break;

        default : 
          console.log('Unexpected cmd found.. ', e.data.cmd);
      }
    });

    // start the worker
    workers[i].postMessage({ cmd : 'init', msg : 'Worker ' + i + ' Created !'});
  }
}

function terminateWorkers(n){
  for(var i=0; i < n; ++i){
    if(workers[i]){
      workers[i].postMessage({ cmd : 'terminate', msg : 'Closing thread ' + i + ' ! '});
    }
  }
}

getSamples();