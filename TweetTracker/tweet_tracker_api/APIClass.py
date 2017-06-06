"""
Program to initialize api configuration
"""
from pymongo import MongoClient
from datetime import datetime, timedelta
import twython


class TweetTrackerAPIClass(object):
    """
    API class
    """
    def __init__(self, config):
        """

        :param config: API configuration
        """
        self.dist_server = MongoClient(config['mongo_dist_server'], config['mongo_dist_port'])
        self.dist_db = self.dist_server[config['mongo_dist_db']]
        self.dist_db.authenticate(config['mongo_dist_username'], config['mongo_dist_password'])
        
        self.ram_server = MongoClient(config['mongo_ram_server'], config['mongo_ram_port'])
        self.ram_db = self.ram_server[config['mongo_ram_db']]
        self.ram_db.authenticate(config['mongo_ram_username'], config['mongo_ram_password'])

        self.api_key = config['api_key']
        self.api_secret = config['api_secret']
        self.token_key = config['token_key']
        self.token_secret = config['token_secret']
        self.twython = twython.Twython(self.api_key, self.api_secret, self.token_key, self.token_secret)

        self.enable_registration = config['enable_registration']

        self.config = config


    def decideConnection(self, minTime):
        """
        This function will decide whether we should use the RAM or Regular DB to execute queries.
        :param minTime: the minimum time in the query. If any data will be older than the oldest data on the RAM db, use regular.
        minTime should be a unix timestamp         
        :return: return database type
        """
        td = timedelta(days=2)
        minTimeDatetime = datetime.fromtimestamp(float(minTime))
        
        #print "minTimeDatetime", minTimeDatetime
        #print "MAX", datetime.now() - td

        if minTimeDatetime < datetime.now() - td:
            #print "RETURNING DISTRIBUTED"
            #print self.dist_db
            return ("distributed", self.dist_db)
        else:
            print "RETURNING RAM"
            print self.ram_db
            return ("ram", self.ram_db)

