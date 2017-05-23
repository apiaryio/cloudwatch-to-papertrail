# cloudwatch-to-papertrail
Lambda to send logs from Cloudwatch to Papertrail

## Usage

First, ensure an IAM role exists called `lambda_basic_execution`,
with the `AWSLambdaBasicExecutionRole` policy.

Then create lambda function and streams logs from the specified log group to this function:

```bash
$ export AWS_DEFAULT_REGION=us-east-1
$ export HOST=logs.papertrailapp.com PORT=1234
$ export DATADOG=1234567890abcdef1234567890abcdef12345678
$ APP=helium PROGRAM=lambda LOG_GROUP=/aws/lambda/helium_transform make
```

`DATADOG` setting is optional.  If you only want logging to papertrail, leave `DATADOG` blank.

> NOTE: Datadog API key, not APP key

> NOTE: Metric logs should be in the following format. `2016-08-05T15:20:11.819Z - info: parse: message metric#time=39 metric#tag#valid=1`. The metrics sent will be `helium.lambda.parse.time` with tag `valid:1`

To update existing lambda function:

```bash
$ export HOST=logs.papertrailapp.com PORT=1234
$ export DATADOG=1234567890abcdef1234567890abcdef12345678
$ APP=helium PROGRAM=lambda make deploy
```

To stream another log group to already existing lambda:

```bash
$ export AWS_DEFAULT_REGION=us-east-1
$ APP=helium PROGRAM=lambda LOG_GROUP=/aws/lambda/helium_compose make log
```
