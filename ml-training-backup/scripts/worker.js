importScripts('helper.js');
importScripts('numeric-1.2.6.min.js');

var   
        param,
        lmbda = 10e-10;

function handleParam(e){
  // self.postMessage({ cmd: 'print', msg : e.target.responseText })

  // update the global parameter of this worker
  param = JSON.parse(e.target.responseText);
  // self.postMessage({ cmd : 'print', msg : 'param received is ' + JSON.stringify(param) });
  // get a training sample from the parent thread
  self.postMessage({cmd : 'getSample' , msg : 'Get me a sample for training' });

}

function updateParam(type, data){

  type = type ? type : 'GET';

  ajax('/param', handleParam, type, data);
}

self.addEventListener('message', function(e){

  switch(e.data.cmd){
    case 'init':
      self.postMessage({ cmd : 'print' , msg : e.data.msg} );

      // start after a random time
      setTimeout(updateParam, getRandomBetween(5, 10)*1000);
      break;

    case 'terminate' :
      // TODO : check if the thread is waiting, before terminating it.. else after terminating the async call setTimeout might fire
      self.postMessage({ cmd : 'print', msg : e.data.msg });
      self.close();
      break;

    case 'wait':
      // main thread is out of samples, wait for time till it fetches from server
      setTimeout(function(){
        self.postMessage({cmd : 'getSample' , msg : 'Get me a sample for training' });
      }, getRandomBetween(8, 10));
      break;

    case 'train':
      var 
            msg = JSON.parse(e.data.msg),
            feature = msg.f,
            label = msg.l,
            power = numeric.dot(param, feature),
            t = e.data.time,
            h = 1 / (1 + Math.exp(-power)),
            dw = numeric.dot(-(label - h) *h * (1-h), feature);

      param = numeric.sub(param, numeric.dot((lmbda/t), dw));

      updateParam('POST', 'feature='+JSON.stringify(param) );
      
      // wait for random time between 20 and 50 secs to train another sample
      setTimeout(updateParam, getRandomBetween(5, 8)*1000);
      break;
  }

});