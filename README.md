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

By default, lambda doesn't wait for the event loop to empty before shutting down the function.
This means logs may not be sent immediately to papertrail, but instead wait for future
invocations.  It's also possible some logs may not get sent to papertrail at all. See
[callbackWaitsForEmptyEventLoop](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html)

To override this behavior, set `WAIT_FOR_FLUSH=true`, i.e.
```bash
$ APP=helium PROGRAM=lambda WAIT_FOR_FLUSH=true make deploy
```

Logs will be sent immediately to papertrail, at the expense of longer lambda execution times.
