
'''
Created on May 9, 2014

@author: srangan8
'''
import json
from pymongo import MongoClient
from datetime import datetime
import time
from numpy import *
from bson.json_util import dumps
from APIClass import *
import math
import operator
import collections
from flask import session
import logging

class Timeline(TweetTrackerAPIClass):
    """
        Class for TimeLine
    """
    def __init__(self, config):
        """
        
        :param config: configuration
        """
        super(Timeline, self).__init__(config)


    def getTrends(self,queryargs):
        """
        
        :param queryargs: query arguments
        :return: category count
        """
        #print "HERE"
        self.databaseName=self.dist_db
        categories= queryargs.getlist('categoryID')
        start_time=queryargs['start_time']
        print start_time
        end_time= queryargs['end_time'] if 'end_time' in queryargs else int(time.time())
        print end_time
        granularity=queryargs['granularity']if 'granularity' in queryargs else 1
        keywords= queryargs.getlist('keyword') if 'keyword' in queryargs else []
        types = queryargs.getlist('types') if 'types' in queryargs else []

        #check valid input

        try:
            categories = [int(x) for x in categories]
        except:
            return (False, 'All categoryIDs, skip, and limit must be integers.')
        try:
            start_time = int(start_time) + 60*60
            end_time = int(end_time)
            if start_time < 0 or end_time < 0:
                return (False, 'start_time and end_time must be positive Unix timestamps in GMT.')
            if end_time < start_time:
                return (False, 'start_time must be before end_time.')
        except:
            return (False, 'start_time and end_time must be Unix timestamps in GMT.')
        try:
            granularity = int(granularity)
            if (granularity < 0):
                return (False, 'granularity must be a positive integer.')
        except:
            return (False, 'granularity must be an integer.')

        #round off to the nearest hour
        catsobj={}
        starttimes=(start_time-(start_time%3600))
        endtimes=(end_time+3600-(end_time%3600))
        #numbins=(endtimes-starttimes)/(3600*granularity)
        numbins = len([i for i in range(starttimes, endtimes,granularity*60*60)])
        times=(start_time-(start_time%3600))*1000


        #if the trendlines for categories is requested
        catarr=[]
        catdiff={}
        timecount={}
        countarr={}
        timearr={}


        if(keywords==[]):
            return self.queryTrendsNoKeywords(categories, start_time, end_time, granularity, types)

        #if the trendlines for keywords is requested
        else:
            timekeyarr=[]
            fieldarr=arange(starttimes,endtimes,3600*granularity)
            for times in fieldarr:
                timekeyarr.append(datetime.fromtimestamp(int(times)).strftime('%a %b %d  %H:%M:%S +0000 %Y'))
            for catnames in categories:
                    catcount={}
                    allcat=[int(catnames),333000+int(catnames),666000+int(catnames)]
                    catimearr=[]
                    keywordcounts=[]
                    for catname in allcat:
                        startcatime=long(str(catname)+str(starttimes))
                        endcatime=long(str(catname)+str(endtimes))
                        catimearr.append({"catime":{"$gte":startcatime,"$lt":endcatime}})
                    timestamparr=[]

                    for keyword in keywords:
                        keywordcount={}
                        keywordcount["times"]=timekeyarr
                        if "tweet" in types:
                            timestamplist=self.databaseName.tweets.find({"$or":catimearr,"keywords":keyword.lower()},{"timestamp":1})
                            print {"$or":catimearr,"keywords":keyword},{"timestamp":1}

                            q = {"$or":catimearr,"keywords":keyword},{"timestamp":1}
                            log = logging.getLogger()
                            log.error(session['username'] + ' '  + 'CategoryCounter:Tweets:Keyword' + ' ' + str(q))

                            for timestamp in timestamplist:
                                timestamparr.append(timestamp["timestamp"])
                            [keywordcountarr,binedge]=histogram(timestamparr,numbins,range=(starttimes*1000,endtimes*1000))
                            keywordcount["tweetTrends"]=keywordcountarr.tolist()
                            catcount[keyword]=keywordcount
                            timestamparr=[]
                        if "image" in types:
                            timestamplist=self.databaseName.images.find({"$or":catimearr,"tags":keyword.lower()},{"created_time":1}).batch_size(10000)
                            for timestamp in timestamplist:
                                timestamparr.append(timestamp["created_time"] * 1000)
                            [keywordcountarr,binedge]=histogram(timestamparr,numbins,range=(starttimes*1000,endtimes*1000))
                            keywordcount["imageTrends"]=keywordcountarr.tolist()
                            catcount[keyword]=keywordcount
                            timestamparr=[]
                        if "video" in types:
                            timestamplist=self.databaseName.videos.find({"$or":catimearr,"keywords":keyword.lower()},{"catime":1}).batch_size(10000)
                            for timestamp in timestamplist:
                                timestamparr.append((timestamp["catime"] % 10000000000) * 1000)
                            [keywordcountarr,binedge]=histogram(timestamparr,numbins,range=(starttimes*1000,endtimes*1000))
                            keywordcount["videoTrends"]=keywordcountarr.tolist()
                            catcount[keyword]=keywordcount
                            timestamparr=[]
                    catsobj[catnames]=catcount
            return (True,catsobj)

    def queryTrendsNoKeywords(self, categories, start_time, end_time, granularity, types):
        """
        
        :param categories: categories
        :param start_time: start time
        :param end_time: end time
        :param granularity: granularity
        :param types: types
        :return: category count
        """
        catsobj={}
        starttimes=(start_time-(start_time%3600)) 
        endtimes=(end_time+3600-(end_time%3600))
        numbins = len([i for i in range(starttimes, endtimes,granularity*60*60)])
        times=(start_time-(start_time%3600))*1000

        catarr=[]
        catdiff={}
        timecount={}
        countarr={}
        timearr={}

        for catnames in categories:
            allcat=[int(catnames),333000+int(catnames),666000+int(catnames)]
            catdiff[catnames]=allcat
            catarr.extend(allcat)
            timecount[catnames]=0
            countarr[catnames]=[]
            timearr[catnames]=[]
            timesprop=(start_time-(start_time%3600))
            while len(timearr[catnames])<numbins:
                timearr[catnames].append(datetime.fromtimestamp(int(timesprop)).strftime('%a %b %d  %H:%M:%S +0000 %Y'))
                timesprop+=granularity*60*60
            firstTime=True

        if "tweet" in types:
            tweets = self.queryDatabaseForTypeTrend("tweet", catarr, starttimes, endtimes, countarr, categories, times, timecount, granularity, firstTime, catdiff, numbins)
            self.clearArrays(countarr, timecount, categories)
        if "image" in types:
            images = self.queryDatabaseForTypeTrend("image", catarr, starttimes, endtimes, countarr, categories, times, timecount, granularity, firstTime, catdiff, numbins)
            self.clearArrays(countarr, timecount, categories)
        if "video" in types:
            videos = self.queryDatabaseForTypeTrend("video", catarr, starttimes, endtimes, countarr, categories, times, timecount, granularity, firstTime, catdiff, numbins)
            self.clearArrays(countarr, timecount, categories)

        for catnames in categories:
            catcount={}
            catcount["times"]=timearr[catnames]
            if "tweet" in types:
                catcount["tweetTrends"] = tweets[catnames]
            if "image" in types:
                catcount["imageTrends"] = images[catnames]
            if "video" in types:
                catcount["videoTrends"] = videos[catnames]
            catsobj[catnames]=catcount
        #print catsobj
        return  (True,catsobj)

    def queryDatabaseForTypeTrend(self, mediaType, catarr, starttimes, endtimes, countarr, categories, times, timecount, granularity, firstTime, catdiff, numbins):
        """
        
        :param mediaType: Media type
        :param catarr: category array
        :param starttimes: start times
        :param endtimes: end times
        :param countarr: count array
        :param categories: categories
        :param times: times
        :param timecount: time count
        :param granularity: granularity
        :param firstTime: first time
        :param catdiff: category difference
        :param numbins: numbers in
        :return: count array
        """
        if "tweet" == mediaType:
            print starttimes
            print endtimes
            q = {"cat":{"$in":catarr},"timestamp":{"$gte":starttimes*1000,"$lt":endtimes*1000}},{"count":1,"timestamp":1,"cat":1}
            
            log = logging.getLogger()
            log.error(session['username'] + ' ' +  'CategoryCounter:Tweets:WithoutKeyWord'  + ' '+ str(q))

            doclists=self.databaseName.categorycounter.find({"cat":{"$in":catarr},"timestamp":{"$gte":starttimes*1000,"$lt":endtimes*1000}},{"count":1,"timestamp":1,"cat":1}).sort("timestamp",1)

        elif "image" == mediaType:
            doclists=self.databaseName.imagescategorycounter.find({"cat":{"$in":catarr},"timestamp":{"$gte":starttimes*1000,"$lt":endtimes*1000}},{"count":1,"timestamp":1,"cat":1}).sort("timestamp",1)

        elif "video" == mediaType:
            doclists=self.databaseName.videoscategorycounter.find({"cat":{"$in":catarr},"timestamp":{"$gte":starttimes*1000,"$lt":endtimes*1000}},{"count":1,"timestamp":1,"cat":1}).sort("timestamp",1)
        
        timestamp_list = [i for i in range(starttimes*1000, endtimes*1000 ,granularity*60*60000)] # creating an list of timestamp for dictionary intialization
        print len(timestamp_list) == numbins 
        print len(timestamp_list)
        print numbins
        print timestamp_list
        # Dictionary for category and corresponding timestamp and count. It will have structure same as {cateogry:{timestamp:count}}
        # for all category and all timestamps
        dict_cat_timestamp_count = {} 
        
        # Intialize each cateogry's dictionary with timestamp and count with 0
        for cat in categories:
            dict_cat_timestamp_count[cat] = dict([(timestamp,0) for timestamp in timestamp_list])
        
        current_time = starttimes*1000
        # iterate thorugh doc list and add count to corresponding timestamp at corresponding category
        for docs in doclists:

            print docs
            # Advance the current_time if the data is not avaialbe for particualr time
            while current_time + granularity*60*60000 <= docs['timestamp']:
                current_time = current_time + granularity*60*60000

            # Add all the count for the timestamp within the granularity range
            if docs['timestamp'] < current_time + granularity*60*60000:
                temp = dict_cat_timestamp_count[docs['cat']]
                temp[current_time] += docs['count']
                dict_cat_timestamp_count[docs['cat']] = temp 
            
        #Sort the dictionaries by timestamp and create OrderedDict    
        for cat in categories:
            temp_dict = dict_cat_timestamp_count[cat]
            temp_dict_sorted = collections.OrderedDict(sorted(temp_dict.items()))
            dict_cat_timestamp_count[cat] = temp_dict_sorted
        
        # just extract the count and forget about timestamps! :)
        # Countarr structure will be {cat:[list of all counts for all timestamps]}
        
        for cat in categories:
            temp_dict = dict_cat_timestamp_count[cat]
            temp_list = [count for count in temp_dict.values()]
            countarr[cat] = temp_list
        
        print countarr
        return countarr.copy()

    def clearArrays(self, countarr, timecount, categories):
        """
        
        :param countarr: count array
        :param timecount: time count
        :param categories: categories
        :return: none
        """
        for cat in categories:
            countarr[cat] = []
            timecount[cat] = 0
    
    #this function is only used to get the minutely and hourly trendlines for the crawler monitoring webpage
    def getMonitoringTrendlines(self, queryargs):
        """
        
        :param queryargs: query arguments 
        :return: object with hours and minute counts
        """
        currentTime = int(round(time.time()))
        lastHour = currentTime - (currentTime % 3600)
        lastMinute = currentTime - (currentTime % 60)
        
        #db = self.decideConnection(start_time)[1] #this should always return the RAM db since we go back no further than 1 day
        db = self.ram_db
        
        #all the jobs which haven't been deleted and are currently being crawled
        crawlingJobs = []
        for job in self.dist_db.categories.find({'creator':{'$gte':0},'includeincrawl':1},{'categoryID':1}):
            crawlingJobs.append(job['categoryID'])
        
        #these arrays keep the 24 and 60 timestamps respectively. Specifically, for each timestamp in each array, we will get the count between that timestamp
        #and 60 minutes/seconds before that timestamp
        hourTimestamps = range(lastHour - 23 * 3600, lastHour, 3600)
        minuteTimestamps = range(lastMinute - 59 * 60, lastMinute, 60)
        
        hourCounts = []
        minuteCounts = []
        hourQueries = []
        minuteQueries = []
        
        start = time.time()
        
        #build the long OR queries for each time period
        for hourTimestamp in hourTimestamps:
            conditions = []
            for cat in crawlingJobs:
                first = {'catime':{'$gt':long(str(cat) + str(hourTimestamp - 3600)),'$lte':long(str(cat) + str(hourTimestamp))}}
                second = {'catime':{'$gt': long('333' + str(cat) + str(hourTimestamp - 3600)), '$lte': long('333' + str(cat) + str(hourTimestamp))}}
                third = {'catime':{'$gt': long('666' + str(cat) + str(hourTimestamp - 3600)), '$lte': long('666' + str(cat) + str(hourTimestamp))}}
                
                conditions.append(first)
                conditions.append(second)
                conditions.append(third)
            
            hourQueries.append({'$or':conditions})
        
        for minuteTimestamp in minuteTimestamps:
            conditions = []
            for cat in crawlingJobs:
                first = {'catime':{'$gt':long(str(cat) + str(minuteTimestamp - 60)),'$lte':long(str(cat) + str(minuteTimestamp))}}
                second = {'catime':{'$gt': long('333' + str(cat) + str(minuteTimestamp - 60)), '$lte': long('333' + str(cat) + str(minuteTimestamp))}}
                third = {'catime':{'$gt': long('666' + str(cat) + str(minuteTimestamp - 60)), '$lte': long('666' + str(cat) + str(minuteTimestamp))}}
                
                conditions.append(first)
                conditions.append(second)
                conditions.append(third)
            
            minuteQueries.append({'$or':conditions})
            
        #build the morris-type objects while sending the queries
		#multiply the timestamps by 1000 because morris takes ms timestamps
        
        index = 0
        for hourQuery in hourQueries:
            count = db['tweets'].count(hourQuery)
            hourCounts.append({'timestamp': hourTimestamps[index]*1000, 'count': count})
            index += 1
        
        index = 0
        for minuteQuery in minuteQueries:
            count = db['tweets'].count(minuteQuery)
            minuteCounts.append({'timestamp': minuteTimestamps[index]*1000, 'count': count})
            index += 1
        
        elapsed = time.time() - start
        print "elapsed"
        print elapsed
        
        returnObject = {'hourArray': hourCounts, 'minuteArray': minuteCounts}
        return (True, returnObject)