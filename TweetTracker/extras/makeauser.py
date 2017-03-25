import sys
import hashlib
import json
from time import time
from pymongo import MongoClient, DESCENDING

conf = json.load(open('../config.json'))

# establish a connection
client = MongoClient(conf["mongo_dist_server"], conf["mongo_dist_port"])
db = client[conf["mongo_dist_db"]]
db.authenticate(conf["mongo_dist_username"], conf["mongo_dist_password"])

# choose the next available user ID
maxuser = list(db.users.find({}, {"id": 1}).sort("id", DESCENDING).limit(1))
print maxuser
if len(maxuser) > 0:
    next_id = maxuser[0]['id'] + 1
else:
    next_id = 1
print next_id
username = sys.argv[1]
password = sys.argv[2]

md5_hash = hashlib.md5(password).hexdigest()

user_doc = {
    "creationtime": int(time()) * 1000,
    "last_login": int(time()) * 1000,
    "username": username,
    "password": md5_hash,
    "id": next_id,
    "logins": 0,
    "roleID": 1,
    "exportrights": 1,
    "description": "auto generated user",
    "realname": "",
    "phone": "",
    "email": "",
    "location": "",
    "numoftweets": 10000
}

print(db.users.insert(user_doc))
print(next_id)
