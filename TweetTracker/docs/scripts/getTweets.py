"""
Program to get tweets
"""
import json
from time import time
from APIClass import *
import bullshit
import logging
from flask import session

class SearchExport(TweetTrackerAPIClass):
    """
    Class to export tweets
    """
    def __init__(self, config):
        """

        :param config: configuration
        """
        super(SearchExport, self).__init__(config)

        #the fields we want to return...
        self.projection = {
            "retweet_count": 1,
            "geoflag": 1,
            "text": 1,
            "created_at": 1,
            "retweeted": 1,
            "screen_name_lower": 1,
            "tweet-lang": 1,
            "lang": 1,
            "entities": 1,
            "location": 1,
            "timestamp": 1,
            "type": 1,
            "id": 1,
            "user": 1,
			"cat": 1,
        }

    def getTweets(self, queryargs):
        """

        :param queryargs: query arguments
        :return: tweets and count in an object
        """
        categories = queryargs.getlist('categoryID')
        start_time = queryargs['start_time'] if 'start_time' in queryargs else 0
        end_time = queryargs['end_time'] if 'end_time' in queryargs else int(time())
        keywords = queryargs.getlist('keyword') if 'keyword' in queryargs else []
        geoboxes = queryargs.getlist('geobox') if 'geobox' in queryargs else []
        users = queryargs.getlist('user') if 'user' in queryargs else []
        language = queryargs.getlist('language') if 'language' in queryargs else []
        anonymize = queryargs['anonymize'] if 'anonymize' in queryargs else '0'
        skip = queryargs['skip'] if 'skip' in queryargs else 0
        limit = queryargs['limit'] if 'limit' in queryargs else 1000

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


        try:
            
            boxes = [x.split(",") if x.find(",") != -1 else [x] for x in geoboxes]
            geoboxes = []
            for b in boxes: geoboxes += b
            geoboxes = map(float, geoboxes)

            if len(geoboxes) % 4 != 0:
               return (False, 'Geobox argument must contain a number of parameters divisible by 4.')
        except:
            return (False, 'Geobox must be reals.')

        #remove the @ from the user names if they've provided it. also convert to lowercase
        users = [x[1:] if x[0] == "@" else x for x in users]
        users = [x.lower() for x in users]

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

        orParts = [geoQuery] if len(geoQuery.keys()) > 0 else []

        #add remaining things
        if len(keywords) > 0:
            orParts.append({"keywords": {"$in": keywords}})
        if len(users) > 0:
            orParts.append({"screen_name_lower": {"$in": users}})
        if len(language) > 0:
            orParts.append({"lang": {"$in": language}})

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
                if len(orParts) > 0:
                    q['$or'] = orParts
                # merge in the location information
                catQuery.append(q)

        # Add the catime queries
        q = {"$or": catQuery}

        tweets = []
        timestart = time()
        print "=== Starting query at %d ===" % timestart
        print 'Executing query: ' + json.dumps(q)
        print 'Skipping %d, Limiting to %d' % (skip, limit)

        try:
            log = logging.getLogger()
            log.error(session['username'] + ' ' + 'Tweetalyzer:Tweets' + ' ' + str(q))
        except Exception as e:
            print 'Exception occured!'

        database = self.decideConnection(start_time)[1]  # we don't care about the dist/ram string
        for doc in database.tweets.find(q, self.projection).skip(skip).limit(limit):
            del doc['_id']
            #convert the fields that would not make sense to an end user
            #doc['type'] = bullshit.convert_type(doc.get('type', 1))
            if 'tweet-lang' in doc:
                doc['tweet-lang'] = bullshit.convert_lang_code(doc['tweet-lang'])
            # else:
                # doc['tweet-lang'] = doc['lang']
            doc['str_id_tweet'] = str(doc['id'])
            tweets.append(doc)

        print '=== Query finished at %d (%f seconds) ===' % (time(), time() - timestart)

        #code to count the number of tweets in the job
        countOfTweets  = str(database.tweets.find(q).count())

        #anonymize the tweets if requested
        print "Are we anonymizing?", anonymize != '0'
        anon_dict = {}
        if anonymize != '0':
            for idx in xrange(len(tweets)):
                #get the anonymized id
                uname = tweets[idx]['screen_name_lower']
                anonid = anon_dict.get(uname, len(anon_dict.items()))
                anon_dict[uname] = anonid
                #update it
                tweets[idx]['screen_name_lower'] = str(anonid)

                #check the usernames in the text
                if 'user_mentions' not in tweets[idx]['entities']:
                    continue
                for useridx, uname in enumerate(tweets[idx]['entities']['user_mentions']):
                    #get the anonymized id
                    unameu = uname['screen_name']
                    anonid = anon_dict.get(unameu, len(anon_dict.items()))
                    anon_dict[unameu] = anonid
                    #update it
                    tweets[idx]['text'] = tweets[idx]['text'].replace(unameu, str(anonid))
                    tweets[idx]['entities']['user_mentions'][useridx] = str(anonid)

        returnObject = {
            'tweets' : tweets,
            'count' : countOfTweets 
        }
        return True, returnObject
