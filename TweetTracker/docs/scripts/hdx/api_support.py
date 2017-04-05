import dicttoxml
import json
from bson import json_util
from flask import abort, jsonify, Response, make_response
import gridfs
import mimetypes
#from xlsxlsxformat import *

hdx = None
ram_hdx = None
fs = None
fs_metadata = None

def setup(collection, ram_collection):
    """ This function allows server.py to set up the collection.

    :param collection: The MongoDB collection object to get datasets from.
    """
    global hdx
    global ram_hdx
    global fs
    global fs_metadata
    hdx = collection.hdx_datasets
    ram_hdx = ram_collection.hdx_datasets
    fs_metadata = collection.fs.files
    fs = gridfs.GridFS(collection)


#DEPRECATED. Test method used to see if we were able to successfully get a response from the database.
def get_dataset(index, response_type="JSON"):
    """ This function retrieves a single tweet and creates a response for it.

    :param index: Index of data set
    :param response_type: The encoding format for the results of the request.
    :return: Either an error code or a JSON response containing the tweet.
    """

    # hdx is the hdx_datasets collection in mongoDB
    result = hdx.find_one({
        "name": "Guinea health facility training activities"
    })

    response_object = {
        "dataset": result
    }
    del response_object["dataset"]["_id"]
    if response_type == "xml" or response_type == "XML":
        return Response(dicttoxml.dicttoxml(response_object), mimetype="application/xml")
    elif response_type == "JSON" or response_type == "json":
        return jsonify(response_object)
    else:
        abort(400)


def get_hdx_datasets_for_country(country, response_type="JSON"):
    """ This function retrieves a single tweet and creates a response for it.

    :param country: The country datasets belong to
    :param response_type: The encoding format for the results of the request.
    :return: Either an error code or a JSON response containing the tweet.
    """

    # If the value for country is "All" then we display all datasets
    if (country == "All"):
        result = hdx.find()
    # If the value for country is a specific country, then we only grab datasets belonging to that country
    else:
        result = hdx.find({"countries": country})

    json_docs = []
    for doc in result:
        json_string = json.dumps(doc, default=json_util.default)
        json_doc = json.loads(json_string)
        json_docs.append(json_doc)

    datasets = {
        "datasets": json_docs
    }

    if response_type == "JSON" or response_type == "json":
        return jsonify(datasets)
    else:
        abort(400)

def get_file(filename):
    """
    
    :param filename: file name
    :return: response
    """
    file = fs.get_last_version(filename=filename)
    if file:
        metadata = file.metadata
        response = make_response(file.read())

        extension = metadata['extension']
        print 'Extension before any action is taken is ' + extension
        extension_changed = False
        if '.html' in extension:
            print 'File extension is .html so checking to see if that is the proper extension'
            extension_changed = True
            print 'Mimetype is ' + metadata['mimetype']
            extension = mimetypes.guess_extension(metadata['mimetype'])
            print "new extension is " + extension
            if not extension:
                extension = '.html'

        response.headers['Content-Type'] = metadata['mimetype']

        if extension_changed is False:
            print 'File extension unchanged'
            response.headers['Content-Disposition'] = 'attachment; filename=' + filename
        else:
            print 'File extension changed'
            response.headers['Content-Disposition'] = 'attachment; filename=' + str(filename).split('.')[0] + extension

        return response
    else:
        abort(404)
        return "Error"

def get_file_extension(filename):
    """
    
    :param filename: file name
    :return: extention
    """
    file = fs_metadata.find_one({"filename":filename}, projection={"metadata":True})
    if file:
        extension = file['metadata']['extension']
        if '.html' in extension:
            extension = mimetypes.guess_extension(file['metadata']['mimetype'])
            if extension:
                return extension
            else:
                return '.html'
        else:
            return extension
    else:
        return 'no file'
