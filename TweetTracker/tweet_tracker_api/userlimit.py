from pymongo import *
import ujson as json

def getUserLimit(id):

	c = MongoClient('149.169.226.104:27020')
	db = c['tweettracker']
	db.authenticate('twtuser','!!!asudmml%%%')

	res = db.users.find_one({"username": id})
	idnum = res['id']
	maxtweets = res['numoftweets']

	res = db.usercounts.find_one({"id": idnum})
	if res == None:
		curtweets = 0
	else:
		curtweets = res['num_accumulated']

	results = dict()
	if maxtweets == -1:
		results['limit'] = 'unlimited'
	else:
		results['limit'] = maxtweets
	results['current'] = curtweets
	return json.dumps(results)