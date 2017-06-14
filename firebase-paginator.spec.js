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
  let paginator;

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
        beforeAll(() => {
          paginator = new FirebasePaginator(collectionRef, {
            finite: true,
            auth: secret,
            pageSize: 10
          });
        });
        
        testPage(10, 91, 100);

        for (let i = 90; i > 0; i -= 10) {
          testPage(10, i-9, i, false, 'previous'); 
        }

        testPage(10, 1, 10, 'should fail to back paginate', 'previous');
      });

      describe('pageSize: 3', () => {
        beforeAll(() => {
          paginator = new FirebasePaginator(collectionRef, {
            finite: true,
            auth: secret,
            pageSize: 3
          });
        });

        testPage(3, 98, 100, false);
        testPage(3, 95, 97, false, 'previous');
        testPage(3, 92, 94, false, 'previous');
        testPage(3, 95, 97, false, 'next');
        testPage(3, 98, 100, false, 'next');
        testPage(3, 98, 100, 'should fail to forward paginate and stick 98 to 100', 'next');
      });

      describe('pageSize: 30', () => {
        beforeAll(() => {
          paginator = new FirebasePaginator(collectionRef, {
            finite: true,
            auth: secret,
            pageSize: 30
          });
        });

        testPage(30, 71, 100, false);
        testPage(30, 41, 70, false, 'previous');
        testPage(30, 11, 40, false, 'previous');
        testPage(10, 1, 10, false, 'previous');
      });
    });
  });

  describe('Infinite Pagination', () => {
    describe('empty-collection', () => {
      beforeEach(() => {
        paginator = new FirebasePaginator(emptyCollectionRef, {
          finite: false,
          auth: secret
        });
      });

      testPage(0, undefined, undefined);
    });

    describe('small-collection', () => {
      describe('pageSize: 10', () => {
        beforeEach(() => {
          paginator = new FirebasePaginator(smallCollectionRef, {
            finite: false,
            auth: secret,
            pageSize: 10
          });
        });
        testPage(3, 1, 3);
      });

      describe('pageSize: 3', () => {
        beforeEach(() => {
          paginator = new FirebasePaginator(smallCollectionRef, {
            finite: false,
            auth: secret,
            pageSize: 3
          });
        });
        testPage(3, 1, 3);
      });
    });

    describe('collection', () => {
      describe('pageSize: 10', () => {
        beforeAll(() => {
          paginator = new FirebasePaginator(collectionRef, {
            finite: false,
            auth: secret,
            pageSize: 10
          });
        });
        
        testPage(10, 91, 100);

        for (let i = 90; i > 0; i -= 10) {
          testPage(10, i-9, i, false, 'previous'); 
        }

        testPage(10, 1, 10, 'should fail to back paginate', 'previous');
      });

      describe('pageSize: 3', () => {
        beforeAll(() => {
          paginator = new FirebasePaginator(collectionRef, {
            finite: false,
            auth: secret,
            pageSize: 3
          });
        });

        testPage(3, 98, 100, false);
        testPage(3, 95, 97, false, 'previous');
        testPage(3, 92, 94, false, 'previous');
        testPage(3, 95, 97, false, 'next');
        testPage(3, 98, 100, false, 'next');
        testPage(3, 98, 100, 'should fail to forward paginate and stick 98 to 100', 'next');
      });
      
      describe('pageSize: 30', () => {
        beforeAll(() => {
          paginator = new FirebasePaginator(collectionRef, {
            finite: false,
            auth: secret,
            pageSize: 30
          });
        });

        testPage(30, 71, 100, false);
        testPage(30, 41, 70, false, 'previous');
        testPage(30, 11, 40, false, 'previous');
        testPage(30, 1, 30, false, 'previous');
      });
      
      describe('pageSize: 30', () => {
        beforeAll(() => {
          paginator = new FirebasePaginator(collectionRef, {
            finite: false,
            auth: secret,
            pageSize: 30,
            retainLastPage: true
          });
        });

        testPage(30, 71, 100, false);
        testPage(30, 41, 70, false, 'previous');
        testPage(30, 11, 40, false, 'previous');
        testPage(10, 1, 10, false, 'previous');

        it('should fire isLastPage even if retainLastValue is true', done => {
          let firedCount = 0;
          paginator.once('isLastPage').then(() => {
            firedCount++;
          });
          paginator.previous()
            .then(() => {
              expect(firedCount).toEqual(1);
              done();
            })
            .catch(done.fail);
        });
      });
    });
  });

  function testPage(length, start, end, testName, precursorName) {
    it(testName || `should return records ${start} to ${end}`, done => {
      Promise.resolve()
        .then(() => {
          if (precursorName) {
            return paginator[precursorName]();
          } else {
            return paginator.once('value');
          }
        })
        .then(snap => {
          var collection = paginator.collection || {};
          var keys = Object.keys(collection);
          var i = keys.length;

          // console.log('output', length, collection);
          expect(i).toEqual(length);
          if (length) {
            expect(collection[keys[0]]).toEqual(start);
            expect(collection[keys[i - 1]]).toEqual(end);
          }
          done();
        });
    });
  };
});
