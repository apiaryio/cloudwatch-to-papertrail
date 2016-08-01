var zlib = require('zlib');
var winston = require('winston');
var papertrailTransport = require('winston-papertrail').Papertrail;
var config = require('env.json');

exports.handler = function (event, context, callback) {
  var payload = new Buffer(event.awslogs.data, 'base64');

  zlib.gunzip(payload, function (err, result) {
    if (err) {
      return callback(err);
    }

    var log = new (winston.Logger)({
      transports: []
    });

    log.add(papertrailTransport, {
      host: config.host,
      port: config.port,
      program: config.program,
      hostname: config.appname,
      flushOnClose: true,
      messageFormat: function (level, message, meta) {
        return message;
      }
    });

    var data = JSON.parse(result.toString('utf8'));

    data.logEvents.forEach(function (line) {
      log.info(line.message);
    });

    log.close();
  });
};
