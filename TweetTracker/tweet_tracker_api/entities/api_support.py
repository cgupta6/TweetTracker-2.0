__author__ = 'Grant Marshall'

import collections
from flask import abort, jsonify
import random
from time import time
from tweet_tracker_api.job_management import job
from tweet_tracker_api.MongoDBFacade import MongoDBFacade
from tweet_tracker_api.MongoDBQueryMaker import MongoDBQueryMaker

tweets = None
ram_tweets = None


def setup(collection, ram_collection):
    """ This function allows server.py to set up the collection.

    :param collection: The MongoDB collection object to get tweets from.
    """
    global tweets
    global ram_tweets
    tweets = collection
    ram_tweets = ram_collection


def create_catimes(job_ids, begin_time, end_time):
    """ This function creates the catime section of the entities query.

    :param job_ids: The jobs we're making catimes for.
    :param begin_time: The beginning of the time period.
    :param end_time: The ending of the time period.
    :return: A catime query object.
    """
    catime_ids = []
    for job_id in job_ids:
        catime_ids.append(job_id)
        catime_ids.append(job_id + 333000)
        catime_ids.append(job_id + 666000)

    catime_constraints = [{"catime": {
        "$gte": long(str(job_id) + str(begin_time)),
        "$lte": long(str(job_id) + str(end_time))
    }} for job_id in catime_ids]

    catime_constraints = {
        "$or": catime_constraints
    }

    return catime_constraints


def get_all_entities(username, job_ids, begin_time, end_time, limit):
    """

    :param username: username
    :param job_ids: job ids
    :param begin_time: begin time
    :param end_time: end time
    :param limit: limit
    :return:
    """
    # Check that our user can query all selected jobs
    for job_id in job_ids:
        obj = job.get_job_with_user(job_id, username)
        # obj is None if we don't have permission to access the job
        if obj is None:
            return abort(403)

    # Create catime constraints for each job_id
    catime_constraints = create_catimes(job_ids, begin_time, end_time)

    query_obj = [
        {
            "catime": {
                "$gte": catime["catime"]["$gte"],
                "$lte": catime["catime"]["$lte"]
            },
            "entities.user_mentions.screen_name": {
                "$exists": True
            }
        } for catime in catime_constraints["$or"]
    ]
    query_obj += [
        {
            "catime": {
                "$gte": catime["catime"]["$gte"],
                "$lte": catime["catime"]["$lte"]
            },
            "geoflag": True
        } for catime in catime_constraints["$or"]
    ]
    query_obj += [
        {
            "catime": {
                "$gte": catime["catime"]["$gte"],
                "$lte": catime["catime"]["$lte"]
            },
            "keywords": 1
        } for catime in catime_constraints["$or"]
    ]
    query_obj = {"$or": query_obj}

    global tweets
    search_tweets = tweets
    # If this query hits only the last couple of days, use the RAM db
    if int(time()) - begin_time < 174600:
        global ram_tweets
        search_tweets = ram_tweets

    return abort(405)


def get_locations(username, job_ids, begin_time, end_time, config):
    """ This function retrieves the lat lngs from MongoDB.

    :param username: The user logged in for the request
    :param job_ids: The job ids to pull the locations from
    :param begin_time: The beginning of the time period to get locations from
    :param end_time: The end of the time period to get locations from
    :return: Either a JSON response or an error code
    """
    # Check that our user can query all selected jobs
    for job_id in job_ids:
        obj = job.get_job_with_user(job_id, username)
        # obj is None if we don't have permission to access the job
        if obj is None:
            return None

	catime_constraints = create_catimes(job_ids, begin_time, end_time)

    tweet_query_obj = {"$or": [{
                             "catime": {
                                 "$gte": catime["catime"]["$gte"],
                                 "$lte": catime["catime"]["$lte"]
                             },
                             "geoflag": True
                         } for catime in catime_constraints["$or"]]}

    global tweets
    search_tweets = tweets
    # If this query hits only the last couple of days, use the RAM db
    if int(time()) - begin_time < 174600:
        global ram_tweets
        search_tweets = ram_tweets

    tweet_locations = search_tweets.find(tweet_query_obj, {"location": 1, "id": 1,
                                                         "catime": 1})
    queryMaker = MongoDBQueryMaker()
    media_query_obj = queryMaker.buildQuery(job_ids, begin_time, end_time, True)
    mongoDBFacade = MongoDBFacade(config)
    image_locations = mongoDBFacade.queryImages(None, media_query_obj, {"location": 1, "id": 1,"catime": 1}, 0, 1000, begin_time)
    video_locations = mongoDBFacade.queryVideos(None, media_query_obj, {"location": 1, "id": 1,"catime": 1}, 0, 1000, begin_time)

    tweetResults = []
    imageResults = []
    videoResults = []
    for result in tweet_locations:
        tweetResults.append({
            "type": "tweet",
            "lat": result["location"]["lat"],
            "lng": result["location"]["lng"],
             "index": "{}-{}".format(result['id'], result['catime'])})

    for result in image_locations:
        imageResults.append({
            "type": "image",
            "lat": result["location"]["latitude"],
            "lng": result["location"]["longitude"],
             "index": "{}-{}".format(result['id'], result['catime'])})

    for result in video_locations:
        videoResults.append({
            "type": "video",
            "lat": result["location"]["latitude"],
            "lng": result["location"]["longitude"],
             "index": "{}-{}".format(result['id'], result['catime'])})

    return jsonify({              "tweetlocations": tweetResults,
                                  "imagelocations": imageResults,
                                  "videolocations": videoResults})

def get_locations_sch(username, job_ids, begin_time, end_time, config):
    """ This function retrieves the lat lngs from MongoDB.

    :param username: The user logged in for the request
    :param job_ids: The job ids to pull the locations from
    :param begin_time: The beginning of the time period to get locations from
    :param end_time: The end of the time period to get locations from
    :return: Either a JSON response or an error code
    """
    # Check that our user can query all selected jobs
    for job_id in job_ids:
        obj = job.get_job_with_user(job_id, username)
        # obj is None if we don't have permission to access the job
        if obj is None:
            return None

	catime_constraints = create_catimes(job_ids, begin_time, end_time)

    tweet_query_obj = {"$or": [{
                             "catime": {
                                 "$gte": catime["catime"]["$gte"],
                                 "$lte": catime["catime"]["$lte"]
                             },
                             "geoflag": True
                         } for catime in catime_constraints["$or"]]}

    global tweets
    search_tweets = tweets
    # If this query hits only the last couple of days, use the RAM db
    if int(time()) - begin_time < 174600:
        global ram_tweets
        search_tweets = ram_tweets

    tweet_locations = search_tweets.find(tweet_query_obj, {"location": 1, "id": 1,
                                                         "catime": 1})
    queryMaker = MongoDBQueryMaker()
    media_query_obj = queryMaker.buildQuery(job_ids, begin_time, end_time, True)
    mongoDBFacade = MongoDBFacade(config)
    image_locations = mongoDBFacade.queryImages(None, media_query_obj, {"location": 1, "id": 1,"catime": 1}, 0, 1000, begin_time)
    video_locations = mongoDBFacade.queryVideos(None, media_query_obj, {"location": 1, "id": 1,"catime": 1}, 0, 1000, begin_time)

    tweetResults = []
    imageResults = []
    videoResults = []
    for result in tweet_locations:
        tweetResults.append({
            "type": "tweet",
            "lat": result["location"]["lat"],
            "lng": result["location"]["lng"],
             "index": "{}-{}".format(result['id'], result['catime'])})

    for result in image_locations:
        imageResults.append({
            "type": "image",
            "lat": result["location"]["latitude"],
            "lng": result["location"]["longitude"],
             "index": "{}-{}".format(result['id'], result['catime'])})

    for result in video_locations:
        videoResults.append({
            "type": "video",
            "lat": result["location"]["latitude"],
            "lng": result["location"]["longitude"],
             "index": "{}-{}".format(result['id'], result['catime'])})

    return {              "tweetlocations": tweetResults,
                                  "imagelocations": imageResults,
                                  "videolocations": videoResults}



def get_users(username, job_ids, begin_time, end_time, limit):
    """ This function retrieves top users for jobs.

    :param username: The user retrieving data.
    :param job_ids: The jobs to pull users from.
    :param begin_time: The beginning of the time period.
    :param end_time: The end of the time period.
    :param limit: The number of users to retrieve.
    :return: Either an HTTP error code or the JSON response.
    """
    # Check that our user can query all selected jobs
    for job_id in job_ids:
        obj = job.get_job_with_user(job_id, username)

        # obj is None if we don't have permission to access the job
        if obj is None:
            return None
    # Create catime constraints for each job_id
    catime_constraints = create_catimes(job_ids, begin_time, end_time)
    print catime_constraints

    query_obj = {"$or": [{
                             "catime": {
                                 "$gte": catime["catime"]["$gte"],
                                 "$lte": catime["catime"]["$lte"]
                             },
                             "entities.user_mentions.screen_name": {
                                 "$exists": True
                             }
                         } for catime in catime_constraints["$or"]]}


    global tweets
    search_tweets = tweets
    # If this query hits only the last couple of days, use the RAM db
    if int(time()) - begin_time < 174600:
        global ram_tweets
        search_tweets = ram_tweets

    user_counter = collections.Counter()
    user_search = search_tweets.find(query_obj, {
        "entities.user_mentions.screen_name": 1
    })

    for search_result in user_search:
        for user in search_result['entities']['user_mentions']:
            user_counter[user['screen_name']] += 1

    return jsonify({"users": [{
                                  "user": user,
                                  "count": count,
                              } for user, count in user_counter.most_common(limit)]})



def get_users_sch(username, job_ids, begin_time, end_time, limit):
    """ This function retrieves top users for jobs.

    :param username: The user retrieving data.
    :param job_ids: The jobs to pull users from.
    :param begin_time: The beginning of the time period.
    :param end_time: The end of the time period.
    :param limit: The number of users to retrieve.
    :return: Either an HTTP error code or the JSON response.
    """
    # Check that our user can query all selected jobs
    for job_id in job_ids:
        print "job idd", job_id
        obj = job.get_job_with_user(job_id, username)
        print "objj", obj
        # obj is None if we don't have permission to access the job
        if obj is None:
            return None
    # Create catime constraints for each job_id
    catime_constraints = create_catimes(job_ids, begin_time, end_time)


    query_obj = {"$or": [{
                             "catime": {
                                 "$gte": catime["catime"]["$gte"],
                                 "$lte": catime["catime"]["$lte"]
                             },
                             "entities.user_mentions.screen_name": {
                                 "$exists": True
                             }
                         } for catime in catime_constraints["$or"]]}


    global tweets
    search_tweets = tweets
    # If this query hits only the last couple of days, use the RAM db
    if int(time()) - begin_time < 174600:
        global ram_tweets
        search_tweets = ram_tweets

    user_counter = collections.Counter()
    print "query objj", query_obj

    user_search = search_tweets.find(query_obj, {
        "entities.user_mentions.screen_name": 1
    })


    for search_result in user_search:
        for user in search_result['entities']['user_mentions']:

           user_counter[user['screen_name']] += 1

    return ({"users": [{
                                  "user": user,
                                  "count": count,
                              } for user, count in user_counter.most_common(limit)]})



def generate_word_cloud(username, job_ids, begin_time, end_time, limit=50):
    """ This is the main function to get the word cloud response from.

    :param username: The user logged in for the word cloud.
    :param job_ids: The IDs to generate the word cloud for.
    :param begin_time: The beginning of the word cloud query.
    :param end_time: The ending of the word cloud query.
    :return: The word cloud response.
    """
    # Make sure our user can access all the jobs we're creating word clouds for
    for job_id in job_ids:
        if job.get_job_with_user(job_id, username) is None:
            abort(401)

    catime_constraints = create_catimes(job_ids, begin_time, end_time)

    global tweets
    search_tweets = tweets
    # If this query hits only the last couple of days, use the RAM db
    if int(time()) - begin_time < 174600:
        global ram_tweets
        search_tweets = ram_tweets

    mongo_tweets = search_tweets.find(catime_constraints, {
        "keywords": 1
    })

    sample_rate = 1.0  # TODO: Change this to depend on mongo_tweets.count()
    keyword_map = collections.Counter()
    for tweet in mongo_tweets:
        if random.random() < sample_rate:
            for word in tweet['keywords']:
                keyword_map[word] += 1

    if keyword_map.get("http") is not None:
        keyword_map.pop("http")  # The database doesn't filter http

    word_cloud = [{"text": word, "size": count} for word, count in
                  keyword_map.most_common(limit)]

    # Scale the size to [0,1]
    max_size = 0
    for obj in word_cloud:
        if obj['size'] > max_size:
            max_size = obj['size']
    word_cloud = [{"text": obj['text'], "size": float(obj['size']) / float(max_size)}
                  for obj in word_cloud]

    return jsonify({"word_cloud": word_cloud})



def generate_word_cloud_sch(username, job_ids, begin_time, end_time, limit=50):
    """ This is the main function to get the word cloud response from.

    :param username: The user logged in for the word cloud.
    :param job_ids: The IDs to generate the word cloud for.
    :param begin_time: The beginning of the word cloud query.
    :param end_time: The ending of the word cloud query.
    :return: The word cloud response.
    """
    # Make sure our user can access all the jobs we're creating word clouds for
    for job_id in job_ids:
        if job.get_job_with_user(job_id, username) is None:
            abort(401)

    catime_constraints = create_catimes(job_ids, begin_time, end_time)

    global tweets
    search_tweets = tweets
    # If this query hits only the last couple of days, use the RAM db
    if int(time()) - begin_time < 174600:
        global ram_tweets
        search_tweets = ram_tweets

    mongo_tweets = search_tweets.find(catime_constraints, {
        "keywords": 1
    })

    sample_rate = 1.0  # TODO: Change this to depend on mongo_tweets.count()
    keyword_map = collections.Counter()
    for tweet in mongo_tweets:
        if random.random() < sample_rate:
            for word in tweet['keywords']:
                keyword_map[word] += 1

    if keyword_map.get("http") is not None:
        keyword_map.pop("http")  # The database doesn't filter http

    word_cloud = [{"text": word, "size": count} for word, count in
                  keyword_map.most_common(limit)]

    # Scale the size to [0,1]
    max_size = 0
    for obj in word_cloud:
        if obj['size'] > max_size:
            max_size = obj['size']
    word_cloud = [{"text": obj['text'], "size": float(obj['size']) / float(max_size)}
                  for obj in word_cloud]

    return {"word_cloud": word_cloud}

def generate_time_lines(categories, start_time, end_time, granularity, keywords):
    """

    :param categories: categories
    :param start_time: start time
    :param end_time: end time
    :param granularity: granularity
    :param keywords: keywords
    :return:
    """

