import time
import threading
import re
import codecs
import string
import operator
from pymongo import *
from bson.objectid import ObjectId
import pprint
import datetime
import json
import string
from counter import Counter
from itertools import chain
from gensim import corpora, models, similarities
import os, platform

def lineno():
    import inspect
    """Returns the current line number in our program."""
    return inspect.currentframe().f_back.f_lineno

class UtilityThread:
    def __init__(self):
        
        self.done = False
        self.timeoutflag = False
        self.endtime = 0

        self.thread = None


    def start(self, func, timeout = -1):
        self.done = False

        if timeout != -1:
            self.endtime = time.time() + timeout
            self.timeoutflag = True
        self.thread = threading.Thread(target=func, args=())
        self.thread.daemon = True
        self.thread.start()
        
    def stop(self):
        self.done = True

    def isDone(self):
        return self.done
				
def LocMapWorker():
    # print 'In ' + str(threading.currentThread())
    #debug = codecs.open(str(threading.currentThread().getName()) + 'log.txt', 'w', encoding="UTF-8")

    config = json.load(open("config.json", "r"))

    client = MongoClient(config["mongo_ram_server"], config["mongo_ram_port"])
    db = client.tweettracker
    db.authenticate(config["mongo_ram_username"], config["mongo_ram_password"])

    clientslow = MongoClient(config["mongo_dist_server"], config["mongo_dist_port"])
    dbslow = clientslow.tweettracker
    dbslow.authenticate(config["mongo_dist_username"], config["mongo_dist_password"])
    
    while True:
        curtime = long(time.time())
        starttime = long(curtime - 600 * 1)

        curtimeiso = datetime.datetime.fromtimestamp(time.time(), None)
        curtimeiso += datetime.timedelta(hours=6, minutes=50)
        query = {'$and': [{'inserted_at': {'$gte': curtimeiso}}, {'user.location': {'$ne': ''}}]}

        print query

        result = db.tweets.find(query, {'user.location':1, 'geoflag': 1, 'location': 1})
        numNew = result.count()
        print "Num new tweets: " + str(numNew)
        if numNew != 0:

            print "Matching locations"
            print result[0]
            # build query list
            locations = set()
            rescopy = list()
            for t in result:
                locations.add(t['user']['location'])
                rescopy.append(t)
                
            print str(len(locations)) + ' useful locations found'
            if len(locations) > 0:

                bulk1 = dbslow.tweets.initialize_unordered_bulk_op()
                bulk2 = db.tweets.initialize_unordered_bulk_op()

                locations = list(locations)	
                query = {'location': {'$in': locations}}
                locations = list()
                locindex = dict()
                res = dbslow.locations_cache.find(query)
                count = 0
                for r in res:
                    locations.append(r)
                    locindex[r['location']] = count
                    count = count + 1
                count = 0
                samplebefore = dict()
                for t in rescopy:
                    if t['user']['location'] in locindex:
                        loc = {'lat': locations[locindex[t['user']['location']]]['lat'], 'lng': locations[locindex[t['user']['location']]]['lng']}
                        bulk1.find({'_id': t['_id']}).update({"$set": {"user_loc": loc}})
                        bulk2.find({'_id': t['_id']}).update({"$set": {"user_loc": loc}})
                        count = count + 1
                if count > 0:
                    bulk1.execute()
                    bulk2.execute()
                
                print str(count) + ' tweets updated'
        # sleep for what remains of the 10 minutes before starting over and doing it again
        restfor = 600 - (time.time() - curtime)
        print 'Sleeping for ' + str(restfor) + ' seconds'
        time.sleep(restfor)
    
def LDAWorker():
    config = json.load(open("config.json", "r"))

    clientcats = MongoClient(config["mongo_dist_server"], config["mongo_dist_port"])
    client = MongoClient(config["mongo_ram_server"], config["mongo_ram_port"])
    db = client.tweettracker
    db.authenticate(config["mongo_ram_username"], config["mongo_ram_password"])
    dbreal = clientcats.tweettracker
    dbreal.authenticate(config["mongo_dist_username"], config["mongo_dist_password"])

    stoplistMaster = list()
    stopfile = codecs.open('stopwords.txt', encoding='utf-8')
    for line in stopfile:
        stoplistMaster.extend(line.rstrip('\r\n').split(','))
    stoplistMaster.append('d')
    stoplistMaster.append('rt')

    while True:
        print 'Starting to run LDA...'
        lcurtime = long(time.time())
        starttime = long(lcurtime - 3600 * 1)
        
        cats = dbreal.categories.find({'includeincrawl': 1}, {'categoryID': 1})
        for cat in cats:
            lda = None
            dictionary = corpora.Dictionary()
            corpus = None

            stoplist = list(stoplistMaster)

            if 'categoryID' in cat:
                cat = cat['categoryID']

                # print "Fetching keywords list..."
                mongodoc = dbreal.categories.find({"categoryID": cat}, {"keywords":1})
                if mongodoc.count() == 0:
                    # print('No category information found.  Exiting...')
                    sys.exit()
                if 'keywords' not in mongodoc[0]:
                    # print('No keywords found.')
                    pass
                else:
                    for keyword in mongodoc[0]['keywords']:
                        stoplist.append(keyword)
                # print "Done building stopwords..."

                curtime = time.time()
                onehr = curtime - 3600
                count = 0
                cur = onehr
                cur = long(cur)

                jsonout = '{"topics":['
                jsontopics = []
                jsontweets = []

                lda = None
                dictionary = corpora.Dictionary()
                corpus = None

                shard2 = str(333000 + int(cat))
                shard3 = str(666000 + int(cat))
                
                catime1 = [str(cat) + str(cur), str(cat) + str(cur + 3600)]
                catime2 = [shard2 + str(cur), shard2 + str(cur + 3600)]
                catime3 = [shard3 + str(cur), shard3 + str(cur + 3600)]

                # print "Fetching tweets from " + str(cur) + " to " + str(cur + 3600)
                mongodoc = db.tweets.find({'$or': [{"catime": {"$gt":long(catime1[0]), "$lt": long(catime1[1])}}, {"catime": {"$gt":long(catime2[0]), "$lt": long(catime2[1])}}, {"catime": {"$gt":long(catime3[0]), "$lt": long(catime3[1])}}]})
                L = list()
                remove_punc = dict((ord(char), None) for char in string.punctuation)
                if mongodoc.count() == 0:
                    pass
                    # print('No new documents within the last hour.  Moving on...')
                else:
                    for post in mongodoc:
                        L.append(post['text'])


                    #print "Removing stopwords"
                    stoplist = set(stoplist)
                    texts = [[word for word in document.lower().translate(remove_punc).split() if word not in stoplist and 'http' not in word]
                        for document in L]

                    #print "Removing tokens that only occur once"
                    c = Counter(chain.from_iterable(texts))
                    texts = [[word for word in x if c[word]>1] for x in texts]

                    #print "Building dictionary"
                    dictionary.add_documents(texts)

                    corpus = [dictionary.doc2bow(text) for text in texts]

                    #print "Building LDA model"
                    if len(dictionary) > 0:
                        if lda == None:
                            lda = models.LdaModel(corpus, num_topics = 10, id2word=dictionary, passes=2)
                        else:
                            lda.update(corpus)

                        topicsdist = lda.show_topics()
                        for topic in topicsdist:
                            splits = topic.split()
                            distribution = []
                            id = []
                            for split in splits:
                                if split != u'+':
                                    final = split.split('*')
                                    distribution.append(float(final[0]))
                                    id.append(final[1])
                            jsontopics.append({"topicnum": count, "dist": distribution, "id": id})
                            count = count + 1

                        jsonobj = {"topics": jsontopics}
                        preamble = ''
                        if platform.uname()[0] == 'Linux':
                            preamble = '/var/local/lda/'
                        else:
                            preamble = str(os.path.dirname(os.path.abspath(__file__))) + '/ldadat/'
                        f = open(preamble + 'topicdist_' + str(cat) + '.json', 'w')
                        json.dump(jsonobj, f)

                        lda.save(preamble + 'model_' + str(cat) + '.lda')
                        dictionary.save(preamble + 'dict_' + str(cat) + '.dict')
        restfor = 3600 - (time.time() - lcurtime)
        print 'LDA Sleeping for ' + str(restfor) + ' seconds'
        time.sleep(restfor)