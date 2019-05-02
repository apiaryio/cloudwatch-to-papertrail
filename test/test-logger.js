const { promisify } = require('util');
const { gzipSync } = require('zlib');
const { expect } = require('chai');
const winston = require('winston');
const Transport = require('winston-transport');
const index = require('../index');

const handleEvent = promisify(index.handleEvent);

class TestTransport extends Transport {
  constructor() {
    super();
    this.name = 'test';
    this.events = [];
  }

  log(level, message) {
    this.events.push({ level, message })
  }
}

describe('#handler', function () {
  let logger;
  let transport;

  beforeEach(function () {
    logger = new winston.Logger({
      transports: []
    });
    logger.add(TestTransport);
    transport = logger.transports.test;
  });

  afterEach(function() {
    logger.clear();
    transport = null;
    logger = null;
  });

  it('logs given awslogs to winston', async function () {
    const event = {
      awslogs: {
        data: 'H4sIAAAAAAAAAHWPwQqCQBCGX0Xm7EFtK+smZBEUgXoLCdMhFtKV3akI8d0bLYmibvPPN3wz00CJxmQnTO41whwWQRIctmEcB6sQbFC3CjW3XW8kxpOpP+OC22d1Wml1qZkQGtoMsScxaczKN3plG8zlaHIta5KqWsozoTYw3/djzwhpLwivWFGHGpAFe7DL68JlBUk+l7KSN7tCOEJ4M3/qOI49vMHj+zCKdlFqLaU2ZHV2a4Ct/an0/ivdX8oYc1UVX860fQDQiMdxRQEAAA=='
      }
    }

    await handleEvent(event, logger);

    expect(transport.events).to.deep.equal([
      {
        level: 'info',
        message: '[ERROR] First test message',
      },
      {
        level: 'info',
        message: '[ERROR] Second test message',
      }
    ]);
  });

  it('ignores CloudWatch messages for request not contributing to throttle / quota limits', async function () {
    const event = {
      awslogs: {
        data: gzipSync(JSON.stringify({
          logEvents: [
            {
              message: "(some-uuid-is-here) API Key  authorized because method 'POST /validate' does not require API Key. Request will not contribute to throttle or quota limits",
            },
          ],
        })).toString('base64'),
      },
    };

    await handleEvent(event, logger);

    expect(transport.events.length).to.equal(0);
  });

  it('ignores CloudWatch messages for checking usage plans', async function () {
    const event = {
      awslogs: {
        data: gzipSync(JSON.stringify({
          logEvents: [
            {
              message: "(some-uuid-is-here) Usage Plan check succeeded for API Key  and API Stage stageid/production ",
            },
          ],
        })).toString('base64'),
      },
    };

    await handleEvent(event, logger);

    expect(transport.events.length).to.equal(0);
  });

  it('ignores CloudWatch messages for verifying usage plans', async function () {
    const event = {
      awslogs: {
        data: gzipSync(JSON.stringify({
          logEvents: [
            {
              message: "(some-uuid-is-here) Verifying Usage Plan for request: request-uuid. API Key:  API Stage: stageid/production ",
            },
          ],
        })).toString('base64'),
      },
    };

    await handleEvent(event, logger);

    expect(transport.events.length).to.equal(0);
  });
});
