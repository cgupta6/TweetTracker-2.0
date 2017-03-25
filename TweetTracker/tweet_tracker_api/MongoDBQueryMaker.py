from time import time

class MongoDBQueryMaker(object):
    def __init__(self):
        self.orParts = []

    def addGeoboxes(self, longitudeField, latitudeField, geoboxes):
        geoQuery = {}

        processedGeoboxes = []
        for geobox in geoboxes:
            processedGeoboxes.append({
                longitudeField: {
                    "$gte": geobox["lllng"],
                    "$lte": geobox["urlng"]
                },
                latitudeField: {
                    "$gte": geobox["lllat"],
                    "$lte": geobox["urlat"]
                }
            })

        # If there is only one box, we don't want an $or, we want just the object.
        if len(processedGeoboxes) == 1:
            geoQuery = processedGeoboxes[0]
        elif len(processedGeoboxes) > 1:
            geoQuery = {"$or": processedGeoboxes}

        if geoQuery:
            self.orParts.append(geoQuery)

    def addMembershipCondition(self, fieldName, listToCheck):
        if listToCheck:
            self.orParts.append({fieldName: {"$in": listToCheck}})

    def buildQuery(self, categoryIds, start_time, end_time, has_location=False):
        catQueries = []
        for categoryId in categoryIds:
            for index in [0, 1, 2]:
                offset = 333000 * index
                catime = str(categoryId + offset)
                if has_location:
                    catimeRange = {
                        "catime": {
                            "$gte": long(catime + "{0:010d}".format(start_time)),
                            "$lte": long(catime + "{0:010d}".format(end_time))
                        },
                        "hasLocation": True
                    }
                else:
                    catimeRange = {
                        "catime": {
                            "$gte": long(catime + "{0:010d}".format(start_time)),
                            "$lte": long(catime + "{0:010d}".format(end_time))
                        }
                    }

                if self.orParts:
                    catimeRange['$or'] = self.orParts

                catQueries.append(catimeRange)

        return { "$or": catQueries }
