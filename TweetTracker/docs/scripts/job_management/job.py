import codecs
import re
import time
from math import ceil
#from tweet_tracker_api.auth.user import username_to_id


jobs = None
twython_obj = None
USER_ID_BATCH_SIZE = 100


def setup(collection, twython_o):
    """
    
    :param collection: collection
    :param twython_o: twython_o
    :return: 
    """
    global jobs
    global twython_obj
    jobs = collection
    twython_obj = twython_o


def lookup_twitter_users(screen_names):
    """
    
    :param screen_names: screen name
    :return: user details
    """
    if len(screen_names) == 0:
        return []
    response = []
    # Break the screen names into 100-name sublists, send requests, and
    # concatenate them
    for i in range(0, int(ceil(len(screen_names) / float(USER_ID_BATCH_SIZE)))):
        start_idx = i * USER_ID_BATCH_SIZE
        resp = twython_obj.lookup_user(
            screen_name=",".join(screen_names[start_idx:start_idx + 100]))
        response.extend([
            {
                "screen_name": obj['screen_name'],
                "userID": obj['id']
            } for obj in resp
        ])
    return response


def create(name, keywords, users, geoboxes, user_id, yakmarkers, public, crisisflag, sources):
    """ This function creates a new job with specified parameters.

    :param name: The name of the Job to be created
    :param keywords: The list of keywords
    :param users: The list of users
    :param geoboxes: The list of Geoboxes
    :param user_id: The user that this Job is being created for
	:param sources: The sources from which the job should be crawled
    :return: The ID of the Job as stored in MongoDB
    """
    nextJobId = next_job_id()
    job_id = jobs.insert({
        'categoryID': nextJobId,
        'catname': name,
        'createtime': int(round(time.time() * 1000)),
        'creator': user_id,
        'desc': '',
        'geoboxes': [convert_geo_from_ui(geobox) for geobox in geoboxes],
        'yakmarkers': [convert_yak_from_ui(yakpin) for yakpin in yakmarkers],
        'keywords': keywords,
        'last_tweet_time': 0,
        'publicflag': 1 if public else 0,
        'crisisflag': 1 if crisisflag else 0,
        'userids': lookup_twitter_users(users),
        'includeincrawl': 1,
        'oldfield': 0,
        'sources': sources
    })
    return nextJobId if job_id is not None else None



def update(user_id, job_id, name, keywords, users, geoboxes, yakmarkers, public, crisisflag, sources):
    """ This function updates the parameters of a Job

    :param name: The name to use for the Job
    :param keywords: The keywords to use for the Job
    :param users: The users to set for the Job
    :param geoboxes: The locations to set for the Job
    :param user_id: The user doing the update
    :param job_id: The ID of the job we're updating
	:param sources: The sources from which the job should be crawled
    :return: True if successful, None otherwise
    """
    # Check to see if the specified user has write access to the Job
    # Added by FM on 01/20/2015
    # --- Check if the job is public. allow any logged in user to update a public job.
    job_record = jobs.find_one({'categoryID': job_id})
    permission = jobs.find_one({'categoryID': job_id, 'creator': user_id}) or user_id == 'admin'
    if permission is None and job_record['publicflag'] == 0:
        return None
    permission = job_record

    mongo_id = permission['_id']

    # Create the new replacing object
    # - some jobs do not have a last_tweet_time field. Why not?
    lttime = permission['last_tweet_time'] if 'last_tweet_time' in permission else 0
    new_job = {
        '_id': mongo_id,
        'categoryID': job_id,
        'catname': name,
        'createtime': permission['createtime'],
        'creator': user_id,
        'desc': '',
        'geoboxes': [convert_geo_from_ui(geobox) for geobox in geoboxes],
        'yakmarkers': [convert_yak_from_ui(yakpin) for yakpin in yakmarkers],
        'keywords': keywords,
        'last_tweet_time': lttime,
        'publicflag': 1 if public is not None else permission['publicflag'],
        'crisisflag' : 1 if crisisflag is not None else permission['crisisflag'],
        'userids': lookup_twitter_users(users),
        'includeincrawl': permission['includeincrawl'],
        'oldfield': 0,
		'sources': sources
    }

    # Perform the actual update
    return jobs.save(new_job)


def get_all_parameters(username):
    """ This function returns all parameters in the database for crawling.

    :return: An object containing all parameters of the DB
    """
    parameters = []
    for job in jobs.find({
                             "includeincrawl": 1
                         }, {
                             "_id": -1,
                             "categoryID": 1,
                             "userids": 1,
                             "geoboxes": 1,
                             "keywords": 1,
                             "geoand":1
                         }):
        if job.get("categoryID") is None:
            continue
        print(job)
        parameters.append({
            "id": job["categoryID"],
            "users": [user["userID"] for user in job["userids"]],
            "geoboxes": [convert_geo_from_tt(geo) for geo in job["geoboxes"]],
            "yakmarkers": [convert_yak_from_tt(yakpin) for yakpin in job["yakmarkers"]],
            "keywords": [keyword for keyword in job["keywords"]],
                    })

    return parameters


def get_by_id(job_id):
    """

    :param job_id: job id
    :return: job category
    """
    return jobs.find_one({'categoryID': job_id})


def get_public():
    """ Retrieves all public jobs from the database.

    :return: An object containing all public jobs cleaned up
    """
    return {'jobs': [clean_job(job) for job in jobs.find({'publicflag': 1})]}


def get_all_by_user(username):
    """ This function gets all of the jobs a user can read from. If the user is admin (id = 6), ALL jobs (besides deleted ones) should be returned

    :param username: The username of the user
    :return: The list of Job objects from MongoDB
    """
    id = username_to_id(username)

    if id == 6: #user is admin, return all jobs
        return {'jobs': [clean_job(job) for job in jobs.find({'creator':{'$gte':0}})]}
    else: #only return the user's jobs and public jobs	
        return {'jobs': [clean_job(job) for job in jobs.find({
            '$or': [
                {'creator': username_to_id(username)},
                {'publicflag': 1}
            ]
        })]}


def clean_job(job):
    """ Cleans a MongoDB job for sending to the client

    :param job: The raw MongoDB object
    :return: The cleaned job object
    """
    return {
        "categoryID": job.get('categoryID'),
        "catname": job.get('catname'),
        "createtime": job.get('createtime'),
        "creator": job.get('creator'),
        "desc": job.get('desc'),
        "geoboxes": [] if job.get('geoboxes') is None else [convert_geo_from_tt(geo) for geo in job.get('geoboxes')],
        "yakmarkers": [] if job.get('yakmarkers') is None else [convert_yak_from_tt(yakpin) for yakpin in job.get('yakmarkers')],
        "keywords": job.get('keywords'),
        "last_tweet_time": job.get('last_tweet_time'),
        "publicflag": job.get('publicflag'),
        "crisisflag" : job.get('crisisflag'),
        "userids": job.get('userids'),
        "includeincrawl": job.get('includeincrawl'),
		"sources": job.get("sources")
    }


def next_job_id():
    """ This function gets the next categoryID for a future job.

    :return: The integer representing the new categoryID.
    """
    if jobs.count() == 0:
        return 1
    else:
        most_recent_job = jobs.find({}).sort("categoryID", -1)[0]
        return most_recent_job["categoryID"] + 1


def get_job_with_user(job_id, username=None):
    """ Gets the job with the given username. If None, assume it's a public req

    :param job_id: The job to retrieve
    :param username: The user retrieving the job or None if public
    :return: The job or None if the permissions aren't correct
    """
    user_id = username_to_id(username)
    job = jobs.find_one({"categoryID": int(job_id)})
    # No such job id
    if job is None:
        return None
    # Incorrect permissions and job is not public
    elif job['publicflag'] == 0 and job['creator'] != user_id and username != 'admin':
        return None
    # Permissions match
    else:
        job = clean_job(job)
        return {"job": job}


def convert_geo_from_tt(geobox):
    """

    :param geobox: geo box
    :return: converted geobox
    """
    return {
        'nwLat': geobox['latlngne'][0],
        'nwLng': geobox['latlngsw'][1],
        'neLat': geobox['latlngne'][0],
        'neLng': geobox['latlngne'][1],
        'seLat': geobox['latlngsw'][0],
        'seLng': geobox['latlngne'][1],
        'swLat': geobox['latlngsw'][0],
        'swLng': geobox['latlngsw'][1]
    }

def convert_yak_from_tt(yakpin):  # converts yak pins found in mongodb to a format used by leaflet map
    """
    
    :param yakpin:  yak pin
    :return:  yak lat n long
    """
    return {
        'yaklat': yakpin['pinlat'],
        'yaklong': yakpin['pinlong']
    }

def convert_geo_from_ui(geobox):
    """

    :param geobox: geobox
    :return: 
    """
    return {
        'latlngne': [geobox['neLat'], geobox['neLng']],
        'latlngsw': [geobox['swLat'], geobox['swLng']]
    }

def convert_yak_from_ui(yakpin): # converts yak pins created on the leaflet map for storage in mongodb
    """

    :param yikyakpins: yakpin
    :return:
    print yakpin
    """

    return {

        'pinlat': [yakpin['yaklat']],
        'pinlong': [yakpin['yaklong']]
    }

def delete(user_id, job_id):
    """

    :param user_id: user id
    :param job_id: job id
    :return:
    """
    job = jobs.find_one({"creator": user_id, "categoryID": job_id})
    if user_id == 'admin':
        job = jobs.find_one({"categoryID": job_id})
    if job is None:
        return None
    job['prev_creator'] = job['creator']
    job['creator'] = -1
    job['publicflag'] = 0
    job['includeincrawl'] = 0 #make sure the job isn't crawled, since the crawler only checks for creator >= 0
    return jobs.save(job)


def download(user_id, job_id):
  
    job = jobs.find_one({"creator": user_id, "categoryID": job_id})
    
    if job is None:
        print("NONE..............")
        return None
    
    return jobs.save(job)



def authenticated_set_crawl(user_id, job_id, crawl):
    """

    :param user_id: user id
    :param job_id: job id
    :param crawl: crawl
    :return: updates job
    """
    job = None
    if user_id == 6:
        # user is admin, let them do what they want
        job = jobs.find_one({"categoryID": job_id})
    else:
        job = jobs.find_one({"creator": user_id, "categoryID": job_id})
    if job is None:
        return None
    print job
    return jobs.update({"categoryID": job_id}, {"$set": {"includeincrawl": 1 if crawl else 0}})


def validate_job_name(job_name):
    """ Check mongodb for the job name.

    :param job_name: The job name to check for
    :return: True if the job name is acceptable, false otherwise
    """
    job = jobs.find_one({"catname": job_name})
    if job is None:
        return True
    else:
        return False
