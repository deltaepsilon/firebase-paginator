var test = require('tape');
var firebase = require('firebase');
var path = 'firebasePaginator/empty';
var firebaseConfig = require('./env.json').firebaseConfig;

firebase.initializeApp(firebaseConfig);

var FirebasePaginator = require('./firebase-paginator');
var ref = firebase.database().ref(path);
var populateCollection = function () {
  return new Promise(function (resolve, reject) {
    var promises = [];
    var i = 3;

    while (i--) {
      promises.push(ref.push(3 - i));
    }

    Promise.all(promises).then(resolve, reject);
  });
};

var testPage = function (paginator, length, start, end, testName) {
  return new Promise(function (resolve, reject) {
    test(testName || `should return records ${start} to ${end}`, function (t) {
      paginator.once('value', function (snap) {
        var collection = this.collection;
        var keys = Object.keys(collection);
        var i = keys.length;
        t.equal(i, length);
        t.equal(collection[keys[0]], start);
        t.equal(collection[keys[i - 1]], end);
        t.end();
        resolve(paginator);
      });
    });
  });
};

ref.remove()
  .then(function () {
    var paginator = new FirebasePaginator(ref);
    return paginator;
  })
  // .then(function (paginator) {
  //   return new Promise(function (resolve, reject) {
  //     test(`should return empty collection`, function (t) {
  //       paginator.once('value', function (snap) {
  //         t.equal(snap.numChildren(), 0);
  //         t.end();
  //         resolve(paginator);
  //       });
  //     });
  //   });
  // })
  .then(function (paginator) {
    return populateCollection()
      .then(function () {
        return paginator;
      });
  })
  .then(function (paginator) {
    return new Promise(function (resolve, reject) {
      test(`should return three results`, function (t) {
        paginator.once('value', function (snap) {
          t.equal(snap.numChildren(), 3);
          t.end();
          resolve(paginator);
        });
      });
    });
  })
  .then(function () {
    var paginator = new FirebasePaginator(ref, {
      pageSize: 5,
      finite: true,
      auth: firebaseConfig.secret
    });
    return paginator;
  })
  .then(function (paginator) {
    return ref.remove()
      .then(function () {
        return paginator;
      });
  })
  .then(function (paginator) {
    return new Promise(function (resolve, reject) {
      test(`should return empty collection`, function (t) {
        paginator.once('value', function (snap) {
          t.equal(snap.numChildren(), 0);
          t.end();
          resolve(paginator);
        });
      });
    });
  })
  .then(function () {
    return populateCollection()
      .then(function () {
        return paginator;
      });
  })
  .then(function (paginator) {
    return new Promise(function (resolve, reject) {
      test(`should return three results`, function (t) {
        paginator.once('value', function (snap) {
          t.equal(snap.numChildren(), 3);
          t.end();
          resolve(paginator);
        });
      });
    });
  })
  .then(function () {
    console.log('complete');
    process.exit();
  })
  .catch(function (err) {
    console.log('error', err);
    process.exit();
  });
