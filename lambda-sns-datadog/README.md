## SNS -> Lambda -> Datadog tutorial

### Required

- nodejs
- github repo run inside virtualenv
- [request](https://www.npmjs.com/package/request)
- Datadog API Key and APP key

### How to use

- Setup NPM and working repo
Either init your npm install and setup a dependancy on request or copy package.json
- [request](https://www.npmjs.com/package/request) Install

```sh
% cd yourworkspace
% mkvirtualenv -a $PWD lambda-test
% git clone https://github.com/jerrettlevensalor-wf/lambda-functions.git
% workon lambda-test
% cd lambda-functions/lambda-sns-datadog
% npm install request 
# This creates a local node_modules for use with creating the zip later
```

- Change config.js
The API key and APP key are both required from data dog to be able to push.  Both can be found under integrations -> api links on the data dog interface.  

```javascript
var config = {};

config.api_key = 'your_api_key';
config.app_key = 'your_app_key';

module.exports = config;
```


- Zip the files in to a .zip file to be able to upload to lambda.  

```sh
% zip -r your_function.zip index.js config.js node_modules
# Important 'fileb//', See http://docs.aws.amazon.com/cli/latest/reference/lambda/update-function-code.html.
% aws lambda --region eu-west-1 update-function-code --function-name your_function --zip-file fileb://your_function.zip 
```

### Create Lambda function

```sh
% aws lambda --region eu-west-1 \
  create-function --function-name kinesis-lambda-dd-function\
  | --runtime nodejs\
  | --role arn:aws:iam::xxxxxxxxxx:role/lambda\
  | --handler index.handler\
  | --zip-file fileb://tmp/kinesis-lambda-dd-test/kinesis-lamba-dd-test.zip 
# Important 'fileb//', See http://docs.aws.amazon.com/cli/latest/reference/lambda/update-function-code.html.
% aws lambda --region eu-west-1 update-function-code --function-name your_function --zip-file fileb://your_function.zip
```

output.

```javascript
{
    "CodeSha256": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", 
    "FunctionName": "kinesis-lambda-dd-function", 
    "CodeSize": 936, 
    "MemorySize": 128, 
    "FunctionArn": "arn:aws:lambda:eu-west-1:xxxxxxxxx:function:kinesis-lambda-dd-function", 
    "Version": "$LATEST", 
    "Role": "arn:aws:iam::xxxxxxxxxxxxxx:role/lambda", 
    "Timeout": 3, 
    "LastModified": "2016-02-01T20:04:23.971+0000", 
    "Handler": "index.handler", 
    "Runtime": "nodejs", 
    "Description": ""
}
```

### Create topic

```sh
% aws --region eu-west-1 sns create-topic --name kinesis-lambda-dd-topic-test
```

output.

```javascript
{
  "TopicArn": "arn:aws:sns:eu-west-1:xxxxxxxxxxxxx:kinesis-lambda-dd-topic-test"
}
```

### Create subscribe

```sh
% aws sns --region eu-west-1\ 
  subscribe --topic-arn arn:aws:sns:eu-west-1:xxxxxxxxx:kinesis-lambda-dd-topic-test\
  --protocol lambda\
  --notification-endpoint arn:aws:lambda:eu-west-1:xxxxxxxxxxxxxx:function:kinesis-lambda-dd-function 
```

output.

```javascript
{
    {
    "SubscriptionArn": "arn:aws:sns:eu-west-1:xxxxxxxxxxxxxxx:kinesis-lambda-dd-topic-test:47e83729-3461-4212-8f86-2a4ac83c9cfa"
}
}
```

### Create Message

```sh
% cat << EOT >> message.js
{
  "default": "test",
  "title": "Lambda Message Test",
  "message": "foo bar",
  "url": "http://xxx.example.com/"
}
EOT
```

### Create Event source mapping through the AWS gui. 

- Management console

![2015091902.png](https://qiita-image-store.s3.amazonaws.com/0/87189/b956061d-3fd1-cf1b-8dd1-e48ce87eddd0.png "2015091902.png")

### Publish to topic

```sh
% aws sns --region eu-west-1 publish --topic-arn arn:aws:sns:eu-west-1:xxxxxxxxxxxxxx:kinesis-lambda-dd-topic-test --subject "SNS test with Lambda and Datadog\!\!" --message file:///Users/jerrettlevensalor/Workspace/go_workspace/src/github.com/lambda-test/message.js 
```

output.

```javascript
{
    "MessageId": "18d431ee-dc22-5ab0-a5c2-7f9877071052"
}
```

### Check your Datadog Event Dashboard

![2015091903.png](https://qiita-image-store.s3.amazonaws.com/0/87189/1b83d745-81ad-39e1-653f-8a943aab8cbe.png "2015091903.png")

***
