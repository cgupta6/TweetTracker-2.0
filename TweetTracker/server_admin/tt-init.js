db.addUser("twtuser","!!!asudmml%%%");
db.createCollection("tweets");
db.createCollection("users");
db.createCollection("categories");
db.createCollection("userroles");
db.createCollection("addlcategoryinfo");
db.createCollection("categorycounter");
db.createCollection("categorystatus");
//queries using the index should follow order and use $lt and $gt according to the direction of the index
db.categorycounter.ensureIndex({"cat":1,timestamp:-1});
db.categorystatus.ensureIndex({"cat":1});
db.tweets.ensureIndex({catime:1,id:1},{unique:true,dropDups:true});
db.tweets.ensureIndex({catime:1,"location.lng":1,"location.lat":1,rand:1});
db.categories.ensureIndex({oldfield:1,publicflag:1,privatefield:1});
db.users.ensureIndex({id:1});

//admin password is dmml2012@asu
db.users.insert({"id" : 6, "realname" : "shamanth", "username" : "admin", "password" : "5cba5fff232802f71b13741aa0491c24", "phone" : "4807277808", "email" : "shamanth.kumar@asu.edu", "location" : "tempe", "description" : "i\'m the admin", "exportrights" : 1, "last_login" : 0, "creationtime" : NumberLong("1349284973808"), "logins" : 0, "roleID" : 1 });
//temp user, pass is onronronr
db.users.insert({"id" : 1, "realname" : "DmmlUser", "username" : "dmml", "password" : "ba0df0b2caa9f17a200b3b40b8d4c558", "phone" : "4807277808", "email" : "shamanth.kumar@asu.edu", "location" : "tempe", "description" : "", "exportrights" : 1, "last_login" : 0, "creationtime" : NumberLong("1349284973808"), "logins" : 0, "roleID" : 1 });

db.adminCommand({"shutdown": 1, "timeoutSecs": 0});