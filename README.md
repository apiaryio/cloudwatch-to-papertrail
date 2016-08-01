# cloudwatch-to-papertrail
Lambda to send logs from Cloudwatch to Papertrail

## Usage

1. Set region

```bash
$ export AWS_DEFAULT_REGION=us-east-1
```

2. Create lambda

```bash
$ APP=helium HOST=logs.papertrailapp.com PORT=1234 make lambda # creates helium-to-papertrail
```

3. Stream logs to above lambda

```bash
$ APP=helium LOG_GROUP=/aws/lambda/helium_transform make log
```
