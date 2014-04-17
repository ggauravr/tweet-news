import cgi
import webapp2
from google.appengine.ext import ndb
from google.appengine.api import memcache
import json
import numpy
import math

import ndbmodels
import constants as Constants

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
          new_model = ndbmodels.Model(id="shared_model", param=str([0]*Constants.N_DIMENSIONS))
          new_model.put()
          memcache.add(key='shared_model', value= str([0]*Constants.N_DIMENSIONS))

    # after lock released
    shared_model = memcache.get('shared_model')
    
    get_response.headers['Content-Type'] = 'text/plain'
    get_response.write(shared_model)

  def post(self):

    post_request = self.request.POST
    
    if 'sample' in post_request:
      
      sample = eval(post_request['sample'])

      new_sample = ndbmodels.Sample(value = str(sample))

      # predict the label using the current model stored
      # then update the model using sent gradient
      
      with ndbmodels.Model.getLock():
        # without lock, might lead to race conditions
        shared_model = memcache.get('shared_model')
        if shared_model is None:
            # create a new model in DB and update cache
            new_model = ndbmodels.Model(id="shared_model", param=str([0]*Constants.N_DIMENSIONS))
            new_model.put()
            memcache.add(key='shared_model', value= str([0]*Constants.N_DIMENSIONS))

      # after lock released
      shared_model = memcache.get('shared_model')

      with ndbmodels.Model.getLock():
        # x = new_sample.predict()
        w = numpy.array(eval(shared_model))
        x = numpy.array(sample[0:Constants.N_DIMENSIONS])
        wx = numpy.dot(w, x)

        probability = 1 / (1 + math.exp(-wx))
        if probability > 0.5:
          new_sample.predicted_value = 1
        else:
          new_sample.predicted_value = 0

        new_sample.is_used = True

        print "w : ", w
        print "x : ", x
        print "wx : ", wx

        sample_id = new_sample.put()

      # update model
      with ndbmodels.Model.getLock():
        # convert the string gradient to a list -> to a numpy array
        gradient = numpy.array(eval(post_request['gradient']))
        response = None

        shared_model = memcache.get('shared_model')
        if shared_model is None:
          # create a new model, update it
          param = numpy.array([0]*Constants.N_DIMENSIONS)
          param = param - gradient * (ndbmodels.Model.getLambda()/ndbmodels.Model.getSampleCount())
          
          response = str(param.tolist())
          ndbmodels.Model.updateSampleCount()

          new_model = ndbmodels.Model(id="shared_model", param=response)
          new_model.put()
          memcache.add(key='shared_model', value = response)
        else:
          
          model = ndbmodels.Model.get_by_id('shared_model')
          param = numpy.array(eval(shared_model))
          param = param - gradient * (ndbmodels.Model.getLambda()/ndbmodels.Model.getSampleCount())

          response = str(param.tolist())
          ndbmodels.Model.updateSampleCount()

          model.param = response
          model.put()
          memcache.set(key='shared_model', value = response)

        response = {
          'cmd' : 'update_ack',
          'n_samples' : ndbmodels.Model.getSampleCount(),
          'wx' : wx
        }

    self.response.headers['Content-Type'] = 'text/plain'
    self.response.write(json.dumps(response))

application = webapp2.WSGIApplication([
    ('/', MainHandler),
    ('/clear', ClearHandler),
    ('/activity_api', ActivityRequestHandler),
], debug=True)