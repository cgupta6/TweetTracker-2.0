# Driver program for CrawlManager.py
# 4/8/15 Justin Sampson

if __name__ == '__main__':
	import CrawlManager as CM
	print 'Starting main'

	manager = CM.CrawlManager()
	# manager.setNumCrawlers(kwNum = 0, userNum = 0, geoNum = 0, sample = True)
	numRestarts = 0
	while True:
		if numRestarts > 0:
			print 'Restarting all crawlers, restart #%d' % numRestarts
		manager.start()
		numRestarts += 1