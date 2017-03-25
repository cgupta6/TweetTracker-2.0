sudo apt-get update
sudo apt-get install mongodb
sudo mkdir -p /mongo-disk
cd /mongo-disk
sudo mkdir data
cd ~
sudo mongod --dbpath /mongo-disk/data &> mongo-log.txt &
mongo localhost:27017/tweettracker tt-init.js