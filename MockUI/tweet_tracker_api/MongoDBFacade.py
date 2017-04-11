"""
Program for mongodb queries
"""
import json
import pymongo
from time import time
from APIClass import *

class MongoDBFacade(TweetTrackerAPIClass):
    """
    MongoDB Facade class
    """
    def __init__(self, config):
        """
        
        :param config: configuration
        """
        super(MongoDBFacade, self).__init__(config)

    def determineBestDBToQuery(self, start_time):
        """
        
        :param start_time: start time
        :return: database type
        """
        return self.decideConnection(start_time)[1]

    def runQuery(self, db, collectionName, query, projections, skip, limit, sort):
        """
        
        :param db: db object
        :param collectionName: Collection name 
        :param query: query
        :param projections: projections  
        :param skip: skip
        :param limit: limit
        :param sort: sort type
        :return: result of query
        """
        timestart = time()
        print "=== Starting query at %d ===" % timestart
        print 'Executing query: ' + json.dumps(query)
        print 'Skipping %d, Limiting to %d' % (skip, limit)

        res = db[collectionName].find(query, projections).skip(skip).limit(limit).sort(sort, pymongo.DESCENDING)
        
        timefinish = time()
        print '=== Built Cursor at %d (%f seconds) ===' % (timefinish, timefinish - timestart)

        return res

    def queryImages(self, db, query, projections, skip, limit, start_time, sort_by='relevance'):
        """
        
        :param db: db object
        :param query: query
        :param projections: projections 
        :param skip: skip
        :param limit: limit
        :param start_time: start time
        :param sort_by: sort type
        :return: image results from query
        """
        if db is None:
            db = self.decideConnection(start_time)[1]
        return self.runQuery(db, "images", query, projections, skip, limit, sort_by)

    def queryVideos(self, db, query, projections, skip, limit, start_time, sort_by='relevance'):
        """
        
        :param db: db object
        :param query: query
        :param projections:  projections
        :param skip: skip
        :param limit: limit
        :param start_time: start time
        :param sort_by: sort type
        :return: video results of query
        """
        if db is None:
            db = self.decideConnection(start_time)[1]
        return self.runQuery(db, "videos", query, projections, skip, limit, sort_by)

    def queryYaks(self, db, query, projections, skip, limit, start_time, sort_by='relevance'):
        """
        interface to interact with mongodb to query for yaks
        :param db: db object
        :param query: query
        :param projections:  projections
        :param skip: skip
        :param limit: limit
        :param start_time: start time
        :param sort_by: sort type
        :return: yaks results of query
        """

        if db is None:
            db = self.dist_db
        #print 'queryyaks'
        return self.runQuery(db, "yikyak", query, projections, skip, limit, sort_by)



