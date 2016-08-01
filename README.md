# cloudwatch-to-papertrail
Lambda to send logs from Cloudwatch to Papertrail

## Usage

Create lambda function and streams logs from the specified log group to this function:

```bash
$ export AWS_DEFAULT_REGION=us-east-1
$ APP=helium PROGRAM=lambda HOST=logs.papertrailapp.com PORT=1234 LOG_GROUP=/aws/lambda/helium_transform make
```

To update existing lambda function:

```bash
$ APP=helium PROGRAM=lambda HOST=logs.papertrailapp.com PORT=1234 make deploy
```

To stream another log group to already existing lambda:

```bash
$ APP=helium PROGRAM=lambda LOG_GROUP=/aws/lambda/helium_compose make log
```
