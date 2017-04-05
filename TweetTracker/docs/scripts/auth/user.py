__author__ = 'Grant Marshall'

import hashlib
from pwd_context import pwd_context
import time

users = None


def setup(collection):
    """ This function allows server.py to pass in a reference to the collection.

    :param collection: The MongoDB collection object.
    """
    global users
    users = collection


def authenticate_classic(username, password):
    """

    :param username:
    :param password:
    :return:
    """
    user = find_by_username(username)
    if user is None:
        return None
    md5_hash = hashlib.md5(password).hexdigest()
    if md5_hash == user['password']:
        return True
    else:
        return False


def authenticate(email, password):
    """ This function authenticates that the password matches the user.

    This authentication works by using passlib's verify function.

    :param email: The email of the user to authenticate
    :param password: The password we are checking
    :return: None if the user doesn't exist. Otherwise, a bool for success
    """
    user = find_by_email(email)
    if user is None:
        return None
    return pwd_context.verify(password, user['hash'])


def create(email, password):
    """ This function creates a new user if possible.

    First, we check if there is a user that exists with the provided email.
    Otherwise, we encrypt the password with passlib and
    store the result as the 'hash' property in the new user profile. Most of
    the properties of the User object are random junk left over from old
    TweetTracker.

    :param email: The email of the new user
    :param password: The password to use for the new user
    :return: The new user's Object_Id or None if failure
    """
    # We REALLY shouldn't be using MD5.
    md5_hash = hashlib.md5(password).hexdigest()
    hashed_password = pwd_context.encrypt(password)

    old_user = users.find_one({'roleID': {'$exists': True}, 'username': email})
    if old_user is not None:
        # Worst security flaw ever
        # users.update({'email': email}, {
        #     '$unset': {
        #         'roleID': ''
        #     },
        #     'password': md5_hash,
        #     'hash': hashed_password
        # })

        # instead of allowing people to hijack accounts, return an error if the usor already exists
        return None
    else:
        # choose the next available user ID
        from pymongo import DESCENDING

        next_id = -99

        maxuser = list(users.find({}, {"id": 1}).sort("id", DESCENDING).limit(1))
        if len(maxuser) > 0:
            next_id = maxuser[0]['id'] + 1
        else:
            next_id = 1

        try:
            user_obj = {
            "creationtime": int(time.time()) * 1000,
            "last_login": int(time.time()) * 1000,
            "username": email,
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
            "numoftweets": 50000
            }
        except Exception as e:
            print e
        return users.insert(user_obj)

def update_last_logintime(username):
    """

    Update user's current login time

    :param username: take username as argument
    :return modified_count : The number of document modified
    """
    result = users.update_one({'username' : username},{'$set':{'last_login' : int(round(time.time() * 1000))}})
    return result.modified_count


def find_by_username(username):
    """

    :param username:username
    :return:username
    """
    return users.find_one({'username': username})


def find_by_email(email):
    """ This function returns the User from MongoDB for the given email

    :param email: The email of the user to look up
    :return: The user's object
    """
    return users.find_one({'email': email})


def email_to_id(email):
    """ This function returns the user ID from MongoDB for a given email.

    :param email: The email to lookup
    :return: The ID of the user or None
    """
    return users.find_one({'email': email})['_id']


def username_to_id(username):
    """

    :param username: username
    :return: id
    """
    id = users.find_one({'username': username})
    if id is None:
        return None
    else:
        return int(id.get('id'))  # Sometimes pymongo returns floats...


def next_user_id():
    """ This function gets the next id for a future user.

    :return: The integer representing the new id.
    """
    most_recent_user = users.find().sort("id", -1)[0]
    if most_recent_user is None:
        return 1
    else:
        return most_recent_user["id"] + 1
