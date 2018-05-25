//category id & time
conn = new Mongo("localhost:27017");
db = conn.getDB("tweettracker");
db.auth("twtuser","!!!asudmml%%%");

// Creating temp collections
db.createCollection("tempVideos");
db.createCollection("tempImages");

function getCategoryId(catime) {
  //obtain category id from catime string
  while (catime > 3330000000000000) catime -= 3330000000000000;
  catime /= 10000000000;
  catime = Math.floor(catime);
  return catime;
}

function getTimestamp(catime) {
  var timestamp = catime % 10000000000;
  timestamp = timestamp - (timestamp % 3600); //round timestamp down to closest hour
  return new NumberLong("" + (timestamp * 1000));
}


db.images.find().forEach(function(image) {
  categoryId = getCategoryId(image.catime);
  timestamp = getTimestamp(image.catime);
  if(db.tempImages.find({cat:categoryId, timestamp:timestamp}).count() == 0) {
    db.tempImages.insert({cat:categoryId, timestamp:timestamp, count:1});
  } else {
    db.tempImages.update({cat:categoryId, timestamp:timestamp}, {$inc: {count: 1}});
  }
});

db.videos.find().forEach(function(video) {
  categoryId = getCategoryId(video.catime);
  timestamp = getTimestamp(video.catime);
  if(db.tempVideos.find({cat:categoryId, timestamp:timestamp}).count() == 0) {
    db.tempVideos.insert({cat:categoryId, timestamp:timestamp, count:1});
  } else {
    db.tempVideos.update({cat:categoryId, timestamp:timestamp}, {$inc: {count: 1}});
  }
});

/* This is commented for now in order to allow manual migration.

//Clearing both category counter collections
db.imagescategorycounter.remove({});
db.videoscategorycounter.remove({});

//Inserting into category counter from temp collections
db.tempImages.find().forEach(function(d){
db.imagescategorycounter.insert(d);
});
db.tempVideos.find().forEach(function(d){
db.videoscategorycounter.insert(d);
});

// Deleting temp collections
db.getCollection("tempVideos").drop();
db.getCollection("tempImages").drop();
*/

db.imagescategorycounter.rename("imagescategorycounter1");
db.videoscategorycounter.rename("videoscategorycounter1");
db.tempVideos.rename("videoscategorycounter");
db.tempImages.rename("imagescategorycounter");