APP ?= app_name
PROGRAM ?= default
LOG_GROUP ?= log_group_name
HOST ?= logs.papertrailapp.com
PORT ?= 1234

ALNUM_LOG_GROUP = $(shell echo $(LOG_GROUP) | sed 's/[^[:alnum:]]/_/g')

all: lambda log

deps:
	rm -rf node_modules
	npm install

env:
	rm env.json
	echo "{\"host\": \"$(HOST)\", \"port\": $(PORT), \"appname\": \"$(APP)\", \"program\": \"$(PROGRAM)\"}" > env.json

create-zip:
	rm code.zip
	zip code.zip -r index.js env.json node_modules

lambda: deps env create-zip
	aws lambda create-function --publish \
	--function-name $(APP)-$(PROGRAM)-to-papertrail \
	--runtime nodejs \
	--handler index.handler \
	--zip-file fileb://code.zip \
	--role arn:aws:iam::176708046225:role/lambda_basic_execution

deploy: deps env create-zip
	aws lambda update-function-code --publish \
	--function-name $(APP)-$(PROGRAM)-to-papertrail \
	--zip-file fileb://code.zip

log:
	aws lambda add-permission \
	--function-name $(APP)-$(PROGRAM)-to-papertrail \
	--statement-id $(ALNUM_LOG_GROUP)__$(APP)-$(PROGRAM)-to-papertrail \
	--principal logs.$(AWS_DEFAULT_REGION).amazonaws.com \
	--action lambda:InvokeFunction \
	--source-arn arn:aws:logs:$(AWS_DEFAULT_REGION):176708046225:log-group:$(LOG_GROUP):* \
	--source-account 176708046225

	aws logs put-subscription-filter \
	--log-group-name $(LOG_GROUP) \
	--destination-arn arn:aws:lambda:$(AWS_DEFAULT_REGION):176708046225:function:$(APP)-$(PROGRAM)-to-papertrail \
	--filter-name LambdaStream_$(APP)-$(PROGRAM)-to-papertrail \
	--filter-pattern ""

clean:
	rm code.zip env.json

test: env
	docker pull lambci/lambda
	# docker run --name lambda --rm -v $(pwd):/var/task lambci/lambda index.handler '{}'
