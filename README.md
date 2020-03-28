# WebApp

AWS Lambda script to send an email when an endpoint is hit

## Installation Details

### Locally

**Install Node**

```javascript
sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash -
sudo apt-get install nodejs
```

**Check NodeJs and npm version**

```javascript
node - v;
```

npm

```javascript
npm - v;
```

**Install all package dependencies**

```javascript
npm i
```

**Configure AWS and Zip the files**

```javascript
zip -r lambda.zip node_modules/ index.js
```

**Update the AWS lambda function**

```javascript
aws lambda update-function-code --region=${AWS_REGION} --function-name=${LAMBDA_FUNCTION}  --zip-file fileb://lambda.zip
```
