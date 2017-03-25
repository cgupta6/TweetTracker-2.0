from flask import Flask
from flask import request
from flask import jsonify
from flask import session
import pymongo
from collections import defaultdict
import operator
from APIClass import *
import InvalidUsage
import random
from time import time
import logging

class Entities(TweetTrackerAPIClass):

    def __init__(self, config):
        super(Entities, self).__init__(config)
        


    def getEntities(self, queryargs):
        print queryargs
        
        try:
            categories=queryargs.getlist('categoryID')
            
            categories = [int(x) for x in categories]
            
        except:
            return (False, "All categoryIDs must be integers")
        
        
        try:
            limit=queryargs.get('limit')
            limit=int(limit)
            if limit>50 or limit<1:
                return (False,"the limit must be a positive number less than or equal to 50.")
                
        except:
            return (False,"the limit must be a positive number less than or equal to 50.")

        try:
            start_time = queryargs['start_time'] if 'start_time' in queryargs else 0
            end_time = queryargs['end_time'] if 'end_time' in queryargs else int(time())
            start_time = int(start_time)
            end_time = int(end_time)
            if start_time < 0 or end_time < 0:
                raise InvalidUsage('start_time and end_time must be positive Unix timestamps in GMT.', status_code=410)
            if end_time < start_time:
                raise InvalidUsage('start_time must be before end_time.', status_code=410)
        except:
            raise InvalidUsage('start_time and end_time must be Unix timestamps in GMT.', status_code=410)

        #if the start time is zero, go two days back
        if start_time == 0:
            start_time = end_time - (2 * 24 * 60 * 60)
        
        try:
            types = queryargs.getlist('Types')
            for typ in types:
                if typ not in ["TopUrls","TopHashtags","TopMentions"]:
                    return (False,"Types must be a list containing one or more of the following: TopUrls , TopHashtags, TopMentions.")

        except:
            return (False,"Types must be a list containing one or more of the following: TopUrls , TopHashtags, TopMentions.")
        
        
        try:
            geoboxes = queryargs.getlist('geobox') if 'geobox' in queryargs else []
            boxes = [x.split(",") if x.find(",") != -1 else [x] for x in geoboxes]
            geoboxes = []
            for b in boxes:
				geoboxes += b
            geoboxes = map(float, geoboxes)

            if len(geoboxes) % 4 != 0:
                return (False, 'Geobox argument must contain a number of parameters divisible by 4.')
        except:
            return (False, "Geobox argument must be real numbers.")
         
        #key=queryargs.get('key')
        
        '''
        try:
            approx=queryargs.get('approx')
            
            if approx not in ["true","false"]:
                return (False,"approx field must be true or false")
        except:
            return (False,"approx field must be true or false")
        '''
        
        # Add the geo stuff if provided
        
        geoQuery = []
        for idx in range(1, 1 + len(geoboxes) / 4):
            (lllng, lllat, urlng, urlat) = geoboxes[4*(idx-1):4*idx]
            geoQuery.append({
                "location.lng": {
                    "$gte": lllng,
                    "$lte": urlng
                },
                "location.lat": {
                    "$gte": lllat,
                    "$lte": urlat
                }
            })
        # IF there is only one box, we don't want an $or, we want just the object.
        if len(geoboxes) == 0:
            geoQuery = {}
        if len(geoboxes) == 4:
            geoQuery = geoQuery[0]
        elif len(geoboxes) > 4:
            geoQuery = {"$or": geoQuery}
        
        entities=[]
        
        if "TopUrls" in types:
            entities.append({"entities.urls.expanded_url":{"$exists":True}})

        if "TopHashtags" in types:
            entities.append({"entities.hashtags.text":{"$exists":True}})
            
        if "TopUsers" in types:
            entities.append({"entities.user_mentions.screen_name":{"$exists":True}})
        
        
        db_type, db = self.decideConnection(start_time)
        print "The db_type is", db_type
        
        
        # if db_type == "ram":
            # q = dict({"timestamp":{"$gte":start_time*1000,"$lte":end_time*1000},"cat":{"$in":categories},"$or":entities}.items()+geoQuery.items())
            # content = db.tweets.find(q,{"entities":1})
            
        # else:
        #build the query around these parameters
        catQuery = []
        for cat in categories:
            for idx in [0,1,2]:
                c = str(cat + 333000 * idx)
                q = {
                    "catime": {
                        "$gte": long(c + "{0:010d}".format(start_time)), 
                        "$lte": long(c + "{0:010d}".format(end_time))
                    }
                }
                # merge in the location information
                q = dict(q.items() + geoQuery.items())
                catQuery.append(q)
                
        #start_rand = random.choice([0.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9])
        #q={"$or": catQuery,"rand":{"$gte":start_rand,"$lte":(start_rand+0.1)}}
        
        q={"$or": catQuery}
        
        content= db.tweets.find(q,{"entities":1})

        # Logging the query to the entities here
        try:
            log = logging.getLogger()
            log.error(session['username'] + ' ' + 'Tweetalyzer:getEntities' + ' ' + str(q))
        except Exception as e:
            print 'Exception occured!'

        #content= db.tweets.find(q,{"entities":1}).limit(1).explain()
        #return False,content
        #.hint([("catime", pymongo.ASCENDING),("location.lng", pymongo.ASCENDING),("location.lat", pymongo.ASCENDING),("rand", pymongo.ASCENDING)])
            
        entities_urls=defaultdict(int)
        entities_hashtags=defaultdict(int) 
        entities_mentions=defaultdict(int)
        
        for entry in content:
            
            try:
                for url in entry["entities"]["urls"]:
                    entities_urls[url["expanded_url"]]+=1
                
            except:
                pass
            
            try:
            
                for hashtag in entry["entities"]["hashtags"]:
                    entities_hashtags[hashtag["text"]]+=1
            except:
                pass
            
            try:
                for user in entry["entities"]["user_mentions"]:
                    entities_mentions[user["screen_name"]]+=1
            except:
                pass
        
        try:    
            sorted_urls = sorted(entities_urls.items(),key=operator.itemgetter(1),reverse=True)
        except:
            sorted_urls=[]
        
        try:
            sorted_hashtags = sorted(entities_hashtags.items(),key=operator.itemgetter(1),reverse=True)
        except:
            sorted_hashtags=[]
        
        try:    
            sorted_mentions = sorted(entities_mentions.items(),key=operator.itemgetter(1),reverse=True)
        except:
            sorted_mentions=[]
         
        
        return True,{"TopUrls":sorted_urls[:min(len(sorted_urls),limit)],"TopHashtags":sorted_hashtags[:min(len(sorted_hashtags),limit)],"TopMentions":sorted_mentions[:min(len(sorted_mentions),limit)]}
