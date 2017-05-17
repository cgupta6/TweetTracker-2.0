import time
from tweet_tracker_api.auth.user import username_to_id


reports= None

def setup(collection, ram_collection):
    global reports
    reports = collection
    ram_reports = ram_collection


def create(name, start_datetime, end_datetime, selectedJobs, filter_by, allWords, anyWords, noneWords, user_id):
    """ This function creates a new report with specified parameters.

    :param name: The name of the report to be created
    :param start_datetime: start date_time
    :param end_datetime: end date_time
    :param selectedJobs: selected jobs for report
    :param filter_by: The sources for which the report should be filtered
    :param allWords: all words to be searched 
    :param anyWords: any word from this list
    :param noneWords: none of these words should come in the report results
    :param user_id: The user that this Job is being created for
	:return: The ID of the report as stored in MongoDB
    """
    nextReportId = next_report_id()
    report_id = reports.insert({
        'reportID': nextReportId,
        'reportname': name,
        'createtime': int(round(time.time() * 1000)),
        'creator': user_id,
        'start_datetime': start_datetime,
        'end_datetime': end_datetime,
        'selectedJobs': selectedJobs,
        'filter_by': filter_by,
        'allWords': allWords,
        'anyWords': anyWords,
        'noneWords': noneWords
    })
    return nextReportId if report_id is not None else None



def update(report_id, name, start_datetime, end_datetime, selectedJobs, filter_by, allWords, anyWords, noneWords, user_id):
    """ This function updates the parameters of a report
    
    :param report_id: The id of the report to be updated
    :param name: The name of the report to be updated
    :param start_datetime: start date_time
    :param end_datetime: end date_time
    :param selectedJobs: selected jobs for report
    :param filter_by: The sources for which the report should be filtered
    :param allWords: all words to be searched 
    :param anyWords: any word from this list
    :param noneWords: none of these words should come in the report results
    :param user_id: The user that this Job is being created for
    :return: True if successful, None otherwise
    """

    report_record = reports.find_one({'reportID': report_id})

    mongo_id = report_record['_id']

    # Create the new replacing object
    new_report = {
        '_id': mongo_id,
        'reportID': report_id,
        'reportname': name,
        'createtime': report_record['createtime'],
        'creator': user_id,
        'start_datetime': start_datetime,
        'end_datetime': end_datetime,
        'selectedJobs': selectedJobs,
        'filter_by': filter_by,
        'allWords': allWords,
        'anyWords': anyWords,
        'noneWords': noneWords
    }

    # Perform the actual update
    return reports.save(new_report)

def get_by_id(report_id):
    """

    :param report_id: report id
    :return: report object
    """
    return reports.find_one({'reportID': report_id})


def get_all_by_user(username):
    """ This function gets all of the reports a user have created.

    :param username: The username of the user
    :return: The list of Job objects from MongoDB
    """
    id = username_to_id(username)

    if id is not None:
        return {'reports': [clean_report(report) for report in reports.find({'creator': username_to_id(username)})]}


def get_reports_all():
    """ This function gets all of the reports a user have created.

    :param username: The username of the user
    :return: The list of Job objects from MongoDB
    """
    return {'reports': [clean_report(report) for report in reports.find({})]}





def get_report_with_user(report_id, username):
    """ Gets the report with the given username.

    :param report_id: The report to retrieve
    :param username: The user retrieving the report
    :return: The report or None if the permissions aren't correct
    """
    user_id = username_to_id(username)
    report = reports.find_one({"reportID": int(report_id)})
    # No such report id
    if report is None:
        return None
    # Incorrect permissions
    elif report['creator'] != user_id:
        return None
    # Permissions match
    else:
        report = clean_report(report)
        return {"report": report}


def next_report_id():
    """ This function gets the next reportID for a future report.

    :return: The integer representing the new reportID.
    """
    if reports.count() == 0:
        return 1
    else:
        most_recent_report = reports.find({}).sort("reportID", -1)[0]
        return most_recent_report["reportID"] + 1


def clean_report(report):
    """ Cleans a MongoDB report for sending to the client

    :param report: The raw MongoDB object
    :return: The cleaned report object
    """
    return {
        "reportID": report.get('reportID'),
        "reportname": report.get('reportname'),
        "createtime": report.get('createtime'),
        "creator": report.get('creator'),
        "start_datetime": report.get('start_datetime'),
        "end_datetime": report.get('end_datetime'),
        "selectedJobs": report.get('selectedJobs'),
        "filter_by" : report.get('filter_by'),
        'allWords': report.get('allWords'),
        'anyWords': report.get('anyWords'),
        'noneWords': report.get('noneWords')
    }


def delete(user_id, report_id):
    """

    :param user_id: user id
    :param job_id: job id
    :return:
    """
    report = reports.find_one({"creator": user_id, "reportID": report_id})
    if report is None:
        return None
    return reports.remove({"creator": user_id, "reportID": report_id})
