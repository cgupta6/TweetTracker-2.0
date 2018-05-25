# input is a string list of floats
# example input: ["-125.0011,24.9493,-66.9326,49.5904", ...]
def formatGeoboxes(listOfGeoboxes):
    """
    
    :param listOfGeoboxes: geobox data
    :return: formatted geoboxes
    """
    formattedGeoboxes = []
    for geoboxString in listOfGeoboxes:
        corners = geoboxString.split(",")
        numOfCorners = len(corners)
        if numOfCorners == 0 or numOfCorners > 4:
            return {
                'success': False,
                'message': 'Geobox argument must contain a number of parameters divisible by 4.'
            }

        try:
            corners = map(float, corners)
        except:
            return {
                'success': False,
                'message': 'Geobox argument must contain reals.'
            }

        (lllng, lllat, urlng, urlat) = corners
        formattedGeoboxes.append({
            "lllng": lllng,
            "lllat": lllat,
            "urlng": urlng,
            "urlat": urlat
        })
        return {
            'success': True,
            'message': formattedGeoboxes
        }
