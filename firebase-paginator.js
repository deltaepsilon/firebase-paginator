var isWindow = typeof window === 'object';
var FirebasePaginator = function (ref, defaults) {
  var paginator = this;
  var defaults = defaults || {};
  var pageSize = defaults.pageSize ? defaults.pageSize : 10;
  var isFinite = defaults.finite ? defaults.finite : false;
  var auth = defaults.auth;

  // Events
  this.listen = function(callback) {
    paginator.allEventHandler = callback;
  };
  var events = {};
  var fire = function (eventName, payload) {
    if (typeof paginator.allEventHandler === 'function') {
      paginator.allEventHandler.call(paginator, eventName, payload);
    }

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
    return new Promise(function (resolve, reject) {
      var handler = function (payload) {
        paginator.off(eventName, handler);
        if (typeof callback === 'function') {
          try {
            resolve(callback.call(paginator, payload));
          } catch (e) {
            reject(e);
          }
        } else {
          resolve(payload);
        }
      };
      paginator.on(eventName, handler);
    });

  };

  /*
   *  Pagination can be finite or infinite. Infinite pagination is the default.
   */
  if (!isFinite) { // infinite pagination

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
          this.isLastPage = isLastPage || false;
          this.collection = collection;
          this.cursor = cursor;

          fire('value', snap);
          if (this.isLastPage) {
            fire('isLastPage');
          }
          return this;
        }.bind(this));
    }.bind(this);

    setPage()
      .then(function () {
        fire('ready', paginator);
      }); // bootstrap the list

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


  } else { // finite pagination
    var queryPath = ref.toString() + '.json?shallow=true';
    if (auth) {
      queryPath += '&auth=' + auth;
    }
    var getKeys = function () {
      if (isWindow) {
        return new Promise(function(resolve, reject) {
          var request = new XMLHttpRequest();
          request.onreadystatechange = function() {
            if (request.readyState === 4) {
              var response = JSON.parse(request.responseText);
              if (request.status === 200) {
                resolve(Object.keys(response)); 
              } else {
                reject(response);
              }
            }
          };
          request.open('GET', queryPath, true);
          request.send();
        });
      } else {
        var axios = require('axios');
        return axios.get(queryPath)
          .then(function (res) {
            return Object.keys(res.data);
          });
      }
    };

    this.goToPage = function (pageNumber) {
      paginator.page = this.pages[pageNumber];
      paginator.pageNumber = pageNumber;
      paginator.isLastPage = pageNumber === paginator.pages.length;
      paginator.ref = ref.orderByKey().limitToLast(pageSize).endAt(paginator.page.endKey);

      return this.ref.once('value')
        .then(function (snap) {
          var collection = snap.val();
          var keys = [];

          snap.forEach(function (childSnap) {
            keys.push(childSnap.key);
          });

          paginator.snap = snap;
          paginator.keys = keys;
          paginator.collection = collection;

          fire('value', snap);
          if (paginator.isLastPage) {
            fire('isLastPage');
          }
          return paginator;
        });
    };

    this.reset = function () {
      return getKeys()
        .then(function (keys) {
          var orderedKeys = keys.sort();
          var keysLength = orderedKeys.length;
          var cursors = [];

          for (var i = keysLength; i > 0; i -= pageSize) {
            cursors.push({
              fromStart: {
                startRecord: i - pageSize + 1,
                endRecord: i
              },
              fromEnd: {
                startRecord: keysLength - i + 1,
                endRecord: keysLength - i + pageSize 
              },
              endKey: keys[i - 1]
            });
          }

          var cursorsLength = cursors.length
          var k = cursorsLength;
          var pages = {};
          while (k--) {
            cursors[k].pageNumber = k + 1;
            pages[k + 1] = cursors[k];
          }
          paginator.pageCount = cursorsLength;
          paginator.pages = pages;

          return pages;
        })
        .catch(function (err) {
          console.log('finite reset pagination error', err);
        });
    };

    this.reset() // Refresh keys and go to first page.
      .then(function () {
        return paginator.goToPage(1);
      })
      .then(function () {
        fire('ready', paginator);
      });

    this.previous = function () {
      this.goToPage(Math.min(this.pageCount, this.pageNumber + 1));
    };

    this.next = function () {
      this.goToPage(Math.max(1, this.pageNumber - 1));
    };

  }
};

if (typeof window === 'object') {
  window.FirebasePaginator = FirebasePaginator;
} else if (typeof process === 'object') {
  module.exports = FirebasePaginator;
}