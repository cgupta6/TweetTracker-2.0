import dicttoxml
from flask import abort, jsonify, Response
import json
import time
from tweet_tracker_api.job_management import job
from mstranslator import Translator
from tweet_tracker_api.MongoDBFacade import MongoDBFacade
from flask import session 
import logging

tweets = None
ram_tweets = None
translator = Translator('4+9RqJt9le3aEYoc6sfoYDgTkMy+xXVUL7g4U9Nrz6w=')


def setup(collection, ram_collection):
    """ This function allows server.py to set up the collection.

    :param collection: The MongoDB collection object to get tweets from.
    """
    global tweets
    global ram_tweets
    tweets = collection
    ram_tweets = ram_collection


from bson import ObjectId
from bson import json_util

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)

def download_job(username, job_id):
    """ Removes the job from its owner so it won't appear in their job list.

    :param username: The user seeking to delete a job
    :param job_id: The job to delete
    :return: An HTTP status code indicating success/failure
    """
    #user_id = username_to_id(username)
    if username is None:
        abort(401)
    mongo_success = list(tweets.find({"cat": job_id}))

    print("mongo success3.....")
    print(mongo_success)
    print(type(mongo_success))
    
    if mongo_success is None:
        # Forbidden, because the user authenticates but lack permission
        abort(403)
    else:

        #r = flask.Response(json.dumps(mongo_success, ensure_ascii=False),mimetype="application/json")
        #mongo_success = OrderedDict(sorted(mongo_success.iteritems()))
        #r = json.dumps(mongo_success)
        #log = logging.getLogger()
        #log.error(username + ' ' + 'Job_Deletion '+ str(job_id))
        #return JSONEncoder().encode(mongo_success)
        return json.dumps(mongo_success,default=json_util.default)




def get_tweet(username, tweet_id, catime, response_type="JSON", remove_fields={}):
    """ This function retrieves a single tweet and creates a response for it.

    :param username: The user making the request.
    :param tweet_id: The Twitter-assigned ID of the tweet.
    :param catime: The catime index of the tweet.
    :param response_type: The encoding format for the results of the request.
    :return: Either an error code or a JSON response containing the tweet.
    """
    catime_string = str(catime)
    cat = int(catime_string[0:(len(catime_string) - 10)])  # pull the cat out
    t = cat
    # Reduce any offset catimes
    while t > 333000:
        t -= 333000
    job_obj = job.get_job_with_user(t, username)
    if job_obj is None:
        abort(403)

    if not remove_fields:
        remove_fields = None

    result = tweets.find_one({
        "catime": long(catime),
        "id": long(tweet_id)
    }, projection=remove_fields)

    response_object = {
        "tweet": result
    }
    del response_object["tweet"]["_id"]
    if response_type == "xml" or response_type == "XML":
        return Response(dicttoxml.dicttoxml(response_object), mimetype="application/xml")
    elif response_type == "JSON" or response_type == "json":
        return jsonify(response_object)
    else:
        abort(400)


def get_tweets(username, tweet_indices, response_type="JSON", remove_fields={}):
    """ This function retrieves multiple tweets.

    :param username: The user retrieving the tweets.
    :param tweet_indices: The identifiers for the tweets.
    :param response_type: The encoding method for the results
    :return: Either an error code or a JSON response containing the tweet.
    """
    categories = set()
    for tweet_index in tweet_indices:
        print(tweet_index)
        catime_string = str(tweet_index["catime"])
        cat = int(catime_string[0:(len(catime_string) - 10)])
        categories |= set([cat])

    for cat in categories:
        t = cat
        # Reduce any offset catimes
        while t > 333000:
            t -= 333000
        job_obj = job.get_job_with_user(t, username)
        if job_obj is None:
            abort(403)
            
    
    query = {
        "$or": [
            {
                "catime": long(tweet_index["catime"]),
                "id": long(tweet_index["tweet_id"])
            }
        for tweet_index in tweet_indices]
    }

    if not remove_fields:
        remove_fields = None

    print query
    print("Query: " + json.dumps(query))
    result = tweets.find(query, projection=remove_fields)
    print("Found %d" % result.count())

    if result is None:
        abort(400)

    result_tweets = list(result)
    for tweet in result_tweets:
        tweet['id_str'] = str(tweet['id']) # hacky solution, fix in real data
        if tweet['type'] == 'vk':
            tweet['lang'] = 'ru'
        del tweet['_id']
    response_object = {
        "tweets": result_tweets
    }

    response_type = response_type.lower()
    if response_type == "xml":
        return Response(dicttoxml.dicttoxml(response_object), mimetype="application/xml")
    elif response_type == "json":
        return jsonify(response_object)
    else:
        abort(400)


def three_search(username, begin_time, end_time, job_ids, query_object, limit, skip, config, no_limit=False,
                 response_type="JSON", remove_fields={}):
    """ This is an implementation of the UI-side search found in TweetTracker.

    :param username: The user doing the search
    :param begin_time: The time to begin looking for tweets
    :param end_time: The time to end looking for tweets
    :param job_ids: The ids of the jobs we want to take tweets from
    :param query_object: The query we are performing
    :param limit: The number of results to return
    :param skip: The number of results to skip
    :param no_limit: If true, ignore the limit parameter and return all results
    :return: A response either containing search results or an error
    """

    query_object = json.loads(query_object)
    
    # Check that our user can query all selected jobs
    for job_id in job_ids:
        obj = job.get_job_with_user(job_id, username)
        # obj is None if we don't have permission to access the job
        if obj is None:
            print "Can't access job"
            return None

    catime_ids = []
    for job_id in job_ids:
        catime_ids.append(job_id)
        catime_ids.append(job_id + 333000)
        catime_ids.append(job_id + 666000)

    # Create catime constraints for each job_id
    catime_constraints = [{
        "catime": {
            "$gte": long(str(job_id) + str(begin_time)),
            "$lte": long(str(job_id) + str(end_time))
        }
    } for job_id in catime_ids]
    catime_constraints = {
        "$or": catime_constraints
    }

    box1 = interpret_box(query_object['box1'])
    box2 = interpret_box(query_object['box2'])
    box3 = interpret_box(query_object['box3'], switch=True)

    # Check if any of the boxes were malformed
    if box1 is None or box2 is None or box3 is None:
        abort(400)

    query = {
        "$and": []
    }

    if len(box1) > 0:
        query["$and"].append(box1)
    if len(box2) > 0:
        query["$and"].append(box2)
    if len(box3) > 0:
        query["$and"].append(box3)

    if len(query["$and"]) == 0:
        query = {}
    elif len(query["$and"]) == 1:
        query = query["$and"][0]

    new_query = {
        "$or": []
    }
    for i in range(len(catime_constraints["$or"])):
        new_query["$or"].append(dict(catime_constraints["$or"][i].items() + query.items()))

    global tweets
    search_tweets = tweets
    # If this query hits only the last couple of days, use the RAM db
    # ram only holds 2 days now
    print "NOW:", int(round(time.time() * 1000))
    print "BEGIN TIME:", begin_time
    if int(time.time()) - begin_time < 172800:
        print "USING RAM TWEETS"
        global ram_tweets
        search_tweets = ram_tweets
    else:
        print "USING REGULAR TWEETS"

    print("Executing Query:")
    print(json.dumps(new_query))

    if not remove_fields:
        remove_fields = None

    if no_limit:
        new_limit = -1
    else:
        new_limit = limit

    mongoDBFacade = MongoDBFacade(config)

    # Videos Search
    result_videos = []
    video_count = 0
    print("=== Starting Videos ===")
    now = time.time()
    print "VIDEO QUERY:", json.dumps(new_query)

    log = logging.getLogger()
    log.error(session['username'] + ' ' + 'Search/Export:Videos' + ' ' + str(new_query))

    video_results = mongoDBFacade.queryVideos(None, new_query, {"location": 1, "id": 1,"catime": 1, "title":1, "thumbnail":1, "date":1, "description":1, "iFrame":1, "commentCount":1, "likeCount":1, "dislikeCount":1, "favoriteCount":1, "viewCount": 1, "hasLocation":1, "relevance":1, "popularity": 1}, skip, new_limit, begin_time)
    video_count = video_results.count()
    result_videos = list(video_results)
    print "FOUND %d VIDEOS" % (video_count)
    for video in result_videos:
        del video["_id"]
    print("=== Video query finished at %f (%f) ===" % (time.time(), time.time() - now))

    # Tweets Search

    log.error(session['username'] + ' ' + 'Search/Export:Tweets' + ' ' + str(new_query))

    print("=== Starting Tweets ===")
    now = time.time()
    results = search_tweets.find(new_query, projection=remove_fields)
    count = results.count()
    if not no_limit:
        results = results.skip(skip).limit(limit)
    else: # Always limit results because if there are too many, the list takes too long to complete
        results = results.limit(50000)
  
    result_tweets = list(results)

    for tweet in result_tweets:
        tweet['id_str'] = str(tweet['id']) # hacky solution, fix in real data
        if tweet['type'] == 'vk':
            tweet['lang'] = 'ru'
        del tweet["_id"]
    print("=== Tweet query finished at %f (%f) ===" % (time.time(), time.time() - now))

    # Images Search
    print("=== Starting Images ===")
    now = time.time()
    convert_keywords_to_tags(new_query)
    log.error(session['username'] + ' ' + 'Search/Export:Images' + ' ' + str(new_query))
    image_results = mongoDBFacade.queryImages(None, new_query, {"location": 1, "id": 1,"catime": 1, "type": 1, "tags": 1, "link": 1, "created_time": 1, "user": 1, "users_in_photo": 1, "comments": 1, "caption": 1, "likes":1 ,"images":1}, skip, new_limit, begin_time)
    result_images = list(image_results)
    image_count = len(result_images)
    for image in result_images:
        del image["_id"]

    print("=== Images query finished at %f (%f) ===" % (time.time(), time.time() - now))

    response_object = {
        "count": count,
        "image_count": image_count,
        "video_count": video_count,
        "tweets": result_tweets,
        "images": result_images,
        "videos": result_videos
    }

    if response_type == "xml" or response_type == "XML":
        response_object["tweets"] = dicttoxml.dicttoxml(response_object["tweets"])
        response_object["images"] = dicttoxml.dicttoxml(response_object["images"])
        response_object["videos"] = dicttoxml.dicttoxml(response_object["videos"])
        return jsonify(response_object)
    elif response_type == "JSON" or response_type == "json":
        return jsonify(response_object)
    else:
        abort(400)


def interpret_box(box, switch=False):
    """ This horrible function converts a "box" from the three_search into a
    mongodb query object.

    :param box: The box from the query
    :return: A mongodb query interpretation of the box
    """
    result = []
    for term in box:
        box_type = term['type']
        query = {}
        if box_type == 'geo':
            max_lat = term['data']['neLat']
            min_lat = term['data']['swLat']
            max_lng = term['data']['neLng']
            min_lng = term['data']['swLng']
            if switch:
                query["$or"] = [
                    {
                        "location.lat": {
                            "$exists": False
                        }
                    },
                    {
                        "location.lng": {
                            "$exists": False
                        }
                    },
                    {
                        "location.lat": {
                            "$gte": max_lat,
                            "$lte": min_lat
                        }
                    },
                    {
                        "location.lng": {
                            "$gte": max_lng,
                            "$lte": min_lng
                        }
                    }
                ]
                result.append(query)
            else:
                query['$and'] = []
                query['$and'].append({
                    "location.lat": {
                        "$exists": True
                    }
                })
                query['$and'].append({
                    "location.lng": {
                        "$exists": True
                    }
                })
                query['$and'].append({
                    "location.lat": {
                        "$gte": min_lat,
                        "$lte": max_lat
                    }
                })
                query['$and'].append({
                    "location.lng": {
                        "$gte": min_lng,
                        "$lte": max_lng
                    }
                })
                result.append(query)
        elif box_type == 'key':
            if switch:
                query = {
                    "keywords": {"$ne": term['data'].lower()}
                }
                result.append(query)
            else:
                query = {
                    "keywords": term['data']
                }
                result.append(query)
        elif box_type == 'user':
            if switch:
                query = {
                    "user.screen_name": {"$ne": term['data']}
                }
                result.append(query)
            else:
                query = {
                    "user.screen_name": term['data']
                }
                result.append(query)
        # This means that the query is improperly formed -- fail fast
        else:
            return None
    if len(result) == 0:
        return []
    elif len(result) == 1:
        return result[0]
    else:
        if switch:
            return {
                "$and": result
            }
        else:
            return {
                "$or": result
            }


def translate_tweet(tweet):
    """
    
    :param tweet: tweet
    :return: translated tweet
    """
    language = translator.detect_lang(tweet)
    if language == "en":
        return tweet
    else:
        return translator.translate(tweet, lang_to='en')

def get_image(username, image_id, catime, config):
    """
    
    :param username: username
    :param image_id: image id
    :param catime: catime
    :param config: configuration
    :return: image
    """
    projection = {
        "tags": 1,
        "link": 1,
        "created_time": 1,
        "user": 1,
        "caption": 1,
        "likes": 1,
        "images": 1,
        "comments": 1,
        "id": 1,
        "hasLocation": 1,
        "location": 1
    }
    mongoDBFacade = MongoDBFacade(config)
    image = mongoDBFacade.queryImages(None, {"id": image_id, "catime": catime},
            projection, 0, 1, 1)
    image = image[0] # Get image from list
    response_object = {
        "image": image
    }
    del response_object["image"]["_id"]
    return jsonify(response_object)

def get_images(username, image_indices, config, response_type):
    """
    
    :param username: user name
    :param image_indices: image indices
    :param config: configuration
    :param response_type: response type
    :return: images result
    """
    projection = {
        "tags": 1,
        "link": 1,
        "created_time": 1,
        "user": 1,
        "caption": 1,
        "likes": 1,
        "images": 1,
        "comments": 1,
        "id": 1,
        "hasLocation": 1,
        "location": 1
    }
    query = {
        "$or": [
            {
                "catime": long(image_index["catime"]),
                "id": image_index["image_id"]
            }
        for image_index in image_indices]
    }
    mongoDBFacade = MongoDBFacade(config)
    # def queryImages(self, db, query, projections, skip, limit, start_time, sort_by='relevance'):
    print 'HERE'
    docs = mongoDBFacade.queryImages(None, query, projection, 0, -1, 1)
    images = []
    for doc in docs:
        del doc['_id']

        images.append(doc)
    response_object = {
        "images": images
    }
    response_type = response_type.lower()
    if response_type == "xml":
        return Response(dicttoxml.dicttoxml(response_object), mimetype="application/xml")
    elif response_type == "json":
        return jsonify(response_object)
    else:
        abort(400)

def get_video(username, video_id, catime, config):
    """
    
    :param username: user name
    :param video_id: video id
    :param catime: catime
    :param config: configuration
    :return: video
    """
    projection = {
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
    mongoDBFacade = MongoDBFacade(config)
    # def queryVideos(self, db, query, projections, skip, limit, start_time, sort_by='relevance'):
    video = mongoDBFacade.queryVideos(None, {"id": video_id, "catime": catime}, projection, 0, 1, 1)
    video = video[0] # Get video from list
    response_object = {
        "video": video
    }
    del response_object["video"]["_id"]
    return jsonify(response_object)

def get_videos(username, video_indices, config, response_type):
    """
    
    :param username: username
    :param video_indices: video indices 
    :param config: configuration
    :param response_type: response type
    :return: videos result
    """
    projection = {
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
    query = {
        "$or": [
            {
                "catime": long(video_index["catime"]),
                "id": video_index["video_id"]
            }
        for video_index in video_indices]
    }
    mongoDBFacade = MongoDBFacade(config)
    docs = mongoDBFacade.queryVideos(query, projection, 0, -1, 1)
    videos = []
    for doc in docs:
        del doc['_id']

        videos.append(doc)
    response_object = {
        "videos": videos
    }
    response_type = response_type.lower()
    if response_type == "xml":
        return Response(dicttoxml.dicttoxml(response_object), mimetype="application/xml")
    elif response_type == "json":
        return jsonify(response_object)
    else:
        abort(400)

def convert_keywords_to_tags(query):
    """
    
    :param query: query
    :return: 
    """
    for key in query:
        if key == "keywords":
            query["tags"] = query.pop(key)
        elif type(query[key]) == dict:
            convert_keywords_to_tags(query[key])
        elif type(query[key]) == list:
            for obj in query[key]:
                if type(obj) == dict:
                    convert_keywords_to_tags(obj)
