from google.appengine.ext import ndb
from google.appengine.api import memcache
import threading
import numpy
import math

import constants as Constants

class Model(ndb.Model):

  # instance variables
  param = ndb.TextProperty()

  # class level variables
  _sample_count = 1
  _lambda = 10E-5
  _thread_lock = threading.Lock()


  # gives a global threading lock, for model update
  @classmethod
  def getLock(cls):
    return cls._thread_lock

  # fetches the lambda constant, the learning rate
  @classmethod
  def getLambda(cls):
    return cls._lambda

  # gets the currently processed number of samples
  @classmethod
  def getSampleCount(cls):
    return cls._sample_count

  # increments the sample count after model update
  @classmethod
  def updateSampleCount(cls):
    cls._sample_count += 1

class Sample(ndb.Model):
  # id is automatically added by the datastore
  
  value = ndb.TextProperty(default = '')
  predicted_value = ndb.IntegerProperty(default = 0)
  # boolean flag, indicating if the sample has been used for training
  is_used = ndb.BooleanProperty(default=False)

  def predict(self):
    # recompute shared model
    shared_model = memcache.get('shared_model')

    # get sample and model for processing
    w = eval('shared_model') # will have ndimensions elements
    w = numpy.array(w)

    x = eval(self.value) # will have ndimensions+2 elements
    x = numpy.array(x[0:Constants.N_DIMENSIONS]) # slice it to have ndimensions

    wx = sum(w*10)
    print 'W: ', type(w), w
    print 'X: ',type(x), w
    print 'WX: ',type(wx), wx
    # wx = -1 * wx
    # probability = 1 / (1 + math.exp(wx))
    probability = 0.5
    if probability > 0.5:
      self.predicted_value = 1
    else:
      self.predicted_value = 0

    self.is_used = True

    return x
