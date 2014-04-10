import cgi
import webapp2
from google.appengine.ext import ndb
from google.appengine.api import memcache
import json

import ndbmodels

class MainHandler(webapp2.RequestHandler):

    def get(self):
      MAIN_PAGE_HTML = """\
        <html>
             <head>
              <title>GuestBook</title>
             </head>
          <body>
                
                <p class="status">Page Loaded.. Loading Data and Parameter.. </p>

            <script src="/scripts/jquery-1.10.2.min.js"></script>
            <script src="/scripts/helper.js"></script>
            <script src="/scripts/app.js"></script>
          </body>
        </html>
        """
      self.response.write(MAIN_PAGE_HTML)

class SampleHandler(webapp2.RequestHandler):

  def get(self):

    qry = model.Sample.query()

    if qry.count() <= 0:
      # send the latest parameter
      param = memcache.get('param')

      self.response.headers['Content-Type'] = 'application/json'
      self.response.write(json.dumps({ 'status' : 'done', 'data' : param }))
      return

    keys = qry.fetch(keys_only=True)[:150]

    entities = ndb.get_multi(keys);
    ndb.delete_multi(keys)

    samples = []

    for sample in entities:
      samples.append({ 'k' : sample.key.id(), 'f' : sample.feature, 'l' : sample.label })

    self.response.headers['Content-Type'] = 'application/json'
    self.response.write(json.dumps({ 'status' : 'success', 'data' : samples }))

class ParameterHandler(webapp2.RequestHandler):

  def get(self):

    client = memcache.Client()
    param = memcache.get('param')

    if param is None or param == '':
      # create the paramater in the data store and update the cache
      newParam = model.Parameter(id="param", feature=str([0]*785))
      newParam.put()

      memcache.add(key='param', value=newParam.feature)

    param = client.gets('param')

    self.response.headers['Content-Type'] = 'text/plain'
    self.response.write(param)

  def post(self):

    # get the param from the DB, update it.. and update the cache
    qry = model.Parameter.query()
    param = qry.fetch(1)[0]

    param.feature = self.request.POST['feature']
    param.put()

    memcache.set('param', param.feature)

class ClearHandler(webapp2.RequestHandler):
  
  def get(self):
    
    # delete all the samples from the database
    samples = model.Sample.query().fetch(keys_only=True)
    ndb.delete_multi(samples)

    # flush memcache
    memcache.flush_all()

    # refill the DB
    self.populate()

    self.response.write('Samples repopulated.. Memcached cleared')

  def populate(self):
    ''' method to load the training samples and labels from the file and store them in the DB Store '''

    limit = 50

    trainingSamples = []
    trainingLabels = []

    count = 0
    with open('trainingFeature.dat') as trainingSamplesFH:
      for sample in trainingSamplesFH:

        if count >= limit:
          break

        sample = list(map(int, sample.strip().split()))
        trainingSamples.append(sample)

        count += 1

    count = 0
    with open('trainingLabel.dat') as trainingLabelsFH:
      for label in trainingLabelsFH:

        if count >= limit:
          break

        label = int(label.strip())
        trainingLabels.append(label)

        count += 1

    for index in range(len(trainingSamples)):
      sample = model.Sample(
        feature=trainingSamples[index],
        label=trainingLabels[index],
        isUsed=False
      )
      sample.put()

class TestAndroidHandler(webapp2.RequestHandler):

  def get(self):
    client = memcache.Client()
    param = memcache.get('model')

    if param is None:
      # create the paramater in the data store and update the cache
      newParam = model.Parameter(id="model", feature=str([0]*5))
      newParam.put()

    memcache.add(key='param', value=newParam.feature)
    param = client.gets('param')
    model = { 'model' : param }

    self.response.headers['Content-Type'] = 'application/json'
    self.response.write(json.dumps(param))

  def post(self):

    commObject = json.loads(self.request.POST['sample'])
    sample = eval(commObject['sample'])
    sampleID = sample[0]
    
    response = {
      'cmd' : 'delete',
      'value' : sampleID
    }

    self.response.headers['Content-Type'] = 'text/plain'
    self.response.write(json.dumps(response))    

class ActivityRequestHandler(webapp2.RequestHandler):

  def get(self):
    get_request = self.request.GET
    get_response = self.response

    # check 'shared_model' key in memcache
    # if not found, get from DB using the key - if its found, its auto updated in memcache
    # if not found, add a new model, using the key and all zeros as the value

    client = memcache.Client()

    with ndbmodels.Model.getLock():
      # without lock, might lead to race conditions
      shared_model = memcache.get('shared_model')
      if shared_model is None:
          new_model = ndbmodels.Model(id="shared_model", param=str([0]*5))
          new_model.put()
          memcache.add(key='shared_model', value=new_model.param)

    # after lock released
    shared_model = memcache.get('shared_model')
    
    get_response.headers['Content-Type'] = 'text/plain'
    get_response.write(shared_model)

  def post(self):

    post_request = self.request.POST

    if 'model' in post_request:
      # acquire lock on the model
      # update it
      # update memcache
      # release lock
      
      client = memcache.Client()

      with ndbmodels.Model.getLock():
        shared_model = memcache.get('shared_model')
        if shared_model is None:
          new_model = ndbmodels.Model(id="shared_model", param=post_request['model'])
          new_model.put()
          memcache.add(key='shared_model', value = new_model.param)
        else:
          model = ndbmodels.Model.get_by_id('shared_model')
          model.param = post_request['model']
          model.put() # supposed to auto update the key in memcache
          memcache.set(key='shared_model', value = model.param)

      response = {
        'cmd' : 'save',
        'value' : post_request['model']
      }
          
    elif 'sample' in post_request:
      # create a new sample object from the constructor
      # save async, get future
      # send the id back, for deletion
      # process the sample
      # update is_used = true
        samples = eval(post_request['sample'])
        samplesToBeStored = []
        client_sample_ids = []

        for sample in samples:

          client_sample_ids.append(sample[0])
          new_sample = ndbmodels.Sample(
              user_activity = sample[1],
              ringer_mode = sample[2],
              day_of_week = sample[3],
              approx_time = sample[4],
              hour_of_day = sample[5],
              label_client_predicted = sample[6],
              label_original = sample[7]
            )
          samplesToBeStored.append(new_sample)

          # future_object = new_sample.put_async()
        sample_ids = ndb.put_multi(samplesToBeStored)
        response = {
          'cmd' : 'delete',
          'value' : str(client_sample_ids)
        }

          # new_sample_id = future_object.get_result().id()
          # new_sample = ndbmodels.Sample.get_by_id(new_sample_id)

          # train with the new sample here
          # update label_self_predicted property
          # change the used flag to true
          # save it

    self.response.headers['Content-Type'] = 'text/plain'
    self.response.write(json.dumps(response))

application = webapp2.WSGIApplication([
    ('/', MainHandler),
    ('/samples', SampleHandler),
    ('/param', ParameterHandler),
    ('/activity_api', ActivityRequestHandler),
    ('/clear', ClearHandler),
], debug=True)