import cgi
import webapp2
from google.appengine.ext import ndb
from google.appengine.api import memcache
import json
import numpy as np

import ndbmodels

N_ACTIVITIES = 6
N_RINGER_MODES = 3
# 0 - WORK HOUR, 1 - OTHER
N_HOUR = 2
# 0 - AM , 1 PM
N_AM_PM = 2
# 0 - WEEKDAY, 1 - WEEKEND
N_DAY_OF_WEEK = 2
N_BIAS = 1

N_DIMENSIONS =  N_ACTIVITIES + N_RINGER_MODES + N_HOUR + N_AM_PM + N_DAY_OF_WEEK + N_BIAS

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

class ClearHandler(webapp2.RequestHandler):
  def get(self):
      
      # delete all the samples from the database
      samples = ndbmodels.Sample.query().fetch(keys_only=True)
      ndb.delete_multi(samples)

      # flush memcache
      memcache.flush_all()

      self.response.write('Samples repopulated.. Memcached cleared')

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
          # create a new model in DB and update cache
          new_model = ndbmodels.Model(id="shared_model", param=str([0]*N_DIMENSIONS))
          new_model.put()
          memcache.add(key='shared_model', value= str([0]*N_DIMENSIONS))

    # after lock released
    shared_model = memcache.get('shared_model')
    
    get_response.headers['Content-Type'] = 'text/plain'
    get_response.write(shared_model)

  def post(self):

    post_request = self.request.POST

    if 'gradient' in post_request:
      # acquire lock on the model
      # update it
      # update memcache
      # release lock
      
      client = memcache.Client()

      with ndbmodels.Model.getLock():
        # convert the string gradient to a list -> to a numpy array
        gradient = np.array(eval(post_request['gradient']))
        response = None

        shared_model = memcache.get('shared_model')
        if shared_model is None:
          # create a new model, update it
          param = np.array([0]*N_DIMENSIONS)
          param = param - gradient * (ndbmodels.Model.getLambda()/ndbmodels.Model.getSampleCount())
          
          response = str(param.tolist())
          ndbmodels.Model.updateSampleCount()

          new_model = ndbmodels.Model(id="shared_model", param=response)
          new_model.put()
          memcache.add(key='shared_model', value = response)
        else:
          
          model = ndbmodels.Model.get_by_id('shared_model')
          param = np.array(eval(shared_model))
          param = param - gradient * (ndbmodels.Model.getLambda()/ndbmodels.Model.getSampleCount())

          response = str(param.tolist())
          ndbmodels.Model.updateSampleCount()

          model.param = response
          model.put()
          memcache.set(key='shared_model', value = response)

      response = {
        'cmd' : 'save',
        'value' : response,
        'n_samples' : ndbmodels.Model.getSampleCount()
      }
          
    elif 'sample' in post_request:
      # create a new sample object from the constructor
      # save async, get future
      # send the id back, for deletion
      # process the sample
      # update is_used = true
        samples = eval(post_request['sample'])
        samplesToBeStored = []

        for sample in samples:
          new_sample = ndbmodels.Sample(value = str(sample))
          samplesToBeStored.append(new_sample)

        sample_ids = ndb.put_multi(samplesToBeStored)
        response = {
          'cmd' : 'delete'
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
    ('/clear', ClearHandler),
    ('/activity_api', ActivityRequestHandler),
], debug=True)