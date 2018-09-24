#!/usr/bin/python
import md5
import urllib2
import time
import hashlib
import os
import sys
import optparse
import re
import json

parser = optparse.OptionParser(usage="%prog [options]. %prog -h for help.")
parser.add_option("-f", "--file", dest="fileName", help="Localized file name", metavar="FILE")
parser.add_option("-l", "--locale", dest="locale", help="Translation locale (two-character)", metavar="LOCALE")
parser.add_option("-o", "--output", dest="output", help="Output file name", metavar="FILE")
(options, args) = parser.parse_args(sys.argv)

# Get oneskyapp settings
oneskyapp = {};
with open('./private/oneskyapp.json') as json_data:
    oneskyapp = json.load(json_data)

# Check oneskyapp settigns
if (not oneskyapp["projectId"]):
    parser.error('Project ID not given')
if (not oneskyapp["apiKey"]):
    parser.error('API public key not given')
if (not oneskyapp["secretKey"]):
    parser.error('API secret key not given')

if (not options.fileName):
    parser.error('File name not given')
if (not options.locale):
    parser.error('Locale not given')
if (not options.output):
    parser.error('Output file name not given')

timestamp = str(int(time.time()))
devHash = md5.new(timestamp + oneskyapp["secretKey"].encode()).hexdigest()

url = oneskyapp["url"]
url += oneskyapp["projectId"].encode()
url += "/translations?locale="
url += options.locale
url += "&source_file_name="
url += options.fileName
url += "&export_file_name="
url += options.output
url += "&api_key="
url += oneskyapp["apiKey"].encode()
url += "&timestamp="
url += timestamp
url += "&dev_hash="
url += devHash

def downloadFile(url):
    print "Downloading " + options.fileName + "/" + options.locale + " from Oneskyapp"
    response = urllib2.urlopen(url)
    responseHtml = response.read()
    return responseHtml

# Sometimes html files download contains garbage in the end
def removeGarbage(html):
    return re.sub('\{"code":500.*$', '', html)

responseHtml = downloadFile(url)
responseHtml = removeGarbage(responseHtml).strip()

with open(options.output, "wb") as localFile:
    localFile.write(responseHtml)

print "File has been successfully downloaded to " + options.output