# TweetTrackerWeb
This is a repository to hold the new version of tweet tracker web and server

## Mock UI
It's a sample UI created using [AngularJs] , [Bootstrap] , [jQueryUI] and [Angular-Material].

##### How to Run:
Open the Mock UI project in Web Storm and run the index.html from any browser.

##TweetTracker
Project currently in development using [AngularJs] , [Bootstrap] , [jQueryUI], [Angular-Material], [Python] and [MongoDB].

##How to setup mongoDB:
1. Install mongodb version 3.4.3
   https://docs.mongodb.com/master/tutorial/install-mongodb-on-ubuntu/?_ga=1.145819188.1227982745.1492119930
2. Start mongod service:
   $sudo mongod --dbpath=[Your data/db folder path]

##### How to Run:
Open the TweetTracker project in  Pycharm and run the server.py. Then, open "localhost:5000" url from any browser.

From terminal:
1. Navigate to TweetTracker folder.
2. Run 'python server.py' command.


##### How to setup mongodb on a new machine:
Note: This step is required only on one machine for everyone else, currently hosted at 584AA.
1. Find your machine hostname:Type:hostname in terminal
2. Edit the file /<project-directory>/TweettrackWeb/config.json and change mongo_ram_server & mongo_dist_server from "en4054679l.cidse.dhcp.asu.edu" to "<hostname>.cidse.dhcp.asu.edu"
3. Start MongoDB: sudo mongod --dbpath="/<path to db>/db" --port=28018 --fork --logpath mongodb.log


## External Resources

#### 1. [Slack]

#### 2. [Trello]

### Google Drive (For TweetTracker Standalone DB Files)
https://drive.google.com/open?id=0B22qt9HHfie0U3dNM0duZDB0VFk


[AngularJS]: <http://angularjs.org>
[Angular-Material]: <https://material.angularjs.org/latest/>
[Bootstrap]: <http://getbootstrap.com/components/>
[jQueryUI]: <https://jqueryui.com/>
[Trello]: <https://trello.com/tweettracker>
[Slack]: <https://tweettrackerteam.slack.com>
