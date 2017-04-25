const admin = require('firebase-admin');
const firebaseConfig = require('./env.json').firebaseConfig;
const secret = firebaseConfig.secret;

admin.initializeApp({
  databaseURL: firebaseConfig.databaseURL,
  credential: admin.credential.cert(firebaseConfig.serviceAccount)
});

const ref = admin.database().ref('firebasePaginator');
const collectionRef = ref.child('collection');
const smallCollectionRef = ref.child('small-collection');
const emptyCollectionRef = ref.child('empty-collection');

const FirebasePaginator = require('./firebase-paginator');

describe('Firebase Paginator', () => {
  beforeAll(done => {
    ref.remove().then(done);
  });

  beforeAll(done => {
    populateCollection(100, collectionRef).then(done);
  });

  beforeAll(done => {
    populateCollection(3, smallCollectionRef).then(done);
  });

  function populateCollection(count, ref) {
    return new Promise(function(resolve, reject) {
      var promises = [];
      var i = count;

      while (i--) {
        promises.push(ref.push(count - i));
      }

      Promise.all(promises).then(resolve, reject);
    });
  }

  describe('Initial Load', () => {
    it('collection', done => {
      collectionRef.once('value').then(snap => {
        expect(snap.numChildren()).toEqual(100);
        done();
      });
    });

    it('small-collection', done => {
      smallCollectionRef.once('value').then(snap => {
        expect(snap.numChildren()).toEqual(3);
        done();
      });
    });

    it('empty-collection', done => {
      emptyCollectionRef.once('value').then(snap => {
        expect(snap.numChildren()).toEqual(0);
        done();
      });
    });
  });

  let paginator;
  function testPage(length, start, end, testName, cbName) {
    it(testName || `should return records ${start} to ${end}`, done => {
      paginator.once('value', function(snap) {
        var collection = this.collection;
        var keys = Object.keys(collection);
        var i = keys.length;

        expect(i).toEqual(length);
        expect(collection[keys[0]]).toEqual(start);
        expect(collection[keys[i - 1]]).toEqual(end);

        if (typeof cbName == 'string') {
          paginator[cbName]();
        }
        done();
      });
    });
  }

  describe('Finite Pagination', () => {
    describe('empty-collection', () => {
      beforeEach(() => {
        paginator = new FirebasePaginator(emptyCollectionRef, {
          finite: true,
          auth: secret
        });
      });

      testPage(0, undefined, undefined);
    });

    describe('small-collection', () => {
      describe('pageSize: 10', () => {
        beforeEach(() => {
          paginator = new FirebasePaginator(smallCollectionRef, {
            finite: true,
            auth: secret,
            pageSize: 10
          });
        });
        testPage(3, 1, 3);
      });

      describe('pageSize: 3', () => {
        beforeEach(() => {
          paginator = new FirebasePaginator(smallCollectionRef, {
            finite: true,
            auth: secret,
            pageSize: 3
          });
        });
        testPage(3, 1, 3);
      });
    });

    describe('collection', () => {
      describe('pageSize: 10', () => {
        beforeEach(() => {
          paginator = new FirebasePaginator(collectionRef, {
            finite: true,
            auth: secret,
            pageSize: 10
          });
        });
        testPage(10, 91, 100);
      });

      describe('pageSize: 3', () => {
        beforeEach(() => {
          paginator = new FirebasePaginator(collectionRef, {
            finite: true,
            auth: secret,
            pageSize: 3
          });
        });

        testPage(3, 98, 100, 'previous');
        testPage(3, 95, 97, 'previous');
        testPage(3, 92, 94, 'next');
        testPage(3, 95, 97, 'next');
        testPage(3, 98, 100, 'next');
        testPage(
          3,
          98,
          100,
          'should fail to forward paginate and stick 98 to 100'
        );
      });
    });
  });
});
