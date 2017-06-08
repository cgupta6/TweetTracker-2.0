from flask import abort, jsonify, Response
from json import dumps
import report
from ..auth.user import email_to_id, username_to_id
import logging

def get_all_reports_by_user(username=None):
    """ This gets all of the reports for a user by their username.

    :param username: The user to get the reports for.
    :return: the user's reports.
    """
    return jsonify(report.get_all_by_user(username))

def get_all_reports():
    """ This gets all of the reports for a user by their username.

    :param username: The user to get the reports for.
    :return: the user's reports.
    """
    print report.get_reports_all()
    return jsonify(report.get_reports_all())


def get_report(report_id, username=None):
    """

    :param report_id: report id
    :param username: user name
    :return: jsonified report
    """
    my_report = report.get_report_with_user(report_id, username)
    if my_report is None:
        abort(401)
    else:
        return jsonify(my_report)


def create_report(name, start_datetime, end_datetime, selectedJobs, filter_by, allWords, anyWords, noneWords, username):
    """ This function creates a new report on the database then redirects
    
    :param name: The name of the report to be created
    :param start_datetime: start date_time
    :param end_datetime: end date_time
    :param selectedJobs: selected jobs for report
    :param filter_by: The sources for which the report should be filtered
    :param allWords: all words to be searched 
    :param anyWords: any word from this list
    :param noneWords: none of these words should come in the report results
    :param username: The username of user for which this Job is being created for
	:return: A redirect response to view the new report
    """
    report_id = report.create(name, start_datetime, end_datetime, selectedJobs, filter_by, allWords, anyWords, noneWords, username_to_id(username))
    if report_id is None:
        abort(400)
    log = logging.getLogger()
    log.error(username + ' ' + 'Report_Creation '+ str(name))
    return jsonify({"status": "ok", "id": report_id})


def update_report(report_id, name, start_datetime, end_datetime, selectedJobs, filter_by, allWords, anyWords, noneWords, username):
    """ This sets all of the properties of the specified report with the arguments.

     :param report_id: The id of the report to be updated
    :param name: The name of the report to be updated
    :param start_datetime: start date_time
    :param end_datetime: end date_time
    :param selectedJobs: selected jobs for report
    :param filter_by: The sources for which the report should be filtered
    :param allWords: all words to be searched 
    :param anyWords: any word from this list
    :param noneWords: none of these words should come in the report results
    :param username: The username of user for which this Job is being created for
	:return:
    """
    mongo_response = report.update(report_id, name, start_datetime, end_datetime, selectedJobs, filter_by, allWords, anyWords, noneWords, username_to_id(username), data=None)
    if mongo_response is None:
        abort(400)
    else:
        log = logging.getLogger()
        log.error(username + ' ' + 'Report_Updation '+ str(name) + ' ' + str(report_id))
        return jsonify({"status": "ok"})


def handle_get_report(report_id):
    """

    :param report_id: report id
    :return:jsonified report
    """
    my_report = report.get_by_id(report_id)

    # If the job does not exist, return a 400
    if my_report is None:
        abort(400)

    return jsonify(my_report)


def delete_report(username, report_id):
    """ Removes the report from its owner so it won't appear in their report list.

    :param username: The user seeking to delete a report
    :param report_id: The report to delete
    :return: An HTTP status code indicating success/failure
    """
    user_id = username_to_id(username)
    if user_id is None:
        abort(401)
    mongo_success = report.delete(user_id, report_id)

    if mongo_success is None:
        # Forbidden, because the user authenticates but lack permission
        abort(403)
    else:
        log = logging.getLogger()
        log.error(username + ' ' + 'Job_Deletion '+ str(report_id))
        return jsonify({"status": "ok"})

