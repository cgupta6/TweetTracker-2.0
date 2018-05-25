__author__ = 'Abhay Joshi'

import flask
import json
import collections
from flask import abort, jsonify
import random
from time import time
from tweet_tracker_api.job_management import job
from tweet_tracker_api.MongoDBFacade import MongoDBFacade
from tweet_tracker_api.MongoDBQueryMaker import MongoDBQueryMaker
from tweet_tracker_api.LoggingMongo import LoggingMongo
from collections import defaultdict
from collections import OrderedDict
from itertools import islice
import datetime

tweets = None
ram_tweets = None
loggingMongo = LoggingMongo()

new_data = defaultdict(dict)
url_data = defaultdict(dict)
url_data1 = defaultdict(dict)
tempForLinks = defaultdict(list)
tempForCount = defaultdict(int)
tempForRetweetCount = defaultdict(int)
tempForTweets = defaultdict(list)
tempForHashtags = defaultdict(dict)
tempForUsers = defaultdict(dict)
tempForTime = defaultdict(dict)

def setup(collection, ram_collection):
  
    global tweets
    global ram_tweets
    tweets = collection
    ram_tweets = ram_collection

def content(doc, new_url):
    if (len(doc['content']) == 0):
        url_data[new_url]['content'] = {}
        return 1
            
    for j in doc['content'].keys():
        if j.find('@') != -1 or j.find('#') != -1:
            continue

        if j in tempForHashtags[new_url].keys():
            tempForHashtags[new_url][j] += doc['content'][j]
        else:
            tempForHashtags[new_url][j] = doc['content'][j]
    
    url_data[new_url]['content'] = tempForHashtags[new_url]
    return 1

def userIds(doc, new_url):
    for j in doc['user_ids'].keys():
        if j in tempForUsers[new_url].keys():
            tempForUsers[new_url][j] += doc['user_ids'][j]
        else:
            tempForUsers[new_url][j] = doc['user_ids'][j]
                
    url_data1[new_url]['user_ids'] = tempForUsers[new_url]
    return 1

def tweetIds(doc, new_url):
    for j in doc['tweet_ids']:
        if j in tempForTweets[new_url]:
            pass
        else:
            tempForTweets[new_url].append(j)
        
    url_data1[new_url]['tweet_ids'] = tempForTweets[new_url]
    return 1

def finalCount(doc, new_url):
    tempForCount[new_url] += doc['final_count']
    url_data[new_url]['final_count'] = tempForCount[new_url]
    return 1

def statsOperation(data):
    for doc in data:
        new_url = doc['url']
        finalCount(doc, new_url)
        tweetIds(doc, new_url)
        userIds(doc, new_url)
        content(doc, new_url)
    return 1

def getDatewiseData(fromDate,toDate):
    i = fromDate
    toDate =  toDate + 86399
    while i < toDate:
        start_catime = i
        end_catime = start_catime + 86400
        res = tweets.find({'catime': {'$gte': start_catime ,'$lt': end_catime}});
        statsOperation(res)
        i = i + 86400

    new_dict = OrderedDict(sorted(url_data.iteritems(),key=lambda x:x[1]['final_count'], reverse=True))
    finaldict = defaultdict(dict)
    cn = 0
    nData = defaultdict(dict)
    for key in new_dict.keys():
        cn += 1
        nData[key]['final_count'] = new_dict[key]['final_count']
        nData[key]['content'] = new_dict[key]['content']
        nData[key]['user_ids'] = url_data1[key]['user_ids']
        nData[key]['tweet_ids'] = url_data1[key]['tweet_ids']
        if cn>=200:
            break

    new_final = OrderedDict(sorted(nData.iteritems(),key=lambda x:x[1]['final_count'], reverse=True))

    r = flask.Response(
        json.dumps(new_final, ensure_ascii=False),
        mimetype="application/json"
    )
    return r
