import kinesis

STREAM_NAME = 'awesome_data_stream'
MINUTES_RUNNING = 60

# Get Kinesis generator
kinesis_data = kinesis.get_kinesis_data_iterator(STREAM_NAME, MINUTES_RUNNING)

# Iterate over records
for data in kinesis_data:
	    # Do something crazy with your data
	        pass
