from flask import abort, jsonify, Response
from json import dumps
import job
from ..auth.user import email_to_id, username_to_id
import logging


def get_all_classic(username=None):
    """ This gets all of the jobs for a user by their username.

    This is named "classic" because this is how the old TweetTracker works. We
    were going to change this to use the email (see get_all).

    :param username: The user to get the jobs for.
    :return: Either the public jobs (if no user) or the user's jobs.
    """
    print(username)
    if username is None:
        return jsonify(job.get_public())
    else:
        return jsonify(job.get_all_by_user(username))


def get_job(job_id, username=None):
    """

    :param job_id: job id
    :param username: user name
    :return: jsonified job
    """
    my_job = job.get_job_with_user(job_id, username)
    if my_job is None:
        abort(401)
    else:
        return jsonify(my_job)


def get_all(email):
    """ This generates a response that gets all of the jobs of a user.

    :param email: The user to retrieve jobs for
    :return: An HTTP 200 response with the json objects
    """
    return jsonify(map(job.clean_job, job.get_all_by_user(email)))


def create_job(name, users, keywords, anyWords, geoboxes, username, yakmarkers=[], public=False, crisisflag=False, sources=[]):
    """ This function creates a new job on the database then redirects

    :param name: The name of the new job
    :param users: The users to put into the new job
    :param keywords: The keywords to put into the new job
    :param geoboxes: The geoboxes to track with the new job
    :param username: The user creating the job
	:param sources: The sources from which the job should be crawled
    :return: A redirect response to view the new job
    """
    job_id = job.create(name, keywords, anyWords, users, geoboxes, username_to_id(username), yakmarkers, public, crisisflag, sources)
    if job_id is None:
        abort(400)
    log = logging.getLogger()
    log.error(username + ' ' + 'Job_Creation '+ str(name))
    return jsonify({"status": "ok", "id": job_id})


def update_job(job_id, name, users, keywords, geoboxes, username, yakmarkers=[], public=None, crisisflag=None, sources=[]):
    """ This sets all of the properties of the specified job with the arguments.

    :param job_id: The job to update
    :param name: The new name of the job
    :param users: The new users for the job to track
    :param keywords: The new keywords for the job to track
    :param geoboxes: The new geoboxes for the job to track
    :param username: The username of the user seeking to update the job
	:param sources: The sources from which the job should be crawled
    :return:
    """
    mongo_response = job.update(username_to_id(username), job_id, name, keywords, users, geoboxes, yakmarkers, public, crisisflag, sources)
    if mongo_response is None:
        abort(400)
    else:
        log = logging.getLogger()
        log.error(username + ' ' + 'Job_Updation '+ str(name) + ' ' + str(job_id))
        return jsonify({"status": "ok"})


def handle_get_job(job_id, email):
    """

    :param job_id: job id
    :param email: email
    :return:jsonified job
    """
    my_job = job.get_by_id(job_id)

    # If the job does not exist, return a 400
    if my_job is None:
        abort(400)

    # Check permissions
    if email is None:
        if my_job['publicflag'] != 1:
            abort(401)
        else:
            return jsonify(my_job)
    else:
        if email_to_id(email) not in my_job['readers']:
            abort(401)
        else:
            return jsonify(my_job)


def delete_job(username, job_id):
    """ Removes the job from its owner so it won't appear in their job list.

    :param username: The user seeking to delete a job
    :param job_id: The job to delete
    :return: An HTTP status code indicating success/failure
    """
    user_id = username_to_id(username)
    if user_id is None:
        abort(401)
    mongo_success = job.delete(user_id, job_id)

    if mongo_success is None:
        # Forbidden, because the user authenticates but lack permission
        abort(403)
    else:
        log = logging.getLogger()
        log.error(username + ' ' + 'Job_Deletion '+ str(job_id))
        return jsonify({"status": "ok"})


def set_crawl(username, job_id, crawl):
    """ This is the backing function for the set_crawl enpoint.

    :param username: The username of the user currently logged in
    :param job_id: The ID of the job we are changing
    :param crawl: Whether to start or stop the crawling of this job
    :return: Response code indicating success/failure
    """
    user_id = username_to_id(username)
    if user_id is None:
        abort(401)
    mongo_success = job.authenticated_set_crawl(user_id, job_id, crawl)
    if mongo_success is None:
        abort(401)  # This user must not be the owner
    else:
        return jsonify({"status": "ok"})


def crawl_parameters(username):
    """ This function returns the parameters of all categories

    :param username: user name
    :return: username parameter json
    """
    user_id = username_to_id(username)
    if user_id is None:
        abort(401)

    return Response(unicode(dumps(job.get_all_parameters(username))),
                    mimetype='application/json', content_type='utf-8')


def validate_job_name(job_name):
    """ This backend function validates the job name for uniqueness.

    :param job_name: The job name to validate
    :return: An appropriate HTTP response
    """
    if job_name != '' and job.validate_job_name(job_name):
        return jsonify({job_name: "valid"})
    else:
        return jsonify({job_name: "invalid"})
