from flask import jsonify

class InvalidUsage(Exception):
    """
    Invalid usage class
    """
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        """

        :param message: message
        :param status_code: status code
        :param payload: payload
        """
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        """

        :return: dictionary
        """
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv