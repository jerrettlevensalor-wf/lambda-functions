from datetime import datetime, timedelta
import json

import boto

def get_kinesis_data_iterator(stream_name, minutes_running):
    # Connect to Kinesis
    kinesis = boto.connect_kinesis()
    # Get data about Kinesis stream for Tag Monitor
    kinesis_stream = kinesis.describe_stream(stream_name)
    # Get the shards in that stream
    shards = kinesis_stream['StreamDescription']['Shards']
    # Collect together the shard IDs
    shard_ids = [shard['ShardId'] for shard in shards]
    # Get shard iterator
    iter_response = kinesis.get_shard_iterator(stream_name, shard_ids[0], "TRIM_HORIZON")
    shard_iterator = iter_response['ShardIterator']

    # Calculate end time
    end_time = datetime.now() + timedelta(minutes=minutes_running)
    while True:
        try:
            # Get data
            record_response = kinesis.get_records(shard_iterator)
            # Only run for a certain amount of time.
            # Stop looping if no data returned. This means it's done
            now = datetime.now()
            print 'Time: {0}'.format(now.strftime('%Y/%m/%d %H:%M:%S'))
            if end_time < now or not record_response:
                break
            # yield data to outside calling iterator
            for record in record_response['Records']:
                last_sequence = record['SequenceNumber']
                yield json.loads(record['Data'])
            # Get next iterator for shard from previous request
            shard_iterator = record_response['NextShardIterator']
        # Catch exception meaning hitting API too much
        except boto.kinesis.exceptions.ProvisionedThroughputExceededException:
            print 'ProvisionedThroughputExceededException found. Sleeping for 0.5 seconds...'
            time.sleep(0.5)
        # Catch exception meaning iterator has expired
        except boto.kinesis.exceptions.ExpiredIteratorException:
            iter_response = kinesis.get_shard_iterator(stream_name, shard_ids[0], "AFTER_SEQUENCE_NUMBER", last_sequence)
            shard_iterator = iter_response['ShardIterator']

    kinesis.close()
