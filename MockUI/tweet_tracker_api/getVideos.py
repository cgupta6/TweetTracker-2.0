"""
Program to get videos
"""
import json
from time import time
from APIClass import *
from MongoDBQueryMaker import *
from MongoDBFacade import *
import QueryMakerHelper
from flask import session 
import logging

class SearchExportVideos(object):
    """
    class to get videos
    """
    def __init__(self, config):
        """
 
        :param config: configuration
        """
        self.projection = {
            "id": 1,
            "title": 1,
            "thumbnail": 1,
            "date": 1,
            "description": 1,
            "iFrame": 1,
            "commentCount": 1,
            "likeCount": 1,
            "dislikeCount": 1,
            "favoriteCount": 1,
            "viewCount": 1,
            "hasLocation": 1,
            "location": 1
        }

        self.mongoDBFacade = MongoDBFacade(config)


    def getVideos(self, queryargs):
        """

        :param queryargs: query arguments
        :return: videos
        """
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

        #if the start time is zero, go two days back
        if start_time == 0:
            start_time = end_time - (2 * 24 * 60 * 60)

        queryMaker = MongoDBQueryMaker()

        # add geoboxes to the query
        if geoboxes:
            processedGeoboxes = QueryMakerHelper.formatGeoboxes(geoboxes)
            if not processedGeoboxes["success"]:
                return (False, processedGeoboxes["message"])
            else:
                queryMaker.addGeoboxes("location.lng", "location.lat", processedGeoboxes["message"])

        #remove the @ from the user names if they've provided it. also convert to lowercase
        #users = [x[1:] if x[0] == "@" else x for x in users]
        #users = [x.lower() for x in users]

        # add keywords
        #queryMaker.addMembershipCondition("tags", keywords)
        # add users
        #queryMaker.addMembershipCondition("user.username", users)

        #build the query
        query = queryMaker.buildQuery(categories, start_time, end_time)

        try:
            log = logging.getLogger()
            log.error(session['username'] + ' ' + 'Tweetalyzer:getVideos' + ' ' +  str(query))
        except Exception as e:
            print 'Exception occured!'

        docs = self.mongoDBFacade.queryVideos(None, query, self.projection, skip, limit, start_time, sort_by)

        videos = []
        for doc in docs:
            del doc['_id']

            videos.append(doc)

        return True, videos
