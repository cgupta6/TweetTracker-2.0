import datetime

def parseUTCtimestamp(timestamp):
    """
    
    :param timestamp: time stamp
    :return:  utc timestamp
    """
    return datetime.datetime.utcfromtimestamp(timestamp)