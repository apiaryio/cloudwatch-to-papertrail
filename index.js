var zlib = require('zlib');
var winston = require('winston');
var papertrailTransport = require('winston-papertrail').Papertrail;
var dogapi = require('dogapi');
var config = require('./env.json');

function addLambdaMetrics(data, match) {
  var now = dogapi.now();

  data.push({
    metric: 'aws.lambda.billed',
    points: [
      [now, match[1]]
    ]
  });

  data.push({
    metric: 'aws.lambda.maxmemory',
    points: [
      [now, match[2]]
    ]
  });
};

function addAppMetrics(data, match) {
  var now = parseInt((new Date(match[1])).getTime()/1000);

  var tags = [];
  var points = [];

  match[3].split(' ').forEach(function (metric) {
    var keyValue = metric.split('=');

    if (keyValue[0].indexOf('metric#') == -1) {
      return;
    }

    if (keyValue[0].indexOf('metric#tag#') != -1) {
      return tags.push(keyValue[0].replace('metric#tag#', '') + ':' + keyValue[1]);
    }

    points.push({
      metric: [config.appname, config.program, match[2], keyValue[0].replace('metric#', '')].join('.'),
      points: [
        [now, parseInt(keyValue[1])]
      ]
    });
  });

  points.forEach(function (item) {
    item.tags = tags;
    data.push(item);
  });
};

exports.handler = function (event, context, callback) {
  var payload = new Buffer(event.awslogs.data, 'base64');

  zlib.gunzip(payload, function (err, result) {
    if (err) {
      return callback(err);
    }

    dogapi.initialize({
      api_key: config.datadog
    });

    var log = new (winston.Logger)({
      transports: []
    });

    log.add(papertrailTransport, {
      host: config.host,
      port: config.port,
      program: config.program,
      hostname: config.appname,
      flushOnClose: true,
      logFormat: function (level, message) {
        return message;
      }
    });

    var data = JSON.parse(result.toString('utf8'));

    var metricRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)\ -\ info:\ ([a-z]+):.*?(metric#.*)+$/;
    var reportRegex = /^REPORT\ RequestId.*Billed\ Duration:\ ([0-9]+)\ ms.*Used:\ ([0-9]+)\ MB$/;

    var metricPoints = [];
    var reportPoints = [];

    data.logEvents.forEach(function (line) {
      log.info(line.message);

      if (config.datadog !== '') {
        var metricMatch = line.message.trim().match(metricRegex);

        if (metricMatch != null) {
          return addAppMetrics(metricPoints, metricMatch);
        }

        var reportMatch = line.message.trim().match(reportRegex);

        if (reportMatch != null) {
          return addLambdaMetrics(reportPoints, reportMatch);
        }
      }
    });

    if (config.datadog === '') {
      return log.close();
    }

    dogapi.metric.send_all(metricPoints, function () {
      dogapi.metric.send_all(reportPoints, function () {
        log.close();
      });
    });
  });
};
