import { expect } from 'chai';
import sinon from 'sinon';
import Logger from '@APF/lib/logger';
import Constants from '@APF/lib/constants';

describe('Logger', function() {

  describe('class', function() {
    const loggerStubs = {};

    beforeEach(function() {
      for (const level of Object.keys(Constants.LOGGING_LEVELS)) {
        loggerStubs[level.toLowerCase()] = sinon.stub(console, level.toLowerCase());
      }
    });

    afterEach(function() {
      for (const stub of Object.values(loggerStubs)) {
        stub?.restore();
      }
    });

    describe('debug', function() {
      it('should output debug message', function() {
        Logger.debug('debug message');
        expect(loggerStubs[Logger.debugName].called).to.be.true;
      });

      it('should output debugTime message', function() {
        Logger.debugTime('debugTime message');
        expect(loggerStubs[Logger.debugName].called).to.be.true;
      });

      describe('with data', function() {
        it('should output debug message with data', function() {
          Logger.debug('debug message', ['data']);
          expect(loggerStubs[Logger.debugName].called).to.be.true;
        });

        it('should output debugTime message with data', function() {
          Logger.debugTime('debugTime message');
          expect(loggerStubs[Logger.debugName].called).to.be.true;
        });
      });
    });

    describe('error', function() {
      it('should output error message', function() {
        Logger.error('error message');
        expect(loggerStubs[Logger.errorName].called).to.be.true;
      });

      it('should output errorTime message', function() {
        Logger.errorTime('errorTime message');
        expect(loggerStubs[Logger.errorName].called).to.be.true;
      });
    });

    describe('info', function() {
      it('should output info message', function() {
        Logger.info('info message');
        expect(loggerStubs[Logger.infoName].called).to.be.true;
      });

      it('should output infoTime message', function() {
        Logger.infoTime('infoTime message');
        expect(loggerStubs[Logger.infoName].called).to.be.true;
      });
    });

    describe('log()', function() {
      it('should output debug message', function() {
        Logger.log(Logger.debugName, 'debug message');
        expect(loggerStubs[Logger.debugName].called).to.be.true;
      });
    });

    describe('logTime()', function() {
      it('should output debug message', function() {
        Logger.logTime(Logger.debugName, 'debug message');
        expect(loggerStubs[Logger.debugName].called).to.be.true;
      });
    });

    describe('warn', function() {
      it('should output warn message', function() {
        Logger.warn('warn message');
        expect(loggerStubs[Logger.warnName].called).to.be.true;
      });

      it('should output warnTime message', function() {
        Logger.warnTime('warnTime message');
        expect(loggerStubs[Logger.warnName].called).to.be.true;
      });
    });
  });

  describe('instance', function() {
    const logger = new Logger();
    const loggerStubs = {};

    beforeEach(function() {
      for (const level of Object.keys(Constants.LOGGING_LEVELS)) {
        loggerStubs[level.toLowerCase()] = sinon.stub(console, level.toLowerCase());
      }
    });

    afterEach(function() {
      for (const stub of Object.values(loggerStubs)) {
        stub?.restore();
      }
    });

    describe('debug', function() {
      describe('debug()', function() {
        it('should output debug message', function() {
          logger.setLevel(Logger.debugLevel);
          logger.debug('debug message');
          expect(loggerStubs[Logger.debugName].called).to.be.true;
        });

        it('should not output debug message', function() {
          logger.setLevel(Logger.warnLevel);
          logger.debug('debug message');
          expect(loggerStubs[Logger.debugName].called).to.be.false;
        });

        describe('with data', function() {
          it('should output debug message with data', function() {
            logger.setLevel(Logger.debugLevel);
            logger.debug('debug message', ['data']);
            expect(loggerStubs[Logger.debugName].called).to.be.true;
          });

          it('should not output debug message with data', function() {
            logger.setLevel(Logger.warnLevel);
            logger.debug('debug message', ['data']);
            expect(loggerStubs[Logger.debugName].called).to.be.false;
          });
        });
      });

      describe('debugTime()', function() {
        it('should output debugTime message', function() {
          logger.setLevel(Logger.debugLevel);
          logger.debugTime('debugTime message');
          expect(loggerStubs[Logger.debugName].called).to.be.true;
        });

        it('should not output debugTime message', function() {
          logger.setLevel(Logger.warnLevel);
          logger.debugTime('debugTime message');
          expect(loggerStubs[Logger.debugName].called).to.be.false;
        });

        describe('with data', function() {
          it('should output debugTime message with data', function() {
            logger.setLevel(Logger.debugLevel);
            logger.debugTime('debugTime message', ['data']);
            expect(loggerStubs[Logger.debugName].called).to.be.true;
          });

          it('should not output debugTime message with data', function() {
            logger.setLevel(Logger.warnLevel);
            logger.debugTime('debugTime message', ['data']);
            expect(loggerStubs[Logger.debugName].called).to.be.false;
          });
        });
      });
    });

    describe('error', function() {
      describe('error()', function() {
        it('should output error message', function() {
          logger.setLevel(Logger.errorLevel);
          logger.error('error message');
          expect(loggerStubs[Logger.errorName].called).to.be.true;
        });

        it('should not output error message', function() {
          logger.setLevel(100); // Placeholder for higher than error level
          logger.error('error message');
          expect(loggerStubs[Logger.errorName].called).to.be.false;
        });
      });

      describe('errorTime()', function() {
        it('should output errorTime message', function() {
          logger.setLevel(Logger.errorLevel);
          logger.errorTime('errorTime message');
          expect(loggerStubs[Logger.errorName].called).to.be.true;
        });

        it('should not output errorTime message', function() {
          logger.setLevel(100); // Placeholder for higher than error level
          logger.errorTime('errorTime message');
          expect(loggerStubs[Logger.errorName].called).to.be.false;
        });
      });
    });

    describe('info', function() {
      describe('info()', function() {
        it('should output info message', function() {
          logger.setLevel(Logger.infoLevel);
          logger.info('info message');
          expect(loggerStubs[Logger.infoName].called).to.be.true;
        });

        it('should not output info message', function() {
          logger.setLevel(Logger.warnLevel);
          logger.info('info message');
          expect(loggerStubs[Logger.infoName].called).to.be.false;
        });
      });

      describe('infoTime()', function() {
        it('should output infoTime message', function() {
          logger.setLevel(Logger.infoLevel);
          logger.infoTime('infoTime message');
          expect(loggerStubs[Logger.infoName].called).to.be.true;
        });

        it('should not output infoTime message', function() {
          logger.setLevel(Logger.warnLevel);
          logger.infoTime('infoTime message');
          expect(loggerStubs[Logger.infoName].called).to.be.false;
        });
      });
    });

    describe('warn', function() {
      describe('warn()', function() {
        it('should output warn message', function() {
          logger.setLevel(Logger.warnLevel);
          logger.warn('warn message');
          expect(loggerStubs[Logger.warnName].called).to.be.true;
        });

        it('should not output warn message', function() {
          logger.setLevel(Logger.errorLevel);
          logger.warn('warn message');
          expect(loggerStubs[Logger.warnName].called).to.be.false;
        });
      });

      describe('warnTime()', function() {
        it('should output warnTime message', function() {
          logger.setLevel(Logger.warnLevel);
          logger.warnTime('warnTime message');
          expect(loggerStubs[Logger.warnName].called).to.be.true;
        });

        it('should not output warnTime message', function() {
          logger.setLevel(Logger.errorLevel);
          logger.warnTime('warnTime message');
          expect(loggerStubs[Logger.warnName].called).to.be.false;
        });
      });
    });
  });
});
