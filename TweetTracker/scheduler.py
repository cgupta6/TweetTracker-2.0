import threading
from multiprocessing import Process,Lock
from time import sleep
from datetime import datetime
from random import randint
import requests
import tweet_tracker_api.APIClass
import tweet_tracker_api.report_management
from tweet_tracker_api.report_management import api_support,report
from tweet_tracker_api.auth import *
from server import *
"""
Set up basic web stuff
"""

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
jobs=[]
list1Lock = Lock()
hourInterval=config['hourInterval']
minsInterval=config['minsInterval']
startInterval=config['startInterval']

def CreateReportThread(reportDetails):
    global threadList
    global jobs
    newThread = None
    intervalSeconds=hourInterval*60+(randint(-minsInterval, minsInterval)*60)
    ############## Report Logic
    username = user.id_to_username(reportDetails['creator'])
    data = {}
    if username is None:
        data = tweet_tracker_api.job_management.job.get_public()
    else:
        data= tweet_tracker_api.job_management.job.get_all_by_user(username)

    jobs = map(cleanJob,data['jobs']);
    job_ids = map(checkJob, reportDetails['selectedJobs'])
    print "job ids:", job_ids
    begin_time = long(reportDetails['start_datetime'])
    end_time = long(reportDetails['end_datetime'])
    limit = 30
    # getUsers()

    print "==============================="
    print "seconds", intervalSeconds

    print "reportid",reportDetails["reportID"]

    topUsers = tweet_tracker_api.entities.api_support.get_users_sch(username, job_ids, begin_time, end_time, limit)

    #getHashtags()
    Types = ["TopHashtags"]

    print type(job_ids[0])
    queryObject = {
        'categoryID': job_ids,
        'start_time': begin_time,
        'end_time': end_time
    }
    queryObject['Types'] = ["TopHashtags"];
    queryObject['limit'] = 30;
    data=''
    (success, result) = getEntities.getEntities_sch(queryObject)
    data = result
    print 'data:',data
    topHashtags = data['TopHashtags']
    topLinks = data['TopUrls']
    topMentions = data['TopMentions']

    #getTopics1();
    topTopics =  tweet_tracker_api.entities.api_support.generate_word_cloud_sch(username, job_ids, begin_time, end_time, limit)
    (success, result) = searchExport.getTweets_sch(queryObject)
    tweets = result
    locations = tweet_tracker_api.entities.api_support.get_locations_sch(username, job_ids, begin_time, end_time, config)
    print "==============================="
    data = {"TopUsers" : topUsers, "TopHashtags" : topHashtags, "TopLinks": topLinks, "TopMentions": topMentions, "word_cloud": topTopics,\
            "Tweets": tweets, "locations": locations}

    name = reportDetails['reportname']
    start_datetime = begin_time
    end_datetime = end_time
    selectedJobs = reportDetails['selectedJobs']
    filter_by = reportDetails['filter_by']
    allWords = reportDetails['allWords']
    anyWords = reportDetails['anyWords']
    noneWords = reportDetails['noneWords']
    report_id = reportDetails['reportID']
    creator = reportDetails['creator']
    mongo_response = report.update(report_id, name, start_datetime, end_datetime, selectedJobs, filter_by, allWords, anyWords, noneWords, creator, data)


    #sleepTime=randint(0,30)
    #print 'Sleep Time',sleepTime
    #sleep(sleepTime)
    ##############
    newThread = Process(target=CreateReportThread,args=(reportDetails,))
    threading.Timer(intervalSeconds,runProc,(newThread,)).start()
    try:
        list1Lock.acquire()
        threadList.append([newThread, datetime.now()])
    finally:
        list1Lock.release()

def cleanJob(job):
    return {
            'id': job['categoryID'],
            'name': job['catname'],
            'selected': False,
            'crawling': (job['includeincrawl'] == 1)
        }

def checkJob(job):
    global jobs
    for item in jobs:
        if item['name'] == job:
            return item['id']


def ThreadCleaner():
    global threadList
    print 'Cleaner Start'
    print threadList
    newThreadList = []
    for obj in threadList:
        #print obj
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
    #pull all reports and start
    global threadList
    reports = tweet_tracker_api.report_management.report.get_reports_all()['reports']
    for rep in reports:
        intervalSeconds = (randint(0, startInterval))
        newThread = Process(target=CreateReportThread, args=(rep,))
        threading.Timer(intervalSeconds, runProc, (newThread,)).start()
        try:
            list1Lock.acquire()
            threadList.append([newThread, datetime.now()])
        finally:
            list1Lock.release()
    threading.Timer(7200, runProc, (Process(target=ThreadCleaner),)).start()
    #app.run(host='0.0.0.0', threaded=True, port=5000, debug=True)
    #print 'SHOBHIT'

if __name__ == "__main__":
    main()
