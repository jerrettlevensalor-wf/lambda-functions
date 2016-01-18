from __future__ import print_function

import base64
import json
import time
import boto3

print('Loading function')

bucket="harbour-wk-dev-east-logs"
s3 = boto3.client('s3')

def lambda_handler(event, context):
    logfile="logs-%s.txt" % time.time()
    out = []
    for record in event['Records']:
        # Kinesis data is base64 encoded so decode here
        payload = base64.b64decode(record['kinesis']['data'])
        out.append(payload)

    s3.put_object(
        Bucket=bucket,
        Key=logfile,
        Body="\n".join(out),
    )
    return "Wrote <%d> log entries to <%s>" % (len(out), logfile)
