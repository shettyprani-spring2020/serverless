console.log("Invoking Lambda Function");
let AWS = require("aws-sdk");
let dynamodb = new AWS.DynamoDB();

exports.handler = async function(event, context, callback) {
  let message = event.Records[0].Sns.Message;
  const TO = message.email;
  const FROM = "no-reply@" + process.env.domainName;
  const bills = message.bills;
  let db_params = {
    Key: {
      id: { S: TO }
    },
    TableName: "emaildata"
  };
  let result = await dynamodb.getItem(db_params).promise();
  console.log(result);
  let now = Date.now();
  if (result == undefined) {
    const ttl_time = Date.now() / 1000 + 60 * 60;
    const data = {
      TableName: "emaildata",
      Item: {
        id: { S: TO },
        TTL: { N: ttl_time }
      }
    };
    dynamodb.putItem(data, function(err, data) {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("Success", data);
      }
    });
  } else {
    const last_sent = result.Item.TTL;
    if (last_sent >= now) {
      return;
    }
  }

  let email_params = {
    Destination: {
      ToAddresses: [TO]
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data:
            "<html><body><h1>Requested Data for payment due</h1></body></html>"
        },
        Text: {
          Charset: "UTF-8",
          Data: JSON.stringify(bills)
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Bills Due Soon"
      }
    },
    Source: FROM
  };
  let sendPromise = new AWS.SES({ apiVersion: "2010-12-01" })
    .sendEmail(email_params)
    .promise();

  // Handle promise's fulfilled/rejected states
  sendPromise
    .then(function(data) {
      console.log("Success " + data.MessageId);
    })
    .catch(function(err) {
      console.error(err, err.stack);
    });
};
