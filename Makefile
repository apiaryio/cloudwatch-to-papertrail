APP ?= app_name
LOG_GROUP ?= log_group_name
HOST ?= logs.papertrailapp.com
PORT ?= 1234

all: lambda subscription-filter

deps:
	rm -rf node_modules
	npm install

env:
	rm env.json
	echo "{\"host\": \"$(HOST)\", \"port\": $(PORT), \"appname\": \"$(APP)\"}" > env.json

create-zip:
	rm code.zip
	zip code.zip -r index.js env.json node_modules

lambda: deps env create-zip
	aws lambda create-function --publish \
	--function-name $(APP)-to-papertrail \
	--runtime nodejs \
	--handler index.handler \
	--zip-file fileb://code.zip \
	--role arn:aws:iam::176708046225:role/lambda_basic_execution

deploy: deps env create-zip
	aws lambda update-function-code --publish \
	--function-name $(APP)-to-papertrail \
	--zip-file fileb://code.zip

subscription-filter:
	aws logs put-subscription-filter \
	--log-group-name $(LOG_GROUP) \
	--destination-arn arn:aws:lambda:us-east-1:176708046225:function:$(APP)-to-papertrail \
	--filter-name LambdaStream_$(APP)-to-papertrail \
	--filter-pattern ""

clean:
	rm code.zip env.json

test: env
	docker pull lambci/lambda
	# docker run --name lambda --rm -v $(pwd):/var/task lambci/lambda index.handler '{}'
