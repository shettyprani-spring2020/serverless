let AWS = require("aws-sdk");
let dynamodb = new AWS.DynamoDB();

formatEmail = function(bills) {
  let result =
    '<table class="table table-bordered table-hover table-condensed">' +
    "<thead><tr>" +
    "<th>id</th>" +
    "<th>created_ts</th>" +
    "<th>updated_ts</th>" +
    "<th>vendor</th>" +
    "<th>bill_date</th>" +
    "<th>due_date</th>" +
    "<th>amount_due</th>" +
    "<th>categories</th>" +
    "<th>paymentStatus</th>" +
    "<th>createdAt</th>" +
    "<th>updatedAt</th>" +
    "<th>owner_id</th>" +
    "<th>file</th>" +
    "</tr></thead>" +
    "<tbody>";
  for (let bill of bills) {
    result += "<tr>";
    for (let prop in bill) {
      result += "<td>" + object[prop] + "</td>";
    }
    result += "</tr>";
  }
  result += "</tbody></table>";
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
  let now = Date.now();
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
    const last_sent = result.Item.TTL;
    console.log("Item exists!");
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
            "<html><body><h1>Requested Data for payment due</h1>" +
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
