from pprint import pprint
import time
from pymongo import MongoClient
client = MongoClient('localhost',27017)
print("Connection Successful!")

mydb = client.tweettracker
my_collection = mydb.categories

current_date = int(round(time.time() * 1000)) - 26400000

results = my_collection.find({"createtime":{"$lt":current_date}},{"categoryID":1})

print("found", results.count())


cat = []
for record in results:
    #pprint(record['categoryID'])
    cat.append(record['categoryID'])

print("going to delete following crawler",cat)

#cat = [22,23]
my_collection2 = mydb.tweets
results = my_collection2.delete_many({"cat":{"$in":cat}})

#print("deleted",results.count())
#result = my_collection.delete_many({ac})


print("deletion done")

#print("remaining",len(record))
