"""
Program to get LDA
"""
import json
import os.path
import os
import gensim
import pymongo
import codecs
import json
import time
import datetime
import string
import re
from flask import abort, jsonify, Response
from gensim import corpora, models, similarities
from pymongo import MongoClient
from stat import *
import platform

config = json.load(open("config.json", "r"))


def getlda(cats, username=None):
    """
    
    :param cats: categories
    :param username: user name
    :return: json of ldas
    """
    catsArr = []
    distArr = []
    for cat in cats:
        #linux server
        if platform.uname()[0] == 'Linux':
            filepath = '/var/local/lda/topicdist_' + str(cat) + '.json'
        else:
            filepath = os.getcwd() + '\\ldadat\\topicdist_' + str(cat) + '.json'

        # if the file exists than there is a current lda, this will usually be true if the job is being crawled
        if os.path.isfile(filepath):
            catsArr.append(cat)
            f = open(filepath, 'r')
            jsonobj = json.load(f)
            distArr.append(jsonobj)
    jsonobj = {"cats": catsArr, "dist": distArr, "updated": os.stat(filepath)[ST_MTIME]}
    return json.dumps(jsonobj)


def getrel(cat, distid, max, username=None):
    """
    run lda classifications on the category, sort into best fits, return
    :param cat: category
    :param distid: dist id
    :param max: max
    :param username: user name
    :return: tweets
    """

    client = MongoClient(config["mongo_ram_server"], config["mongo_ram_port"])
    db = client.tweettracker
    db.authenticate(config["mongo_ram_username"], config["mongo_ram_password"])

    if platform.uname()[0] == 'Linux':
        filepath = '/var/local/lda/'
    else:
        filepath = os.getcwd() + '\\ldadat\\'

    curtime = time.time()
    onehr = curtime - 3600
    count = 0
    cur = onehr
    cur = long(cur)

    catime1 = [str(cat) + str(cur), str(cat) + str(cur + 3600)]
    catime2 = ['333' + str(cat) + str(cur), '333' + str(cat) + str(cur + 3600)]
    catime3 = ['666' + str(cat) + str(cur), '666' + str(cat) + str(cur + 3600)]

    print "Fetching tweets from " + str(cur) + " to " + str(cur + 3600)
    mongodoc = db.tweets.find({'$or': [{"catime": {"$gt":long(catime1[0]), "$lt": long(catime1[1])}}, {"catime": {"$gt":long(catime2[0]), "$lt": long(catime2[1])}}, {"catime": {"$gt":long(catime3[0]), "$lt": long(catime3[1])}}]})
    L = set()

    # pattern for removing links
    pattern = re.compile('http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+')
    if mongodoc.count() == 0:
        print('No new documents within the last hour.')
    else:
        for post in mongodoc:
            L.add(pattern.sub('', post['text']))
    L = list(L)
    # load lda model and dictionary
    lda = models.LdaModel.load(filepath + 'model_' + str(cat) + '.lda')
    dictionary = corpora.Dictionary.load(filepath + 'dict_' + str(cat) + '.dict')

    jsontweets = []
    # run dist
    for item in L:
        new_vec = dictionary.doc2bow(item.lower().split())
        doclda = lda[new_vec]
        distribution = []
        id = []
        for tuple in doclda:
            if tuple[0] == int(distid[0]) :
                jsontweets.append({"text": item.encode('utf8'), "dist": tuple[1]})

    # sort tweets and limit results
    intermed = sorted(jsontweets, key=lambda a: a['dist'], reverse=True)[0:int(max[0])]

    jsonobj = {"tweets": intermed}

    return json.dumps(jsonobj)
