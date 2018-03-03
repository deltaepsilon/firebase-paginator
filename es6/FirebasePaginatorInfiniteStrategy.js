/* eslint-disable */
import axios from 'axios';

class InfinitePagingStrategy {
  constructor(paginator) {
    // infinite pagination
    this.paginator = paginator;

    const setPage = (cursor, isForward, isLastPage) => {
      const self = this.paginator;

      let query;

      query = self.ref.orderByKey();

      // If there it's forward pagination, use limitToFirst(pageSize + 1) and startAt(theLastKey)

      if (self.isForward) {
        // forward pagination
        self.ref = self.ref.limitToFirst(self.pageSize + 1);
        if (cursor) {
          // check for forward cursor
          query = self.ref.startAt(cursor);
        }
      } else {
        // previous pagination
        query = self.ref.limitToLast(self.pageSize + 1);
        if (cursor) {
          // check for previous cursor
          query = self.ref.endAt(cursor);
        }
      }

      return query.once('value').then(snap => {
        const keys = [];
        const collection = {};

        cursor = undefined;

        snap.forEach(function(childSnap) {
          keys.push(childSnap.key);
          if (!cursor) {
            cursor = childSnap.key;
          }
          collection[childSnap.key] = childSnap.val();
        });

        if (keys.length === self.pageSize + 1) {
          if (isLastPage) {
            delete collection[keys[keys.length - 1]];
          } else {
            delete collection[keys[0]];
          }
        } else if (isLastPage && keys.length < self.pageSize + 1) {
          // console.log('tiny page', keys.length, pageSize);
        } else if (isForward) {
          return setPage(); // force a reset if forward pagination overruns the last result
        } else if (!self.retainLastPage) {
          return setPage(undefined, true, true); // Handle overruns
        } else {
          isLastPage = true;
        }

        self.snap = snap;
        self.keys = keys;
        self.isLastPage = isLastPage || false;
        self.collection = collection;
        self.cursor = cursor;

        self.fire('value', snap);
        if (self.isLastPage) {
          self.fire('isLastPage');
        }
        return this;
      });
    };

    const self = paginator;

    setPage().then(() => {
      self.fire('ready', paginator);
    }); // bootstrap the list

    this.reset = () => {
      return setPage().then(function() {
        return self.fire('reset');
      });
    };

    this.previous = () => {
      return setPage(self.cursor).then(function() {
        return self.fire('previous');
      });
    };

    this.next = () => {
      var cursor;
      if (self.keys && self.keys.length) {
        cursor = self.keys[self.keys.length - 1];
      }
      return setPage(cursor, true).then(function() {
        return self.fire('next');
      });
    };
  }
}
export default InfinitePagingStrategy;
