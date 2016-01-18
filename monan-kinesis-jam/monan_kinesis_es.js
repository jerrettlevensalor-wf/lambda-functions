/*
 * Sample node.js code for AWS Lambda to upload the JSON documents
 * pushed from Kinesis to Amazon Elasticsearch.
 *
 *
 * Copyright 2015- Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at http://aws.amazon.com/asl/
 * or in the "license" file accompanying this file.  This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * express or implied.  See the License for the specific language governing
 * permissions and limitations under the License.
 */

/* == Imports == */
var AWS = require('aws-sdk');
var path = require('path');

/* == Globals == */
var esDomain = {
    region: 'us-east-1',
    endpoint: 'search-monan-jam-3prulpy2y5cw43uqkqdunqeiiq.us-east-1.es.amazonaws.com',
    index: 'monan-jam-index',
    doctype: 'mytype'
};
var endpoint = new AWS.Endpoint(esDomain.endpoint);
/*
 * The AWS credentials are picked up from the environment.
 * They belong to the IAM role assigned to the Lambda function.
 * Since the ES requests are signed using these credentials,
 * make sure to apply a policy that allows ES domain operations
 * to the role.
 */
var creds = new AWS.EnvironmentCredentials('AWS');


/* Lambda "main": Execution begins here */
exports.handler = function(event, context) {
    console.log(JSON.stringify(event, null, '  '));
    var count = 0;
    jsonDocs = "";
    event.Records.forEach(function(record) {
        count = count + 1;
        var jsonDoc = new Buffer(record.kinesis.data, 'base64');
        var header = {
            "index":{
                "_index": esDomain.index,
                "_type": esDomain.mytype,
                // "_id": record.eventTime + "-" + record.requestID
            }
        };
        jsonDocs += JSON.stringify(header) + "\n";
        jsonDocs += jsonDoc.toString('ascii') + "\n";
        // console.log(jsonDoc.toString('ascii'));
        // json_object = JSON.parse(jsonDoc.toString('ascii'));
        // element = json_object[0];
        // element_string = JSON.stringify(element, null, '  ');
        // console.log(element_string);
        // postToES(element_string, context);
        // postToES(jsonDoc.toString('ascii'), context);
    });
    postToESBulk(jsonDocs, context);
    console.log("MONAN-LOG Processed " + count + " records");
}

/*
 * Post the given document to Elasticsearch
 */
function postToESBulk(doc, context) {
    var req = new AWS.HttpRequest(endpoint);
    console.log("MONAN-LOG Posting to ES");

    req.method = 'POST';
    req.path = path.join('/', esDomain.index, esDomain.doctype, '_bulk');
    req.region = esDomain.region;
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;
    req.body = doc;

    var signer = new AWS.Signers.V4(req , 'es');  // es: service code
    signer.addAuthorization(creds, new Date());

    var send = new AWS.NodeHttpClient();
    send.handleRequest(req, null, function(httpResp) {
        console.log("MONAN-LOG ES PostResponseStatusCode: " + httpResp.statusCode);
        var respBody = '';
        httpResp.on('data', function (chunk) {
            respBody += chunk;
        });
        httpResp.on('end', function (chunk) {
            console.log('Response: ' + respBody);
            context.succeed('Lambda added document ' + doc);
        });
    }, function(err) {
        console.log('Error: ' + err);
        context.fail('Lambda failed with error ' + err);
    });
}

/*
 * Post the given document to Elasticsearch
 */
function postToES(doc, context) {
    var req = new AWS.HttpRequest(endpoint);
    console.log("MONAN-LOG Posting to ES");

    req.method = 'POST';
    req.path = path.join('/', esDomain.index, esDomain.doctype);
    req.region = esDomain.region;
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;
    req.body = doc;

    var signer = new AWS.Signers.V4(req , 'es');  // es: service code
    signer.addAuthorization(creds, new Date());

    var send = new AWS.NodeHttpClient();
    send.handleRequest(req, null, function(httpResp) {
        console.log("MONAN-LOG ES PostResponseStatusCode: " + httpResp.statusCode);
        var respBody = '';
        httpResp.on('data', function (chunk) {
            respBody += chunk;
        });
        httpResp.on('end', function (chunk) {
            console.log('Response: ' + respBody);
            context.succeed('Lambda added document ' + doc);
        });
    }, function(err) {
        console.log('Error: ' + err);
        context.fail('Lambda failed with error ' + err);
    });
}


// The following code is the bootstrap code.
// console.log('Loading function');

// exports.handler = function(event, context) {
//     //console.log('Received event:', JSON.stringify(event, null, 2));
//     event.Records.forEach(function(record) {
//         // Kinesis data is base64 encoded so decode here
//         var payload = new Buffer(record.kinesis.data, 'base64').toString('ascii');
//         console.log('Decoded payload:', payload);
//     });
//     context.succeed("Successfully processed " + event.Records.length + " records.");
// };
