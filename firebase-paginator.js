var isWindow = !!typeof window === 'object';
var FirebasePaginator = function (ref, defaults) {
  var paginator = this;
  var pageSize = defaults && defaults.pageSize ? defaults.pageSize : 10;
  var isFinite = defaults && defaults.finite ? defaults.finite : false;
  var isCumulative = !isFinite && defaults && defaults.cumulative ? defaults.cumulative : false;

  // Events
  var events = {};
  var fire = function (eventName, payload) {
    if (events[eventName] && events[eventName].queue) {
      var queue = events[eventName].queue.reverse();
      var i = queue.length;
      while (i--) {
        if (typeof queue[i] === 'function') {
          queue[i].call(paginator, payload);
        }
      }
    }
  };

  this.on = function (eventName, callback) {
    if (!events[eventName]) {
      events[eventName] = {
        queue: []
      };
    }
    events[eventName].queue.push(callback);
  };

  this.off = function (eventName, callback) {
    if (events[eventName] && events[eventName].queue) {
      var queue = events[eventName].queue;
      var i = queue.length;
      while (i--) {
        if (queue[i] === callback) {
          queue.splice(i, 1);
        }
      }
    }
  };

  this.once = function (eventName, callback) {
    var handler = function (payload) {
      paginator.off(eventName, handler);
      if (typeof callback === 'function') {
        callback.call(paginator, payload);
      }
    };
    paginator.on(eventName, handler);
  };

  // Pagination
  if (!isFinite) {

    var setPage = function (cursor, isForward, isLastPage) {
      this.ref = ref.orderByKey();

      // If there it's forward pagination, use limitToFirst(pageSize + 1) and startAt(theLastKey)

      if (isForward) { // forward pagination
        this.ref = this.ref.limitToFirst(pageSize + 1);
        if (cursor) { // check for forward cursor
          this.ref = this.ref.startAt(cursor);
        }
      } else { // previous pagination
        this.ref = this.ref.limitToLast(pageSize + 1);
        if (cursor) { // check for previous cursor
          this.ref = this.ref.endAt(cursor);
        }
      }

      return this.ref.once('value')
        .then(function (snap) {
          var numChildren = snap.numChildren();
          var keys = [];
          var collection = {};

          cursor = undefined;

          snap.forEach(function (childSnap) {
            keys.push(childSnap.key);
            if (!cursor) {
              cursor = childSnap.key;
            }
            collection[childSnap.key] = childSnap.val();
          });

          
          if (keys.length === pageSize + 1) {
            if (isLastPage) {
              delete collection[keys[keys.length - 1]];
            } else {
              delete collection[keys[0]];
            }
          } else if (isForward) {
            return setPage(); // force a reset if forward pagination overruns the last result
          } else {
            return setPage(undefined, true, true);
          }

          this.snap = snap;
          this.keys = keys;
          this.isLastPage = isLastPage;
          this.collection = collection;
          this.cursor = cursor;

          fire('value', snap);
          if (this.isLastPage) {
            fire('isLastPage');
          }
          return this;
        }.bind(this));
    }.bind(this);

    setPage(); // bootstrap the list

    this.reset = function () {
      return setPage()
        .then(function () {
          return fire('reset');
        });
    };

    this.previous = function () {
      return setPage(this.cursor)
        .then(function () {
          return fire('previous');
        }.bind(this));
    };

    this.next = function () {
      var cursor;
      if (this.keys && this.keys.length) {
        cursor = this.keys[this.keys.length - 1];
      }
      return setPage(cursor, true)
        .then(function () {
          return fire('next');
        });
    };


  }
};

if (typeof window === 'object') {
  window.FirebasePaginator = FirebasePaginator;
} else if (typeof process === 'object') {
  module.exports = FirebasePaginator;
}