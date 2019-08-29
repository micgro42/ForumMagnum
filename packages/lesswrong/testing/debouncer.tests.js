import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import lolex from 'lolex';
import { EventDebouncer, dispatchPendingEvents, getDailyBatchTimeAfter, getWeeklyBatchTimeAfter } from '../server/debouncer.js';
import { DebouncerEvents } from '../lib/collections/debouncerEvents/collection.js';

chai.should();
chai.use(chaiAsPromised);

describe('EventDebouncer', async () => {
  it('groups events correctly', async () => {
    let clock = lolex.install({
      now: new Date("1980-01-01"),
      shouldAdvanceTime: true,
    });
    
    try {
      // Clear the DebouncerEvents table
      DebouncerEvents.remove({});
      
      let numEventsHandled = 0;
      let numEventBatchesHandled = 0;
      const eventsHandled = {}; // key=>event=>number of times seen
      const testEvent = new EventDebouncer({
        name: "testEvent",
        defaultTiming: {
          type: "delayed",
          delayMinutes: 15,
          maxDelayMinutes: 30,
        },
        callback: (key, events) => {
          numEventBatchesHandled++;
          events.forEach(ev => {
            numEventsHandled++;
            
            if (!(key in eventsHandled))
              eventsHandled[key] = {};
            if (!(ev in eventsHandled[key]))
              eventsHandled[key][ev] = 0
            eventsHandled[key][ev]++;
          });
        }
      });
      
      clock.setSystemTime(new Date("1980-01-01 00:01:00"));
      await testEvent.recordEvent({key: "firstKey", data: "1"});
      await testEvent.recordEvent({key: "firstKey", data: "2"});
      await testEvent.recordEvent({key: "secondKey", data: "3"});
      
      // Advance clock, but not enough for events to fire
      clock.setSystemTime(new Date("1980-01-01 00:14:00"));
      await dispatchPendingEvents();
      eventsHandled.should.deep.equal({});
      
      // Advance clock, enough for events to fire
      clock.setSystemTime(new Date("1980-01-01 00:17:00"));
      await dispatchPendingEvents();
      numEventBatchesHandled.should.equal(2);
      numEventsHandled.should.equal(3);
      eventsHandled.should.deep.equal({
        "firstKey": {
          "1": 1,
          "2": 1
        },
        "secondKey": {
          "3": 1
        }
      });
      
      // Record another event, make sure it doesn't group together with already
      // fired events.
      clock.setSystemTime(new Date("1980-01-01 00:20:00"));
      await testEvent.recordEvent({key: "firstKey", data: "4"});
      await dispatchPendingEvents();
      numEventsHandled.should.equal(3);
      
      // Add events to delay event release until maxDelayMinutes reached
      clock.setSystemTime(new Date("1980-01-01 00:30:00"));
      await testEvent.recordEvent({key: "firstKey", data: "5"});
      await dispatchPendingEvents();
      clock.setSystemTime(new Date("1980-01-01 00:40:00"));
      await testEvent.recordEvent({key: "firstKey", data: "6"});
      await dispatchPendingEvents();
      numEventsHandled.should.equal(3);
      
      clock.setSystemTime(new Date("1980-01-01 00:51:00"));
      await dispatchPendingEvents();
      numEventsHandled.should.equal(6);
    } finally {
      clock.uninstall();
    }
  });
  it('times daily batches correctly', async () => {
    getDailyBatchTimeAfter(new Date("1980-01-01 00:20:00Z"), 3).toString().should.equal(new Date("1980-01-01 03:00:00Z").toString());
    getDailyBatchTimeAfter(new Date("1980-01-01 05:20:00Z"), 3).toString().should.equal(new Date("1980-01-02 03:00:00Z").toString());
  });
  it('times weekly batches correctly', async () => {
    getWeeklyBatchTimeAfter(new Date("1980-01-01 00:20:00Z"), 3, "Friday").toString().should.equal(new Date("1980-01-04 03:00:00Z").toString());
    getWeeklyBatchTimeAfter(new Date("1980-01-01 00:20:00Z"), 3, "Tuesday").toString().should.equal(new Date("1980-01-01 03:00:00Z").toString());
    getWeeklyBatchTimeAfter(new Date("1980-01-01 03:20:00Z"), 3, "Tuesday").toString().should.equal(new Date("1980-01-08 03:00:00Z").toString());
  });
});