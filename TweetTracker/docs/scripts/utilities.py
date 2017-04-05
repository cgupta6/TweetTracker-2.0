import time
from os import listdir
from os.path import isfile, join
import os
import ujson as json
from pymongo import *
from APIClass import *
from pprint import pprint
import logging
from flask import session 

import matplotlib
matplotlib.use('agg')

c = MongoClient('localhost:27017')
db = c['ttsideprojects']
#db.authenticate('twtuser','!!!asudmml%%%')

def checkCrawl(anId):
    """
    
    :param anId: ID
    :return: extracted crawl result
    """
    print 'in check crawl!'
    query = {'primary_id':long(anId)}

    log = logging.getLogger('ttlogger')
    log.error(session['username'] + ' ' + 'ConversationTracker:' + str(anId) + ' ' + str(query))
    
    print db.conversationIDs.find(query).count()
    if db.conversationIDs.find(query).count() == 0:
        crawl_tweet(anId)
    return extract_flare(anId)

'''
def load_tweets(filename):
    results = {'tweets': []}
    for item in open(filename, 'r'):
        item = json.loads(item)
        aResult = {'id': str(item['id']), 'text': item['text']}
        results['tweets'].append(aResult)
    return json.dumps(results)
'''

def extract_flare(anId):
    """
    
    :param anId: Id
    :return: extracted flare
    """
    print 'flare extract' + str(anId)
    def extractChildren(node):
        childList = []
        if node in nodeDict:
            for item in nodeDict[node]:
                childList.append(extractChildren(item))
            # print {'name': node, 'children': childList}
            obj = {'name': tweets[node]['user']['screen_name'], 'children': childList, 'text': tweets[node]['text'], 'id': str(tweets[node]['id'])}
            if 'retweet_count' in tweets[node]:
                obj['size'] = tweets[node]['retweet_count']
            return obj
        else:
            obj = {'name': tweets[node]['user']['screen_name'],'text':tweets[node]['text'],'id': str(tweets[node]['id'])}
            if 'retweet_count' in tweets[node]:
                obj['size'] = tweets[node]['retweet_count']
            return  obj
    
    #fin = open(anId + '.json', 'r')
    query = {'primary_id':long(anId)}
    temp_ids = []
    for doc in db.conversationIDs.find(query):
        temp_ids = doc['ids']

    returnedTweetFromDB = []
    for temp_id in temp_ids:
        inner_query = {'id':long(temp_id)}
        returnedTweetFromDB.extend(list(db.conversations.find(inner_query)))


    nodeDict = dict()
    head = None

    count = 0
    tweets = dict()
    for tweet in returnedTweetFromDB:
        count += 1
        #print tweet
        #tweet = json.loads(tweet)
        tweets[tweet['id']] = tweet
        if 'in_reply_to_status_id' in tweet:
            try:
                nodeDict[tweet['in_reply_to_status_id']].append(tweet['id'])
            except:
                nodeDict[tweet['in_reply_to_status_id']] = [tweet['id']]
        else:
            head = tweet['id']

    flareList = extractChildren(head) 
    pprint(flareList)  
    # json.dump(flareList, open('static/flare.json','w'))
    return json.dumps(flareList)
    
def crawl_tweet(anId):
    """
    
    :param anId: Id
    :return: none
    """
    import twitter
    import ujson as json
    import re
    import string
    import operator
    import codecs
    import time
    import sys
    import os
    import calendar
    from os import listdir
    from os.path import isfile, join
    from pprint import pprint
    import uuid

    uuid_str = str(uuid.uuid4())

    streams = []
    with open('tweet_tracker_api/keys_justins.tsv', 'r') as fKeysIn:
        for line in fKeysIn:
            line = line.rstrip().split('\t')
            streams.append(twitter.Api(consumer_key = line[0], consumer_secret = line[1], access_token_key = line[2], access_token_secret = line[3]))

    timers = dict()
    for i in range(0,len(streams)):
        timers[i] = [0, 0]
        

    maxBack = long(time.time()) - 597600

    counts = [0,0,0]

    searchTweet = None
    doneWithUser = False
    while not doneWithUser:
        rateLimited = False
        result = -1
        deleted = False
        # look for a stream that is not limited
        # for i in range(0:len(streams)):
        while result == -1:
            for i in range(0,len(streams)):
                if timers[i][1] == 180 and timers[i][0] + 900 < time.time():
                    timers[i][0] = 0
                    timers[i][1] = 0
                if timers[i][0] == 0:
                    result = i
                    break
                elif timers[i][1] < 180: 
                    result = i
                    break
            if result == -1: # case when all streams are rate limited
                time.sleep(1)
                
        # check if profile exists and write if so
        # update timers so that we know our 15 minute window has begun
        # if the window has already begun update the request number
        if timers[result][0] == 0:
            timers[result][0] = time.time()
            timers[result][1] = 1
        elif timers[result][1] < 180:
            timers[result][1] += 1
        try:
            print 'Attempting ' + str(anId) + ' with account ' + str(result)
            tweet = streams[result].GetStatus(id=anId)
        except twitter.TwitterError as e:
            print e
            try:
                if e[0][0]['code'] == 88:
                    # this is kind of silly but it works
                    # if account gets rate limited make sure its not pulled again
                    # and adjust the time window so it will recheck in half the rate limit window
                    timers[result][1] = 180
                    timers[result][0] = time.time() - 450 
                    rateLimited = True
                if e[0][0]['code'] == 144: # doesnt exist
                    deleted = True
                if e[0][0]['code'] == 179: # access denied
                    deleted = True
                if e[0][0]['code'] == 34: # page does not exist (wut)
                    deleted = True
                if e[0][0]['code'] == 63: # user suspended
                    deleted = True   
            except:
                pass
        # This makes sure the user isn't skipped simply because a crawler
        # got rate limited.  
        if rateLimited == False:
            # print tweet
            if deleted != True:
                try:
                    searchTweet = json.loads(str(tweet))
                    doneWithUser = True
                except:
                    pass
            else:           
                doneWithUser = True
    
    searchList = list()
    tweet = searchTweet
    searchList.append((tweet['id'], tweet['user']['screen_name'], tweet))
    # break
    print counts
    # print searchList

    auditOut = open('tweet_tracker_api/audit.txt', 'w')
    auditOut.write(str([(x[0], x[1]) for x in searchList]))
    auditOut.write('\n')
    searchTrees = list()
    # search and replace all messages that are not roots
    for idx, val in enumerate(searchList):
        doneWithUser = False
        lastID = 0
        totCount = 0
        searchTree = list()
        searchTree.append(val)
        auditOut.write(str(val[0]) + '(' + str(val[1]) + ')')
        if 'in_reply_to_status_id' in val[2]:
            while not doneWithUser:
                rateLimited = False
                result = -1
                deleted = False
                # look for a stream that is not limited
                # for i in range(0:len(streams)):
                while result == -1:
                    for i in range(0,len(streams)):
                        if timers[i][1] == 180 and timers[i][0] + 900 < time.time():
                            timers[i][0] = 0
                            timers[i][1] = 0
                        if timers[i][0] == 0:
                            result = i
                            break
                        elif timers[i][1] < 180: 
                            result = i
                            break
                    if result == -1: # case when all streams are rate limited
                        time.sleep(1)
                        
                # check if profile exists and write if so
                # update timers so that we know our 15 minute window has begun
                # if the window has already begun update the request number
                if timers[result][0] == 0:
                    timers[result][0] = time.time()
                    timers[result][1] = 1
                elif timers[result][1] < 180:
                    timers[result][1] += 1
                try:
                    print 'Attempting ' + str(val[2]['in_reply_to_status_id']) + ' with account ' + str(result)
                    tweet = streams[result].GetStatus(id=val[2]['in_reply_to_status_id'])
                except twitter.TwitterError as e:
                    print e
                    try:
                        if e[0][0]['code'] == 88:
                            # this is kind of silly but it works
                            # if account gets rate limited make sure its not pulled again
                            # and adjust the time window so it will recheck in half the rate limit window
                            timers[result][1] = 180
                            timers[result][0] = time.time() - 450 
                            rateLimited = True
                        if e[0][0]['code'] == 144: # doesnt exist
                            deleted = True
                        if e[0][0]['code'] == 179: # access denied
                            deleted = True
                        if e[0][0]['code'] == 34: # page does not exist (wut)
                            deleted = True
                        if e[0][0]['code'] == 63: # user suspended
                            deleted = True   
                    except:
                        pass
                # This makes sure the user isn't skipped simply because a crawler
                # got rate limited.  
                if rateLimited == False:
                    # print tweet
                    if deleted != True:
                        try:
                            tweet = json.loads(str(tweet))
                            val = (tweet['id'], tweet['user']['screen_name'], tweet)
                            auditOut.write('->' + str(val[0]) + '(' + str(val[1]) + ')')
                            searchTree.append((val[0], val[1], tweet))
                            searchList[idx] = (tweet['id'], tweet['user']['screen_name'], tweet)
                            # else:
                                # doneWithUser = True
                            if 'in_reply_to_status_id' not in tweet:
                                doneWithUser = True
                        except:
                            pass
                    else:           
                        doneWithUser = True
        auditOut.write('\n')
        searchTrees.append(searchTree)
    # print searchList

    auditOut.write(str([(x[0], x[1]) for x in searchList]))
        
    timers = dict()
    for i in range(0,len(streams)):
        timers[i] = [0, 0]

    # search down and save all conversations
    users = set()
    toStoreInDB = list()
    for tree in searchTrees:
        fname = str(tree[0][0]) + '.json'
        print fname
        id_to_store = tree[0][0]
        #fout = open(fname, 'w')
        # write origin tweet to line 1
        
        searchlist = list()
        for item in tree:
            searchlist.append(item)
        alreadySearched = set()
        alreadySaved = set()
        # build user set so we dont crawl the same user multiple times
        
                
        while len(searchlist) > 0:
            curNode = searchlist.pop()
            # print item
            
            if curNode[0] in alreadySaved:
                pass
            else:
                #json.dump(curNode[2], fout)
                #fout.write('\n')
                toStoreInDB.append(curNode[2])
                alreadySaved.add(curNode[0])
                tweets = None
                # item = f.readline()
                
                
                
            doneWithUser = False
            lastID = 0
            totCount = 0
            if curNode[1] not in users:
                users.add(curNode[1])
                userOut = open('tweet_tracker_api//tweet_cache//' + curNode[1] + '_'+ uuid_str +'.json', 'w')
                while not doneWithUser:
                    rateLimited = False
                    result = -1
                    # look for a stream that is not limited
                    # for i in range(0:len(streams)):
                    while result == -1:
                        for i in range(0,len(streams)):
                            if timers[i][1] == 180 and timers[i][0] + 900 < time.time():
                                timers[i][0] = 0
                                timers[i][1] = 0
                            if timers[i][0] == 0:
                                result = i
                                break
                            elif timers[i][1] < 180: 
                                result = i
                                break
                        if result == -1: # case when all streams are rate limited
                            time.sleep(1)
                            
                    # check if profile exists and write if so
                    # update timers so that we know our 15 minute window has begun
                    # if the window has already begun update the request number
                    if timers[result][0] == 0:
                        timers[result][0] = time.time()
                        timers[result][1] = 1
                    elif timers[result][1] < 180:
                        timers[result][1] += 1
                    try:
                        if (lastID == 0):
                            print 'Attempting ' + str(curNode[0]) + ' with account ' + str(result)
                            tweets = streams[result].GetSearch(term='@' + curNode[1], since_id=curNode[0], count = 100)
                        else:
                            print 'Attempting ' + str(curNode[0]) + ' with account ' + str(result) + ' next 100'
                            tweets = streams[result].GetSearch(term='@' + curNode[1], since_id=curNode[0], max_id = lastID, count = 100)
                    except twitter.TwitterError as e:
                        print e
                        try:
                            if e[0][0]['code'] == 88:
                                # this is kind of silly but it works
                                # if account gets rate limited make sure its not pulled again
                                # and adjust the time window so it will recheck in half the rate limit window
                                timers[result][1] = 180
                                timers[result][0] = time.time() - 450 
                                rateLimited = True
                        except:
                            pass
                    # This makes sure the user isn't skipped simply because a crawler
                    # got rate limited.  
                    if rateLimited == False:
                        if tweets != None:
                            for tweet in tweets:
                                # print tweet
                                tweet = json.loads(str(tweet))
                                json.dump(tweet, userOut)
                                userOut.write('\n')
                                if 'in_reply_to_status_id' in tweet and tweet['in_reply_to_status_id'] == curNode[0]:
                                    if tweet['id'] not in alreadySaved:
                                        #json.dump(tweet, fout)
                                        #fout.write('\n')
                                        toStoreInDB.append(tweet)
                                        alreadySaved.add(tweet['id'])
                                        if tweet['id'] not in alreadySearched:
                                            searchlist.append((tweet['id'], tweet['user']['screen_name'], tweet))
                                            alreadySearched.add(tweet['id'])
                                lastID = tweet['id']
                            totCount += len(tweets)
                            # Stopping criteria - zip the file and add it to archive
                            if totCount >= 100000 or len(tweets) < 100:
                                doneWithUser = True                       
                        else:
                            doneWithUser = True
                userOut.close()
            else:
                # user has already been searched, search file
                userIn = open('tweet_tracker_api/tweet_cache/' + curNode[1] + '_'+ uuid_str + '.json', 'r')
                for tweet in userIn:
                    tweet = json.loads(tweet)
                    if 'in_reply_to_status_id' in tweet and tweet['in_reply_to_status_id'] == curNode[0]:
                        if tweet['id'] not in alreadySaved:
                            #json.dump(tweet, fout)
                            #fout.write('\n')
                            toStoreInDB.append(tweet)
                            alreadySaved.add(tweet['id'])
                            if tweet['id'] not in alreadySearched:
                                searchlist.append((tweet['id'], tweet['user']['screen_name'], tweet))
                                alreadySearched.add(tweet['id'])  
                userIn.close()
        
        for entry in toStoreInDB:
            if 'retweeted_status' in entry:
                if 'urls' in entry['retweeted_status']:
                    del entry['retweeted_status']['urls']

            if 'urls' in entry:
                del entry['urls']        

        idToStore = []
        for entry in toStoreInDB:
            idToStore.append(entry['id'])

        print idToStore
        for entry in toStoreInDB:
            print entry['id']

        try:    
            db.conversations.insert_many(toStoreInDB)
            db.conversationIDs.insert({'primary_id':long(anId),'ids':idToStore})
        except:
            print "can't enter into database!"

        # To clean up tweet_cache file
        for user in users:
            try:
                os.remove('tweet_tracker_api/tweet_cache/' + user + '_'+ uuid_str + '.json')
            except:
                continue
    #fout.close()