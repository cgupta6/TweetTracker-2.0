import json
from time import time
from APIClass import *
from MongoDBQueryMaker import *
from MongoDBFacade import *
import QueryMakerHelper

class SearchExportYaks(object):
    def __init__(self, config):
        # the fields we want to return
        self.projection=\
        {
            "text": 1,
            "cat": 1,
            "location": 1,
            "timestamp": 1,
            "likes": 1,
            "date": 1
        }

        self.mongoDBFacade = MongoDBFacade(config)


    def getYaks(self, queryargs):
        #print "getting yaks"
        categories = queryargs.getlist('categoryID')
        start_time = queryargs['start_time'] if 'start_time' in queryargs else 0
        end_time = queryargs['end_time'] if 'end_time' in queryargs else int(time())
        keywords = queryargs.getlist('keyword') if 'keyword' in queryargs else []
        geoboxes = queryargs.getlist('geobox') if 'geobox' in queryargs else []
        users = queryargs.getlist('user') if 'user' in queryargs else []
        skip = queryargs['skip'] if 'skip' in queryargs else 0
        limit = queryargs['limit'] if 'limit' in queryargs else 1000
        sort_by = queryargs['sort_by'] if 'sort_by' in queryargs else 'relevance'

        #check valid input
        try:
            categories = [int(x) for x in categories]
            skip = int(skip)
            limit = max(min(int(limit), 1000), 1) #force 1 <= limit <= 1000
        except:
            return (False, 'All categoryIDs, skip, and limit must be integers.')

        try:
            start_time = int(start_time)
            end_time = int(end_time)
            if start_time < 0 or end_time < 0:
                return (False, 'start_time and end_time must be positive Unix timestamps in GMT.')
            if end_time < start_time:
                return (False, 'start_time must be before end_time.')
        except:
            return (False, 'start_time and end_time must be Unix timestamps in GMT.')

        # if the start time is zero, go two days back
        if start_time == 0:
            start_time = end_time - (2 * 24 * 60 * 60)
        queryMaker = MongoDBQueryMaker()
               #build the query
        query = queryMaker.buildQuery(categories, start_time, end_time)
        print 'YAKKKKk', query
        docs = self.mongoDBFacade.queryYaks(None, query, self.projection, skip, limit, start_time, sort_by)

        yaks = []

        for doc in docs:

            del doc['_id']
            print doc

            yaks.append(doc)

        #todo: add sorting
        syaks = sorted(yaks, key=lambda k: k['timestamp'], reverse=True)

        #print 'printing yaks'
        #print yaks
        #print 'printing sorted'
        #print syaks
        #print yaks


        return True, syaks
