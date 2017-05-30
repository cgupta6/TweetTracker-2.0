from mercurial.dispatch import request

from flask import *
from flask.ext.compressor import Compressor

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


jobs=[]
"""
Holding the bot detection classifiers in memory
"""

# t0 = time.time()
# clf_rf = pickle.load(
#     open('tweet_tracker_api//bot_detection_files//randomforest200_new.pkl', 'rb'))
# print 'time elapsed in unpickling Random Forest model is: ' + str(time.time() - t0)

# t0 = time.time()
# clf_lda = pickle.load(
#     open('tweet_tracker_api//bot_detection_files//lda200_new.pkl', 'rb'))
# print 'time elapsed in unpickling lda model is: ' + str(time.time() - t0)

#conversationTracker = ConversationTracker(config)
# Main Application-Backing Routes

"""
@app.route("/")
def index():
    return render_template("overview.html", ngApp="overview")
"""

@app.route("/")
def index():

    if 'authenticated' in session:
        check='yes'
    else:
        check='no'
    return render_template("index.html",auth=check)

@app.route("/app")
@app.route("/app/overview")
def overview():
    return render_template("overview.html", ngApp="overview")


@app.route("/app/jobmanager")
def job_manager():
    return render_template("job_manager.html", ngApp="jobManager")


@app.route("/app/tweetalyzer")
def tweetalyzer():
    return render_template("tweetalyzer.html", ngApp="tweetalyzer")


@app.route("/app/search")
def search():
    return render_template("search.html", ngApp="search")


@app.route("/app/trends")
def trends():
    return render_template("trends.html", ngApp="trends")


# Authentication routes start here
@app.route("/login", methods=['GET'])
def login_page():
    return render_template("login.html", registration_enabled=config_obj.enable_registration)


@app.route("/login", methods=['POST'])
def login():
    if request.json is None:
        abort(400)
    username = request.json.get('username')
    password = request.json.get('password')
    web = request.json.get('web')
    if username is None or password is None:
        abort(400)
    return tweet_tracker_api.auth.api_support.login_classic(username, password, web)


@app.route("/logout", methods=['POST', 'GET'])
def logout():
    """ This function "logs out" for the user by clearing the session.

    Every function that requires a login does so by checking for the username
    key in the session dict. After running this, such a key will cease to
    exist, effectively logging out the user.

    Since this should only really be used in a webapp context, it will always
    return a redirect (which is usually only returned in a webapp context).

    :return: A redirect to the homepage.
    """
    session.clear()
    return redirect(url_for('index'))


@app.route("/api/register", methods=['POST'])
def register():
    if config_obj.enable_registration:
        email = request.json.get('email')
        password = request.json.get('password')
        firstname = request.json.get('firstname')
        lastname = request.json.get('lastname')
        phone = request.json.get('phone')
        account = request.json.get('account')
        timezone = request.json.get('timezone')

        if email is None or password is None:
            abort(401)
        return tweet_tracker_api.auth.api_support.register(email, password, firstname, lastname, phone, account, timezone)
    else:
        abort(404)

@app.route("/api/profile", methods=['GET'])
def get_profile():
    username = session.get('username')
    if username is None:
        abort(401)
    return tweet_tracker_api.auth.api_support.get_profile(username)


@app.route("/api/updateUser", methods=['PUT'])
def put_user():
    """ Replaces the job with the specified ID with a new job.

    :param job_id: The ID of the job to replace
    :return: An HTTP response representing the success/failure of the request
    """
    username = session.get('username')
    firstname = request.json.get('firstname')
    lastname = request.json.get('lastname')
    email = request.json.get('email')
    phone = request.json.get('phone')
    account = request.json.get('account')
    password = request.json.get('password')
    timezone = request.json.get('timezone')

    if username is None:
        abort(401)


    return tweet_tracker_api.auth.api_support.update_user(username, email, password, firstname, lastname, phone, account,timezone)

@app.route("/api/deleteUser", methods=['PUT'])
def delete_user():
    """ Replaces the job with the specified ID with a new job.

    :param job_id: The ID of the job to replace
    :return: An HTTP response representing the success/failure of the request
    """
    username = session.get('username')
    email = request.json.get('email')

    if username is None:
        abort(401)


    return tweet_tracker_api.auth.api_support.delete_user(username, email)


# Report management routes start here
@app.route("/api/report", methods=['GET'])
def all_reports():
    """ Request gets all reports for the user.

    This request should return a JSON object containing all reports that the user
    can read from.
    """
    # TODO: Change when authorization module is in place
    username = session.get('username')
    #import pdb
    #pdb.set_trace()
    reportId = request.args.get('report_id')
    if reportId is None:
        return tweet_tracker_api.report_management.api_support.get_all_reports_by_user(username)
    else:
        response = tweet_tracker_api.report_management.api_support.get_report(reportId,username)
        reportInfo = json.loads(response.get_data())
        tweetInfo =  json.loads(getUserLimit(username))
        reportInfo["report"]["limit"]=tweetInfo["limit"]
        reportInfo["report"]["current"]=tweetInfo["current"]
        response.set_data(json.dumps(reportInfo))
        print response
        return response




@app.route("/api/savereport", methods=['GET'])
def saveReport():

    global jobs
    username = session.get('username')
    report_id = request.args.get('report_id')
    response = tweet_tracker_api.report_management.api_support.get_report(report_id,username)
    reportDetails = json.loads(response.get_data())
    reportDetails = reportDetails['report']

    username = tweet_tracker_api.auth.user.id_to_username(reportDetails['creator'])
    data = {}
    data= tweet_tracker_api.job_management.job.get_all_by_user(username)
    print "data:", data
    jobs = map(cleanJob,data['jobs'])
    job_ids = map(checkJob, reportDetails['selectedJobs'])
    begin_time = long(reportDetails['start_datetime'])
    end_time = long(reportDetails['end_datetime'])
    if end_time == -1:
        end_time = int(round(time.time()))
    print "end time:", end_time
    limit = 30
    # getUsers()
    print "reportid",reportDetails["reportID"]
    print "job ids", job_ids
    topUsers = tweet_tracker_api.entities.api_support.get_users_sch(username, job_ids, begin_time, end_time, limit)

    #getHashtags()
    Types = ["TopHashtags"]

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
    topHashtags = data['TopHashtags']
    topLinks = data['TopUrls']
    topMentions = data['TopMentions']

    #getTopics();
    topTopics =  tweet_tracker_api.entities.api_support.generate_word_cloud_sch(username, job_ids, begin_time, end_time, limit)
    (success, result) = searchExport.getTweets_sch(queryObject)
    tweets = result
    locations = tweet_tracker_api.entities.api_support.get_locations_sch(username, job_ids, begin_time, end_time, config)
    print "==============================="
    data = {"TopUsers" : topUsers, "TopHashtags" : topHashtags, "TopLinks": topLinks, "TopMentions": topMentions, "word_cloud": topTopics,\
            "Tweets": tweets, "locations": locations}

    print data
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
    mongo_response = tweet_tracker_api.report_management.report.update(report_id, name, start_datetime, end_datetime, selectedJobs, filter_by, allWords, anyWords, noneWords, creator, data)
    return jsonify({"result":"success"})

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





@app.route("/api/deleteReport/<report_id>", methods=['POST'])
def delete_report(report_id):
    """ This request "deletes" the report with the specified id.

    :param report_id: The ID of the report to delete.
    :return: The HTTP status code corresponding to what action was taken.
    """
    username = session.get('username')
    if username is None:
        abort(401)
    return tweet_tracker_api.report_management.api_support.delete_report(username, int(report_id))


@app.route('/api/updateReport', methods=['POST'])
def update_report_request():
    #import pdb
    #pdb.set_trace()
    """ Request creates a new report.

    :return: HTTP response as appropriate
    """
    #TODO: Change when authorization module is in place
    username = session.get('username')
    name = request.json.get('name')
    start_datetime = request.json.get('start_datetime')
    end_datetime = request.json.get('end_datetime')
    selectedJobs = request.json.get('selectedJobs')
    filter_by = request.json.get('filter_by')
    allWords = request.json.get('allWords')
    anyWords = request.json.get('anyWords')
    noneWords = request.json.get('noneWords')
    report_id = int(request.json.get('report_id'))

    print report_id
    print name
    if username is None:
        abort(401)
    if name is None:
        abort(400)
    if selectedJobs is None:
        keywords = []
    if allWords is None:
        allWords = []
    if anyWords is None:
        anyWords = ""
    if noneWords is None:
        noneWords = []
    if filter_by is None:
        filter_by = []


    #return tweet_tracker_api.job_management.api_support.get_all_classic(username)
    return tweet_tracker_api.report_management.api_support.update_report(report_id,name, start_datetime, end_datetime, selectedJobs,
                                                                         filter_by, allWords, anyWords, noneWords, username)

@app.route('/api/report', methods=['POST'])
def create_report_request():
    #import pdb
    #pdb.set_trace()
    """ Request creates a new report.

    :return: HTTP response as appropriate
    """
    #TODO: Change when authorization module is in place
    username = session.get('username')
    name = request.json.get('name')
    start_datetime = request.json.get('start_datetime')
    end_datetime = request.json.get('end_datetime')
    selectedJobs = request.json.get('selectedJobs')
    filter_by = request.json.get('filter_by')
    allWords = request.json.get('allWords')
    anyWords = request.json.get('anyWords')
    noneWords = request.json.get('noneWords')

    if username is None:
        abort(401)
    if name is None:
        abort(400)
    if selectedJobs is None:
        keywords = []
    if allWords is None:
        allWords = []
    if anyWords is None:
        anyWords = ""
    if noneWords is None:
        noneWords = []
    if filter_by is None:
        filter_by = []


    #return tweet_tracker_api.job_management.api_support.get_all_classic(username)
    return tweet_tracker_api.report_management.api_support.create_report(name, start_datetime, end_datetime, selectedJobs,
                                                                         filter_by, allWords, anyWords, noneWords, username)




# Job Management routes start here
@app.route("/api/job", methods=['GET'])
def all_jobs():
    """ Request gets all jobs for the user.

    This request should return a JSON object containing all jobs that the user
    can read from.
    """
    username = session.get('username')
    return tweet_tracker_api.job_management.api_support.get_all_classic(username)


@app.route('/api/job', methods=['POST'])
def create_job_request():
    """ Request creates a new job.

    :return: HTTP response as appropriate
    """
    username = session.get('username')
    name = request.json.get('name')
    keywords = request.json.get('keywords')
    anyWords = request.json.get('anyWords')
    users = request.json.get('users')
    geoboxes = request.json.get('geoboxes')
    yakmarkers = request.json.get('yakmarkers')
    public = request.json.get('public')
    sources = request.json.get('sources')
    crisisflag = request.json.get('crisisflag')

    if username is None:
        abort(401)
    if name is None:
        abort(400)
    if keywords is None:
        keywords = []
    if users is None:
        users = []
    if geoboxes is None:
        geoboxes = []
    if yakmarkers is None:
        yakmarkers = []
    if sources is None:
        sources = []

    # remove any "@" the user may have supplied
    users = [user[1:] if user[0] == "@" else user for user in users]
    print 'crisisflag is: ' + str(crisisflag)

    return tweet_tracker_api.job_management.api_support.create_job(name, users, keywords,anyWords, geoboxes, username, yakmarkers,
                                                                   public=public, crisisflag=crisisflag, sources=sources)


@app.route("/api/job/<job_id>", methods=['GET'])
def get_job(job_id):
    """ Request gets the details for a particular job.

    This request returns a JSON object containing all of the publicly-facing
    information about a job with the given id.

    :param job_id: The ID of the job to retrieve.
    """
    username = session.get('username')
    return tweet_tracker_api.job_management.api_support.get_job(int(job_id), username)


@app.route("/api/job/<job_id>", methods=['PUT'])
def put_job(job_id):
    """ Replaces the job with the specified ID with a new job.

    :param job_id: The ID of the job to replace
    :return: An HTTP response representing the success/failure of the request
    """
    username = session.get('username')
    name = request.json.get('name')
    keywords = request.json.get('keywords')
    users = request.json.get('users')
    geoboxes = request.json.get('geoboxes')
    public = request.json.get('public')
    sources = request.json.get('sources')
    crisisflag = request.json.get('crisisflag')
    yakmarkers = request.json.get('yakmarkers')

    if username is None:
        abort(401)
    if name is None:
        abort(400)
    if keywords is None:
        keywords = []
    if users is None:
        users = []
    if geoboxes is None:
        geoboxes = []
    if sources is None:
        sources = []

    return tweet_tracker_api.job_management.api_support.update_job(int(job_id), name, users, keywords, geoboxes,
                                                                   username, yakmarkers, public=public, crisisflag=crisisflag, sources=sources)


@app.route("/api/deleteJob/<job_id>", methods=['POST'])
def delete_job(job_id):
    """ This request "deletes" the job with the specified id.

    :param job_id: The ID of the job to delete.
    :return: The HTTP status code corresponding to what action was taken.
    """
    username = session.get('username')
    if username is None:
        abort(401)
    return tweet_tracker_api.job_management.api_support.delete_job(username, int(job_id))


@app.route("/api/job/<job_id>/set_crawl", methods=['PUT'])
def set_crawl(job_id):
    """ This endpoint is used to set the crawl flag for a job

    :param job_id: The job to set the crawl flag for.
    :return: An HTTP response with either 200 or an appropriate error code.
    """
    username = session.get('username')
    crawl = request.json.get('crawl')
    if username is None:
        abort(401)
    if crawl is None:
        abort(400)
    crawl = bool(crawl)
    return tweet_tracker_api.job_management.api_support.set_crawl(username, int(job_id), crawl)


@app.route("/api/job/parameters", methods=["GET"])
def get_parameters():
    username = session.get("username")
    return tweet_tracker_api.job_management.api_support.crawl_parameters(username)


@app.route("/api/job/validate_name/<job_name>", methods=["GET"])
def validate_job_name(job_name):
    """ This endpoint validates a possible job name.

    This primarily consists of checking uniqueness.

    :param job_name: The job name to validate
    :return: An HTTP 200 if the name is usable or an error otherwise
    """
    return tweet_tracker_api.job_management.api_support.validate_job_name(job_name)


# Entity API routes start here


def extract_entity_parameters(r):
    """ This function is used by all entity endpoints for common parameters.

    :param r: The request to pull parameters from
    :return: A tuple containing begin, end, ids, and limit
    """
    begin_time = r.args.get("start_time")
    end_time = r.args.get("end_time")
    job_ids = r.args.getlist("job_ids")
    limit = r.args.get("limit")
    print  job_ids, limit, begin_time, end_time
    if job_ids is None or begin_time is None or end_time is None:
        abort(400)
    try:

        begin_time = long(begin_time)
        end_time = long(end_time)
        job_ids = [int(job_id) for job_id in job_ids]
        limit = 30 if limit is None else int(limit)


    except ValueError:
        abort(400)

    return begin_time, end_time, job_ids, limit


@app.route("/api/entities/locations", methods=["GET"])
def get_locations():
    """ This request returns the locations of geotagged tweets.

    :return: A JSON response containing the data requested if authorized.
    """
    username = session.get("username")
    begin_time, end_time, job_ids, _ = extract_entity_parameters(request)

    try:
        begin_time = long(begin_time)
        end_time = long(end_time)
        job_ids = [int(job_id) for job_id in job_ids]
    except ValueError:
        abort(400)

    return tweet_tracker_api.entities.api_support.get_locations(username, job_ids, begin_time, end_time, config)


@app.route("/api/entities/bots", methods=["GET"])
def get_bots():
    """
    Function to return top users in a job with their probability of being a bot
    :return: A JSON response containing the data (users, bot probability) requested if authorized
    """
    print 'In bot api'
    username = session.get('username')
    job_ids = request.args.getlist("job_ids")
    job_ids = [int(job) for job in job_ids]
    print username
    print job_ids
    try:
        (success, result) = find_jobs_bot_prob(job_ids, clf_rf, clf_lda)
        if not success:
            raise InvalidUsage(result, 410)
        else:
            r = Response(
                json.dumps(result, ensure_ascii=False),
                mimetype="application/json"
            )
            return r
    except InvalidUsage as e:
        raise e


@app.route("/api/get_user_info", methods=["GET"])
def get_user_info():
    """
    This request returns the userinfo from users collection
    """
    username = session.get('username')
    r = Response(json.dumps(tweet_tracker_api.auth.user.find_by_username(username), ensure_ascii=False),
                            mimetype="application/json")
    return r


@app.route("/api/entities/users", methods=["GET"])
def get_users():
    """ This request returns the most mentioned users for the given parameters.

    :return: A JSON response containing the data requested if authorized.
    """
    username = session.get('username')
    begin_time, end_time, job_ids, limit = extract_entity_parameters(request)
    print 'shobhitend',end_time
    return tweet_tracker_api.entities.api_support.get_users(username, job_ids, begin_time, end_time, limit)


@app.route("/api/entities/word_cloud", methods=["GET"])
def get_word_cloud():
    """ This endpoint implements the word cloud functionality of the API.

    :return: Either an HTTP error code or a 200 with the JSON object.
    """
    username = session.get("username")
    begin_time, end_time, job_ids, limit = extract_entity_parameters(request)

    return tweet_tracker_api.entities.api_support.generate_word_cloud(username, job_ids, begin_time, end_time, limit)


@app.route("/api/entities/all", methods=["GET"])
def get_all_entities():
    """ This endpoint returns ALL entities in one optimized call.

    :return: Either an HTTP error code or a 200 code with the JSON object.
    """
    username = session.get("username")
    begin_time, end_time, job_ids, limit = extract_entity_parameters(request)


@app.route("/api/entities/trend_lines", methods=["GET"])
def get_trend_lines():
    """ This endpoint generates trend lines for the specified jobs.

    :return: Either an HTTP error code or a 200 response with the JSON object.
    """
    username = session.get("username")
    begin_time, end_time, job_ids, _ = extract_entity_parameters(request)
    keywords = session.getlist("keywords")
    granularity = session.get("granularity")
    if begin_time is None or end_time is None or job_ids == [] or \
            granularity is None:
        abort(400)


# Search API routes start here


@app.route("/api/three_search", methods=["GET"])
def get_search_results():
    """ This endpoint is designed to power the Search/Export tab's box search.

    :return: Either an HTTP error code or a json object containing the results.
    """
    username = session.get("username")
    begin_time = request.args.get("begin_time")
    end_time = request.args.get("end_time")
    job_ids = request.args.getlist("job_ids")
    limit = request.args.get("limit")
    skip = request.args.get("skip")
    no_limit = request.args.get("no_limit")
    response_type = request.args.get("response_type")
    remove_fields = request.args.get("remove_fields")
    try:
        begin_time = long(begin_time)
        end_time = long(end_time)
        job_ids = [int(job_id) for job_id in job_ids]
        limit = 50 if limit is None else int(limit)
        skip = 0 if skip is None else int(skip)
        no_limit = False if no_limit is None else bool(no_limit)
        response_type = "JSON" if response_type is None else str(response_type)
        remove_fields = {} if remove_fields is None else json.loads(
            remove_fields)
        for key, elem in remove_fields.iteritems():
            remove_fields[key] = False
    except ValueError:
        abort(400)
    query = request.args.get("query")
    return tweet_tracker_api.search.api_support.three_search(username, begin_time, end_time,
                                                             job_ids, query, limit, skip, config, no_limit,
                                                             response_type, remove_fields)


@app.route("/api/tweet", methods=["POST"])
def get_tweet_list():
    username = session.get("username")
    indices = request.json.get("tweet_indices")
    response_type = request.json.get("response_type")
    response_type = "JSON" if response_type is None else str(response_type)
    if indices is None:
        abort(400)

    tweet_indices = []
    for tweet_index in indices:
        split_index = tweet_index.split("-")
        if len(split_index) != 2:
            abort(400)
        tweet_indices.append({
            "tweet_id": split_index[0],
            "catime": split_index[1]
        })

    return tweet_tracker_api.search.api_support.get_tweets(username, tweet_indices, response_type)


@app.route("/api/tweet/<index>", methods=["GET"])
def get_tweet(index):
    username = session.get("username")
    response_type = request.args.get("response_type")
    response_type = "JSON" if response_type is None else str(response_type)
    split_index = index.split("-")
    if len(split_index) != 2:
        abort(400)
    tweet_id, catime = long(split_index[0]), long(split_index[1])
    return tweet_tracker_api.search.api_support.get_tweet(username, tweet_id, catime, response_type)


@app.route("/api/translate", methods=["GET"])
def translate():
    text = request.args.get("text")
    return tweet_tracker_api.search.api_support.translate_tweet(text)


# API-Backing Routes
@app.route("/api/gettweets")
def get_tweets():
    try:
        print 'req args',request.args
        (success, result) = searchExport.getTweets(request.args)
        #print 'tweetsresult',result
        if not success:
            raise InvalidUsage(result, 410)
        else:
            r = Response(
                json.dumps(result, ensure_ascii=False),
                mimetype="application/json"
            )
            return r
    except InvalidUsage as e:
        raise e

@app.route("/api/getyaks")
def get_yakss():
    try:
        (success, result) = searchExportYaks.getYaks(request.args)
        print '[YAKS]', success, result
        if not success:
            raise InvalidUsage(result, 410)
        else:
            r = Response(
                json.dumps(result, ensure_ascii=False),
                mimetype="application/json"
            )
            return r
    except Exception as e:
        print e

@app.route("/api/gettrendline")
def get_timeline():
    try:
        (success, result) = timeline.getTrends(request.args)
        if not success:
            raise InvalidUsage(result, 410)
        else:
            r = Response(
                json.dumps(result, ensure_ascii=False),
                mimetype="application/json"
            )
            return r
    except InvalidUsage as e:
        raise e


@app.route("/api/monitoringtrendlines")
def get_monitoring_trendlines():
    try:
        (success, result) = timeline.getMonitoringTrendlines(request.args)
        if not success:
            raise InvalidUsage(result, 410)
        else:
            responsestr = json.dumps(result, ensure_ascii=False)
            cback = request.args.get("callback")
            if cback:
                responsestr = "%s(%s);" % (cback, responsestr)
            r = Response(
                responsestr,
                mimetype="application/json"
            )
            return r
    except InvalidUsage as e:
        raise e


@app.route("/api/getentities")
def get_entities():
    try:
        (success, result) = getEntities.getEntities(request.args)
        if not success:
            raise InvalidUsage(result, 410)
        else:
            r = Response(
                json.dumps(result, ensure_ascii=False),
                mimetype="application/json"
            )
            return r
    except InvalidUsage as e:
        raise e


@app.route("/api/gettopics", methods=['GET'])
def get_lda():
    cats = request.args.getlist("categoryID")
    username = session.get('username')
    return getlda(cats, username)


@app.route("/api/getreltweets", methods=['GET'])
def get_rel():
    cats = request.args.getlist("categoryID")
    maxtweets = request.args.getlist("max")
    distid = request.args.getlist("distID")
    username = session.get('username')
    return getrel(cats[0], distid, maxtweets, username)


@app.route("/api/getimages")
def get_images():
    try:
        (success, result) = searchExportImages.getImages(request.args)
        if not success:
            raise InvalidUsage(result, 410)
        else:
            r = Response(
                json.dumps(result, ensure_ascii=False),
                mimetype="application/json"
            )
            return r
    except InvalidUsage as e:
        raise e

@app.route("/api/image/<index>", methods=["GET"])
def get_image(index):
    username = session.get("username")
    split_index = index.split("-")
    if len(split_index) != 2:
        abort(400)
    image_id, catime = split_index[0], long(split_index[1])
    return tweet_tracker_api.search.api_support.get_image(username, image_id, catime, config)


@app.route("/api/image", methods=["POST"])
def get_images_by_index():
    username = session.get("username")
    indices = request.json.get("image_indices")
    response_type = request.json.get("response_type")
    response_type = "JSON" if response_type is None else str(response_type)
    if indices is None:
        abort(400)


    image_indices = []
    for image_index in indices:
        split_index = image_index.split("-")
        if len(split_index) != 2:
            abort(400)
        image_indices.append({
            "image_id": split_index[0],
            "catime": split_index[1]
        })
    return tweet_tracker_api.search.api_support.get_images(username, image_indices, config, response_type)


@app.route("/api/getvideos")
def get_videos():
    try:
        (success, result) = searchExportVideos.getVideos(request.args)
        if not success:
            raise InvalidUsage(result, 410)
        else:
            r = Response(
                json.dumps(result, ensure_ascii=False),
                mimetype="application/json"
            )
            return r
    except InvalidUsage as e:
        raise e


@app.route("/api/video/<index>", methods=["GET"])
def get_video(index):
    username = session.get("username")
    split_index = index.split("-")
    catime = 0
    video_id = ''

    if len(split_index) != 2:
        catime = long(split_index[-1])
        #reconcatenate video id if there was a - in the id
        video_id = ''
        for i in xrange(len(split_index) - 1):
            video_id += split_index[i] + '-'
        video_id = video_id[:-1]
    else:
        video_id, catime = split_index[0], long(split_index[1])
    return tweet_tracker_api.search.api_support.get_video(username, video_id, catime, config)


@app.route("/api/video", methods=["POST"])
def get_video_by_index():
    username = session.get("username")
    indices = request.json.get("video_indices")
    response_type = request.json.get("response_type")
    response_type = "JSON" if response_type is None else str(response_type)
    if indices is None:
        abort(400)

    video_indices = []
    for video_index in indices:
        split_index = video_index.split("*")
        if len(split_index) != 2:
            abort(400)
        video_indices.append({
            "video_id": split_index[0],
            "catime": split_index[1]
        })
    return tweet_tracker_api.search.api_support.get_videos(username, video_indices, config, response_type)


@app.route('/foo')
def get_foo():
    raise InvalidUsage('This view is gone', status_code=410)

# Get data set based off index... Will need to be updated once we know what we want to use for our index
@app.route('/api/hdx/dataset/<index>', methods=["GET"])
def get_hdx_dataset(index):
    response_type = request.args.get("response_type")
    response_type = "JSON" if response_type is None else str(response_type)
    return tweet_tracker_api.hdx.api_support.get_dataset(index, response_type)

# Get all datasets of a country
@app.route('/api/hdx/datasets/countries/<country>', methods=["GET"])
def get_hdx_datasets_for_country(country):
    response_type = request.args.get("response_type")
    response_type = "JSON" if response_type is None else str(response_type)
    return tweet_tracker_api.hdx.api_support.get_hdx_datasets_for_country(country, response_type)

# Sumbhav's call to get a file
@app.route('/api/hdx/getfile/<string:filename>', methods=['GET'])
def get_file(filename):
    return tweet_tracker_api.hdx.api_support.get_file(filename)

@app.route('/api/hdx/getfileextension/<string:filename>', methods=['GET'])
def get_file_extension(filename):
    return tweet_tracker_api.hdx.api_support.get_file_extension(filename)

# user limit endpoint
@app.route("/api/query_user_limit", methods=["GET"])
def get_user_limit():
    username = session.get("username")
    print username
    return getUserLimit(username)


'''
ConversationTracker Stuff
'''


@app.route("/api/crawl", methods=['GET'])
def crawl():
    anId = request.args.getlist("id")[0]
    return render_template('graphvis2.html')


@app.route("/api/run_crawl", methods=['GET'])
def run_crawl():
    anId = request.args.getlist("id")[0]
    return checkCrawl(anId)


"""
Exceptions
"""


@app.errorhandler(InvalidUsage)
def handle_invalid_parameter(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


if __name__ == "__main__":
    app.run(host='0.0.0.0', threaded=True, port=5000, debug=True)

    # start utility threads
    # locmap = Utils.UtilityThread()
    # locmap.start(Utils.LocMapWorker)
    # lda = Utils.UtilityThread()
    # lda.start(Utils.LDAWorker)
