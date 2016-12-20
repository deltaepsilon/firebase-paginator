var test = require('tape');
var firebase = require('firebase');
var path = 'firebasePaginator/collection';
var smallCollectionPath = 'firebasePaginator/small-collection';
var emptyCollectionPath = 'firebasePaginator/empty-collection';
var firebaseConfig = require('./env.json').firebaseConfig;

firebase.initializeApp(firebaseConfig);

var FirebasePaginator = require('./firebase-paginator');
var ref = firebase.database().ref(path);
var smallCollectionRef = firebase.database().ref(smallCollectionPath);
var emptyCollectionRef = firebase.database().ref(emptyCollectionPath);

function populateCollection(count, ref) {
  return new Promise(function (resolve, reject) {
    var promises = [];
    var i = count;

    while (i--) {
      promises.push(ref.push(count - i));
    }

    Promise.all(promises).then(resolve, reject);
  });
};

function testPage(paginator, length, start, end, testName) {
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

return ref.once('value')
  .then(function (snap) {
    if (snap.numChildren() === 100) {
      return true;
    } else {
      return populateCollection(100, ref);
    }
  })
  .then(function() {
    return smallCollectionRef.once('value');    
  })
  .then(function(snap) {
    if (snap.numChildren() == 3) {
      return true;
    } else {
      return populateCollection(3, smallCollectionRef);
    }
  })
  .then(function() {
    return emptyCollectionRef.remove();
  })
  .then(function() { // Test empty collection inifite pagination
    return new FirebasePaginator(emptyCollectionRef);
  })
  .then(function(paginator) {
    return testPage(paginator, 0, undefined, undefined);
  })
  .then(function() { // Test empty collection finite pagination
    return new FirebasePaginator(emptyCollectionRef, {
      finite: true,
      auth: firebaseConfig.secret
    });
  })
  .then(function(paginator) {
    return testPage(paginator, 0, undefined, undefined);
  })
  .then(function() { // Test small collection infinite pagination
    return new FirebasePaginator(smallCollectionRef);
  })
  .then(function(paginator) {
    return testPage(paginator, 3, 1, 3);
  })
  .then(function() {
    return new FirebasePaginator(smallCollectionRef, {pageSize: 3});
  })
  .then(function(paginator) {
    return testPage(paginator, 3, 1, 3);
  })
  .then(function() { // Test small collection finite pagination
    return new FirebasePaginator(smallCollectionRef, {
      finite: true,
      auth: firebaseConfig.secret
    });
  })
  .then(function(paginator) {
    return testPage(paginator, 3, 1, 3);
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
