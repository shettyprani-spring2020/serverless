let AWS = require("aws-sdk");
let dynamodb = new AWS.DynamoDB();

formatEmail = function(bills) {
  let result = "<ol>";
  for (let bill of bills) {
    result += "<li>" + bill + "</li>";
  }
  result += "</ol>";
  return result;
};

exports.handler = async function(event, context, callback) {
  console.log("Invoking Lambda Function");
  let message = event.Records[0].Sns.Message;
  message = JSON.parse(message);
  const TO = message.email;
  const FROM = "no-reply@" + process.env.domain_name;
  const bills = message.bills;
  let db_params = {
    Key: {
      id: { S: TO }
    },
    TableName: "emaildata"
  };
  let result = await dynamodb.getItem(db_params).promise();
  console.log(result);
  let now = Date.now() / 1000;
  if (Object.keys(result).length === 0) {
    const ttl_time = Date.now() / 1000 + 60 * 60;
    const db_data = {
      TableName: "emaildata",
      Item: {
        id: { S: TO },
        TTL: { N: ttl_time.toString() }
      }
    };
    result = await dynamodb.putItem(db_data).promise();
  } else {
    const last_sent = parseInt(result.Item.TTL.N);
    if (last_sent >= now) {
      console.log("Email sent within the last 1 hour! \nNot resending!");
      return;
    }
  }
  console.log("Sending email from " + FROM + " TO: " + TO);
  let email_params = {
    Destination: {
      ToAddresses: [TO]
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data:
            "<html><body><h1>Requested data for bills payment due</h1>" +
            formatEmail(bills) +
            "</body></html>"
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Bills Due Soon"
      }
    },
    Source: FROM
  };
  let sendPromise = await new AWS.SES({ apiVersion: "2010-12-01" })
    .sendEmail(email_params)
    .promise();
};
