from pymongo import *
import sys

def main():
	client = MongoClient('149.169.226.104', 27020)
	db = client.tweettracker
	db.authenticate('twtuser', '!!!asudmml%%%')

	if len(sys.argv) < 3:
		print 'Usage python setuserlimit.py <userid> <newlimit>'
		return

	userid = int(sys.argv[1])
	numtweets = int(sys.argv[2])

	print 'Setting user %d tweet limit to %d' % (userid, numtweets)
	db.users.update({'id':userid}, {'$set': {'numoftweets': numtweets}})
	print 'Done'


if __name__ == '__main__':
	main()