import string
import cPickle as pickle
import codecs
from gensim import corpora
from twokenize import tokenize
import time
import pymongo
from pymongo import MongoClient

__author__ = 'Tahora H. Nazer'

uri = "localhost:27017"
client = MongoClient(uri)
db = client['tweettracker']
#db.authenticate('twtuser', '!!!asudmml%%%')

new_db = client['ttsideprojects']
#new_db.authenticate('twtuser', '!!!asudmml%%%')


def find_jobs_bot_prob(job_ids, classifier, lda1):
    """

    :param job_ids: job ids
    :param classifier: classifier
    :param lda1: lda
    :return: bots
    """
    if job_ids is None:
        return (False, 'No Category IDs Found.')

    if classifier is None:
        return (False, 'Random Forest classifier cannot be found')

    if lda1 is None:
        return (False, 'LDA classifier cannot be found')

    # Dictionary retrieved
    fin = codecs.open(
        'tweet_tracker_api//bot_detection_files//vocab_new.txt', 'r', encoding='utf-8')
    texts = fin.readlines()
    texts = [[x.strip().encode('unicode-escape') for x in texts]]
    dictionary = corpora.Dictionary(texts)
    collection = db['tweets']
    collection_userlabels = new_db['userlabels']
    # For each user, concatenate its tweets and classify it as human/bot
    stopfile = codecs.open("stopwords.txt", encoding='utf-8')
    stoplist = list()
    for line in stopfile:
        stoplist.extend(line.rstrip('\r\n').split(','))
    stoplist.append('d')
    stoplist.append('rt')
    remove_punc = dict((ord(char), None) for char in string.punctuation)

    result = list()
    for job_id in job_ids:
        # print '***', job_id
        result.extend(find_bot_prob(
            job_id, collection, collection_userlabels, dictionary, classifier, lda1, remove_punc, stoplist))

    result = sorted(result, key=lambda k: k['bot_prob'], reverse=True)

    returnObject = {
        'bots': result
    }
    return (True, returnObject)


def find_bot_prob(job_id, collection, collection_userlabels, dictionary, classifier, lda, punctuations, stop_word_list):

    """
    # Check whether the data is recent enough, we retrieve the probability from
    # database.

    :param job_id: job id
    :param collection: collection
    :param collection_userlabels: user labels 
    :param dictionary: dictionary
    :param classifier: classifier
    :param lda: lda
    :param punctuations: punctuations
    :param stop_word_list: stop word list
    :return: bots
    """
    pattern = '%Y-%m-%d'
    curr_date = time.strftime('%Y-%m-%d', time.localtime(int(time.time())))
    curr_date_epoch = int(time.mktime(time.strptime(curr_date, pattern)))
    time_two_days_ago = curr_date_epoch - (2 * 24 * 60 * 60)

    result = list()
    if collection_userlabels.find({'cat': job_id, 'time': {'$gte': time_two_days_ago}}).count() > 0:
        print 'Found data from collection'
        for docs in collection_userlabels.find({'cat': job_id, 'time': {'$gte': time_two_days_ago}}):
            x = dict()
            x['user_id'] = docs['user_id']
            x['user_name'] = docs['user_name']
            x['bot_prob'] = docs['bot_prob'] * 100
            result.append(x)
        return result

    start_time = time.time()
    top_users = find_top_users(job_id)


    start_time = time.time()
    result = list()
    for user in top_users:
        tweets_concat = ""
        catimes = user['catime']
        for catime in catimes:
            if collection.count({'catime': long(catime)}) > 0:
                tweets_concat += " " + \
                                 collection.find({'catime': catime})[0][
                                     'text'].strip().encode('unicode-escape')
        tweets_concat = tweets_concat.decode(encoding='utf-8').lower()
        tweets_concat = tweets_concat.translate(punctuations)
        tokens = [word for word in tokenize(tweets_concat)
                  if word not in stop_word_list and 'http' not in word]
        tokens = dictionary.doc2bow(tokens)
        doclda = lda.inference([tokens])
        ypred = classifier.predict_proba(doclda[0][0])
        # userID, probability of being a human, probability of being a bot
        x = dict()
        x['user_id'] = user['user_id']
        x['user_name'] = user['user_name']
        x['bot_prob'] = round(ypred[0][1], 3) * 100
        result.append(x)

        collection_userlabels.insert(
            {
                'user_id':user['user_id'],
                'user_name':user['user_name'],
                'time':curr_date_epoch,
                'cat':job_id,
                'method':'lda',
                'bot_prob': round(ypred[0][1], 3)
            }
        )

    print 'Processing 50 users requires ' + str(time.time() - start_time) + ' seconds!'
    return result


def find_top_users(job_id):
    """

    :param job_id: job id
    :return: top users
    """
    db = client['ttsideprojects']
    #db.authenticate('twtuser', '!!!asudmml%%%')
    collection = db['botuserlabels']
    top_users = list()
    for doc in collection.find({'cat': job_id}).sort('num_of_tweets', pymongo.DESCENDING).limit(50):
        top_users.append(doc)
    return top_users

# if __name__ == '__main__':
#    print find_jobs_bot_prob([626])
