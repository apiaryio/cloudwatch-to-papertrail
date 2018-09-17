const { promisify } = require('util');
const { gzipSync } = require('zlib');
const { expect } = require('chai');
const index = require('../index');

const handler = promisify(index.handler);

describe('data dog', function () {
  let metrics;
  let reportPoints;

  before(function () {
    metrics = [];
    reportPoints = [];

    index.dogapi.metric.send_all = function (_metrics, callback) {
      if (metrics.length > 0) {
        reportPoints = _metrics;
      } else {
        metrics = _metrics;
      }
      callback();
    }
  });

  afterEach(function() {
    metrics = [];
    reportPoints = [];
  });

  it('sends metrics to datadog', async function () {
    const event = {
      awslogs: {
        data: gzipSync(JSON.stringify({
          logEvents: [
            {
              message: '2018-06-29T12:30:00.000Z - info: helium: metric#valid=1'
            }
          ]
        })).toString('base64')
      }
    }

    await handler(event, {});

    expect(metrics).to.deep.equal([
      {
        metric: 'app_name.default.helium.valid',
        points: [[1530275400, 1]],
        tags: []
      }
    ]);
  });

  it('sends metrics to datadog with dashes in name', async function () {
    const event = {
      awslogs: {
        data: gzipSync(JSON.stringify({
          logEvents: [
            {
              message: '2018-09-17T10:31:08.433Z - info: content-encoding: metric#unencoded_size=49227 metric#encoded_size=3544 metric#tag#encoding=gzip'
            }
          ]
        })).toString('base64')
      }
    }

    await handler(event, {});

    expect(metrics).to.deep.equal([
      {
        metric: 'app_name.default.content-encoding.unencoded_size',
        points: [[1537180268, 49227]],
        tags: ['encoding:gzip']
      },
      {
        metric: 'app_name.default.content-encoding.encoded_size',
        points: [[1537180268, 3544]],
        tags: ['encoding:gzip']
      }
    ]);
  });
});
