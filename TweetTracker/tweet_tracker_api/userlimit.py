from pymongo import *
import ujson as json

def getUserLimit(id):
	"""
	
	:param id: id
	:return: json dump of result
	"""
	config = json.load(open("config.json", "r"))
	c = MongoClient(config["mongo_ram_server"], config["mongo_ram_port"])
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