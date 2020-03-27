console.log("Invoking Lambda Function");

exports.handler = function(event, context, callback) {
  let message = event.Records[0].Sns.Message;
  console.log("Message received from SNS:", message);
  callback(null, "Success");
};
