sudo apt-get update
sudo apt-get install python python-dev python-pip subversion gfortran liblapack-dev
svn co --username grant --password grant https://149.169.226.79:8443/svn/pycrawler
pip install -r requirements.txt
python server.py