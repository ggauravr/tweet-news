from google.appengine.ext import ndb
import threading

class Model(ndb.Model):
  param = ndb.TextProperty()
  # sample_count = ndb.IntegerProperty()

  _sample_count = 1
  _lambda = 0.001
  _thread_lock = threading.Lock()

  @classmethod
  def getLock(cls):
    return cls._thread_lock

  @classmethod
  def getLambda(cls):
    return cls._lambda

  @classmethod
  def getSampleCount(cls):
    return cls._sample_count

  @classmethod
  def updateSampleCount(cls):
    cls._sample_count += 1

class Sample(ndb.Model):
  # id is automatically added by the datastore
  
  value = ndb.TextProperty(default = '')

  # # five features of the sample below
  # user_activity = ndb.FloatProperty()
  # ringer_mode = ndb.FloatProperty()
  # day_of_week = ndb.FloatProperty()
  # approx_time = ndb.FloatProperty()
  # hour_of_day = ndb.FloatProperty()

  # # labels
  # label_client_predicted = ndb.FloatProperty()
  # label_self_predicted    = ndb.FloatProperty()
  # label_original             = ndb.FloatProperty()

  # boolean flag, indicating if the sample has been used for training
  is_used = ndb.BooleanProperty(default=False)
