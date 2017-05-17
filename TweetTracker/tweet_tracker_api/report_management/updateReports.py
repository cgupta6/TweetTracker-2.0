"""
Program to get tweets
"""
import sys
import json
from time import time
from flask import session
from api_support import *


def updateReports(self, queryargs):

    # get reports
    reports = get_all_reports()

