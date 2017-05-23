
from flask import abort, jsonify, redirect, session, url_for
from user import authenticate, authenticate_classic, create, update_last_logintime, get_by_username, updateUser, \
    deleteUser
import pymongo
import ujson as json


def login_classic(username, password, web=None):
    """
    :param username: username
    :param password: password
    :param web: Indicates if logging in from API or website
    :return: login success
    """
    auth = authenticate_classic(username, password)
    if auth is None:
        # User does not exist
        abort(403)
    elif not auth:
        # Incorrect password
        abort(403)
    else:
        session['authenticated'] = True
        session['username'] = username

        print update_last_logintime(username)

        if web is not None:
            return redirect(url_for('overview'))
        else:
            return jsonify({'login': 'success'})


def login(email, password):
    """ This function handles the login of an email/password pair.

    As of now, we aren't sure how auth is being implemented. So this is just a
    dummy stub that redirects to the login page.

    :param email: The email address of the user to login as
    :param password: The password for the specified user
    :return: A redirect to a page that indicates success/failure as needed
    """
    user = authenticate(email, password)
    if user is None or not user:
        # TODO: Change this to an error page
        return redirect(url_for('login_page'))
    else:
        # TODO: Change this to contain a cookie with the auth key or whatever
        session['username'] = email
        return redirect(url_for('login_page'))


def register(email, password, firstname, lastname, phone, account, timezone):
    """ This function registers a new user with the specified email/password.

    :param email: The email to use for registration
    :param password: The password to use for the user
    :return: A redirect to a page that indicates success/failure as needed
    """
    # first check recaptcha
    import requests

    user = create(email, password, firstname, lastname, phone, account, timezone)
    if user is None:
        print 'Returning to register'
        # TODO: Change this to an error page
        return json.dumps({'result': 'failed'})
    else:
        print 'returning to login'
        # TODO: Change this to contain a cookie with the auth key or whatever
        session['username'] = email
        return json.dumps({'result': 'success'})


def update_user(username, email, password, firstname, lastname, phone, account, timezone):
    """ This function registers a new user with the specified email/password.

    :param email: The email to use for registration
    :param password: The password to use for the user
    :return: A redirect to a page that indicates success/failure as needed
    """
    # first check recaptcha
    import requests

    user = updateUser(username, email, password, firstname, lastname, phone, account, timezone)
    if user is None:
        # TODO: Change this to an error page
        return json.dumps({'result': 'failed'})
    else:
        session['username'] = email
        return json.dumps({'result': 'success'})


def delete_user(username, email):
    """ This function registers a new user with the specified email/password.

    :param email: The email to use for registration
    :param password: The password to use for the user
    :return: A redirect to a page that indicates success/failure as needed
    """
    # first check recaptcha
    import requests


    user = deleteUser(username)
    #user = None
    if user is None:
        # TODO: Change this to an error page
        return json.dumps({'result': 'failed'})
    else:
        session.clear()
        return  json.dumps({'result': 'success'})


def get_profile(username):
    my_profile = get_by_username(username)

    # If the job does not exist, return a 400
    if my_profile is None:
        abort(400)
    returnObj = {
            "firstname": my_profile["firstname"],
            "lastname": my_profile["lastname"],
            "email":my_profile["email"],
            "phone":my_profile["phone"],
            "account":my_profile["account"]
    }
    return jsonify(returnObj)