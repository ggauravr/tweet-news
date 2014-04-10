from google.appengine.ext import ndb
import threading

class Sample(ndb.Model):
  # the five feature set
  features = ndb.JsonProperty()
  # predicted value sent by the client
  clientPredictedLabel = ndb.IntegerProperty()
  # predicted value after learning at the server
  selfPredictedLabel = ndb.IntegerProperty()
  # original label sent by the client
  originalLabel = ndb.IntegerProperty()
  # isUsed = ndb.BooleanProperty()

class Parameter(ndb.Model):
  ''' Models the Parameter of the Training Model '''
  feature = ndb.TextProperty()

class Model(ndb.Model):
  param = ndb.TextProperty()

  _thread_lock = threading.Lock()

  @classmethod
  def getLock(cls):
    return cls._thread_lock

class Sample(ndb.Model):
  # id is automatically added by the datastore
  
  # five features of the sample below
  user_activity = ndb.FloatProperty()
  ringer_mode = ndb.FloatProperty()
  day_of_week = ndb.FloatProperty()
  approx_time = ndb.FloatProperty()
  hour_of_day = ndb.FloatProperty()

  # labels
  label_client_predicted = ndb.FloatProperty()
  label_self_predicted    = ndb.FloatProperty()
  label_original             = ndb.FloatProperty()

  # boolean flag, indicating if the sample has been used for training
  is_used = ndb.BooleanProperty(default=False)
