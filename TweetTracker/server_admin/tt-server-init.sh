sudo apt-get update
sudo apt-get install python python-dev python-pip subversion
svn co --username grant https://149.169.226.79:8443/svn/tweettrackerapi
cd tweettracker/trunk
pip install -r requirements.txt