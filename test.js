var test = require('tape');
var firebase = require('firebase');
var path = 'firebasePaginator/collection';
var firebaseConfig = require('./env.json').firebaseConfig;

firebase.initializeApp(firebaseConfig);

var FirebasePaginator = require('./firebase-paginator');
var ref = firebase.database().ref(path);
var populateCollection = function () {
  return new Promise(function (resolve, reject) {
    var promises = [];
    var i = 100;

    while (i--) {
      promises.push(ref.push(100 - i));
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

ref.once('value')
  .then(function (snap) {
    if (snap.numChildren() === 100) {
      return true;
    } else {
      return populateCollection();
    }
  })
  .then(function () {
    var paginator = new FirebasePaginator(ref);

    // paginator.on('value', function () {
    //   console.log("value\n", paginator.collection);
    // });

    return paginator;
  })
  .then(function (paginator) {
    return testPage(paginator, 10, 91, 100);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 81, 90);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 71, 80);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 61, 70);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 51, 60);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 41, 50);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 31, 40);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 21, 30);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 11, 20);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 1, 10);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 1, 10, 'should fail to back paginate and stick at 1 to 10');
  })
  .then(function () {
    var paginator = new FirebasePaginator(ref, {
      pageSize: 3
    });

    // paginator.on('value', function () {
    //   console.log("value\n", paginator.collection);
    // });
    
    return paginator;
  })
  .then(function (paginator) {
    return testPage(paginator, 3, 98, 100);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 3, 95, 97);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 3, 92, 94);
  })
  .then(function (paginator) {
    paginator.next();
    return testPage(paginator, 3, 95, 97);
  })
  .then(function (paginator) {
    paginator.next();
    return testPage(paginator, 3, 98, 100);
  })
  .then(function (paginator) {
    paginator.next();
    return testPage(paginator, 3, 98, 100, 'should fail to forward paginate and stick 98 to 100');
  })
  .then(function () {
    var paginator = new FirebasePaginator(ref, {
      finite: true,
      auth: firebaseConfig.secret
    });

    // paginator.on('value', function() {
    //   console.log("value\n", paginator.collection);
    // });

    return paginator;
  })
  .then(function (paginator) {
    return testPage(paginator, 10, 91, 100);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 81, 90);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 71, 80);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 61, 70);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 51, 60);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 41, 50);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 31, 40);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 21, 30);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 11, 20);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 1, 10);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 10, 1, 10, 'should fail to back paginate and stick at 1 to 10');
  })
  .then(function () {
    var paginator = new FirebasePaginator(ref, {
      pageSize: 3,
      finite: true,
      auth: firebaseConfig.secret
    });

    // paginator.on('value', function () {
    //   console.log("value\n", paginator.collection);
    // });

    return paginator;
  })
  .then(function (paginator) {
    return testPage(paginator, 3, 98, 100);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 3, 95, 97);
  })
  .then(function (paginator) {
    paginator.previous();
    return testPage(paginator, 3, 92, 94);
  })
  .then(function (paginator) {
    paginator.next();
    return testPage(paginator, 3, 95, 97);
  })
  .then(function (paginator) {
    paginator.next();
    return testPage(paginator, 3, 98, 100);
  })
  .then(function (paginator) {
    paginator.next();
    return testPage(paginator, 3, 98, 100, 'should fail to forward paginate and stick 98 to 100');
  })
  .then(function (paginator) {
    paginator.goToPage(paginator.pageCount - 1);
    return testPage(paginator, 3, 2, 4);
  })
  .then(function (paginator) {
    paginator.goToPage(paginator.pageCount);
    return testPage(paginator, 1, 1, 1, 'the last page should have only one record');
  })
  .then(function () {
    console.log('complete');
    process.exit();
  })
  .catch(function (err) {
    console.log('error', err);
    process.exit();
  });
