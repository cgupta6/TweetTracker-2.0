import threading
from multiprocessing import Process,Lock
from time import sleep
from datetime import datetime
from random import randint

import tweet_tracker_api
import tweet_tracker_api.APIClass
import tweet_tracker_api.auth.user
import tweet_tracker_api.job_management.job
import tweet_tracker_api.job_management.api_support
import tweet_tracker_api.report_management.report
import tweet_tracker_api.report_management.api_support
from tweet_tracker_api.lda_func import *
from tweet_tracker_api.getTweets import *
from tweet_tracker_api.getYaks import *
from tweet_tracker_api.getImages import *
from tweet_tracker_api.getVideos import *
from tweet_tracker_api.Timeline import *
from tweet_tracker_api.getEntities import *
from tweet_tracker_api.utilities import *
from tweet_tracker_api.bot_prob import find_jobs_bot_prob
from tweet_tracker_api.userlimit import *
from tweet_tracker_api.APIErrors import *
import logging
import cPickle as pickle
import time
from flask.ext.compressor import Compressor
"""
Set up basic web stuff
"""
app = Flask(__name__)
app.secret_key = "\x90'\xcbb\xb8L\x16\x0f\xc8\xf0U\x82\xd2\x7f\xc3\x10\xff\x89\x8b\x93\x08<i\x90"

compressor = Compressor(app)  # add Gzip compression

config = json.load(open("config.json", "r"))
config_obj = tweet_tracker_api.APIClass.TweetTrackerAPIClass(config)
tweet_tracker_api.auth.user.setup(config_obj.dist_db.users)
tweet_tracker_api.entities.api_support.setup(
    config_obj.dist_db.tweets, config_obj.ram_db.tweets)
tweet_tracker_api.job_management.job.setup(
    config_obj.dist_db.categories, config_obj.twython)
tweet_tracker_api.search.api_support.setup(
    config_obj.dist_db.tweets, config_obj.ram_db.tweets)
tweet_tracker_api.hdx.api_support.setup(config_obj.dist_db, config_obj.ram_db)
tweet_tracker_api.report_management.report.setup(config_obj.dist_db.reports, config_obj.ram_db.reports)



"""
Set up API calls
"""
searchExport = SearchExport(config)
searchExportImages = SearchExportImages(config)
searchExportVideos = SearchExportVideos(config)
searchExportYaks = SearchExportYaks(config)
timeline = Timeline(config)
getEntities = Entities(config)


'''
Thread Logic Starts
'''


threadList = []
list1Lock = Lock()
hourInterval=config['hourInterval']
minsInterval=config['minsInterval']
startInterval=config['startInterval']

def CreateReportThread(reportDetails):
    global threadList
    print reportDetails
    newThread = None
    intervalSeconds=hourInterval*3600+(randint(-minsInterval, minsInterval)*60)
    print intervalSeconds

    ############## Report Logic
    sleepTime=randint(0,30)
    print 'Sleep Time',sleepTime
    sleep(sleepTime)
    ##############
    newThread = Process(target=CreateReportThread,args=(reportDetails,))
    threading.Timer(intervalSeconds,runProc,(newThread,)).start()
    try:
        list1Lock.acquire()
        threadList.append([newThread, datetime.now()])
    finally:
        list1Lock.release()
    newThread.start()

def ThreadCleaner():
    global threadList
    print 'Cleaner Start'
    print threadList
    newThreadList = []
    for obj in threadList:
        print obj
        threadObj = obj[0]
        timeObj = obj[1]
        if threadObj.is_alive():
            if ((datetime.now() - timeObj).total_seconds()) / 3600 >= 2:
                print 'Killing',threadObj
                threadObj.terminate()
            else:
                newThreadList.append(obj)
    try:
        list1Lock.acquire()
        threadList = newThreadList
    finally:
        list1Lock.release()
    threading.Timer(7200, runProc, (Process(target=ThreadCleaner),)).start()
    print 'Cleaner End'

def runProc(proc):
    proc.run()

# Cleaner Every 2 hours
def main():
    global threadList
    #pull all reports and start
    for i in range(0,30):
        intervalSeconds = (randint(0, startInterval) * 60)
        newThread=Process(target=CreateReportThread,args=(i,))
        threading.Timer(intervalSeconds,runProc,(newThread,)).start()
        try:
            list1Lock.acquire()
            threadList.append([newThread, datetime.now()])
        finally:
            list1Lock.release()
    threading.Timer(7200,runProc,(Process(target=ThreadCleaner),)).start()

if __name__ == "__main__":
    main()
