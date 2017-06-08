# FirebasePaginator

FirebasePaginator is a JavaScript utility for Node.js and the browser that enables simple, declarative pagination for your Firebase collections. It's been developed for Firebase 3.0, but it should work for Firebase 2.0 projects as well.

### Dependencies

FirebasePaginator relies on the [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) object. Promise support is great for modern versions of Chrome, Firefox, Edge, Opera and Safari. Internet Explorer gets left out. Sorry IE, but even Microsoft is sick of you. You're dying. And attempting to support you would only prolong the misery.

FirebasePaginator uses the [Axios](https://github.com/mzabriskie/axios) library for Node.js and XMLHttpRequest in the browser.

In summary: Node.js requires Promise and Axios; the browser requires Promise and XMLHttpRequest.

### Install

- NPM: ```npm install --save firebase-paginator```
- Bower: ```bower install --save firebase-paginator```

### Test

- ```npm install```
- ```npm test```

### Usage

If you're in Node.js, you'll need to do something like ```var FirebasePaginator = require('firebase-paginator')```. 

If you're in the browser, you'll have access to FirebasePaginator on the ```window``` object like so: ```var FirebasePaginator = window.FirebasePaginator;```

Once you have your ```FirebasePaginator``` object, the rest is isomorphic JavaScript. Just pass in a Firebase ref and some options:

***pageSize***: any integer greater than zero, defaults to 10

***finite***: defaults to false

***auth***: optional auth token for secure collections

***retainLastPage***: applies to infinite pagination only; prevents a short last page from resetting the list; see [Finite vs Infinite Pagination](#finite-vs-infinite-pagination)



```
var options = {
  pageSize: 15,
  finite: true,
  auth: 'MyAuthTokenForSecurityPurposes',
  retainLastPage: false
};
var paginator = new FirebasePaginator(ref, options);

```
# Functions

#### FirebasePaginator.prototype.listen(callback)

Listens to all events

Useful for proxying events or just debugging

```
var paginator = new FirebasePaginator(ref);
var itemsList = [];

paginator.listen(function (eventName, eventPayload) {
  console(`Fired ${eventName} with the following payload: `, eventPayload);
});
``` 


#### FirebasePaginator.prototype.on(event, callback)

Attaches a callback to an event

```
var paginator = new FirebasePaginator(ref);
var itemsList = [];
var handler = function() {
  collection = paginator.collection;
};

paginator.on('value', handler);
``` 

#### FirebasePaginator.prototype.off(event, callback)

Detaches a callback from an event

```
var paginator = new FirebasePaginator(ref);
var itemsList = [];
var handler = function() {
  collection = paginator.collection;
};

paginator.off('value', handler);
``` 

#### FirebasePaginator.prototype.once(event, callback) -> returns promise

Calls a callback exactly once for an event

```
var paginator = new FirebasePaginator(ref);
var itemsList = [];
var handler = function() {
  collection = paginator.collection;
};

// Callback pattern
paginator.once('value', handler);

// Promise pattern
paginator.once('value').then(handler);
``` 

#### FirebasePaginator.prototype.reset() -> returns promise

Resets pagination

Infinite: jumps to end of collection

Finite: Refreshes keys list and jumps to page 1         

```
var paginator = new FirebasePaginator(ref);
paginator.reset()
  .then(function() {
    console.log('list has been reset');
  });
``` 

#### FirebasePaginator.prototype.previous() -> returns promise

Pages backward

```
var paginator = new FirebasePaginator(ref);
paginator.previous()
  .then(function() {
    console.log('paginated backward');
  });
``` 


#### FirebasePaginator.prototype.next() -> returns promise

Pages forward

```
var paginator = new FirebasePaginator(ref);
paginator.next()
  .then(function() {
    console.log('paginated forward');
  });
``` 

#### FirebasePaginator.prototype.goToPage(<page number>) -> returns promise

Jumps to any page

Accepts page numbers from 1 to the pageCount

Available for finite pagination ***only***

```
var paginator = new FirebasePaginator(ref);
paginator.goToPage(3)
  .then(function() {
    console.log('paginated to page 3');
  });
``` 

# Events

#### value

The **value** event fires after every change in data. FirebasePaginator listens to the Firebase **value** event, manipulates the data a bit and then fires its own **value** event.

#### isLastPage

**isLastPage** fires just after the **value** event if FirebasePaginator has reached the top of the list.

#### ready

FirebasePaginator fires its **ready** event once the first page is loaded.

#### reset, next, previous

The **reset**, **next** and **previous** events fire after each of the corresponding functions is complete and the new data is loaded.


# Finite vs Infinite Pagination

There are two ways to paginate Firebase data: finite and infinite paginations.

Let's assume that pageSize is 10 and we have records 1 through 100. Also note that all Firebase pagination occurs from the bottom of the collection. 

#### Infinite Pagination

Infinite pagination pulls the last 11 records of the collection, saves the 90th record's key as a cursor and adds records 91 through 100 to the collection.

Infinite pagination steps backward by pulling another 11 records ending at the cursor (a.k.a. the 90th record's key). So paging back once will display records 81 to 90 with record 80's key as the new cursor. Page back again and you're at records 71 to 80 and so forth.

By default, inifinite pagination resets its last page if you overrun the beginning of a list. For example, if you had 100 items and a ```pageSize``` of 30, paging backwards would return records 71-100, 41-70, 11-40 and 1-30. Notice that the last page is still 30 records. The default behavior is to reset the collection to the beginning of the list and return a full page if possible. The set ```retainLastPage: true``` in your options to return records 1-10 instead.

Pros:

- Scales forever
- Users can page forward to discover new records as they're added to the collection
- If a user is on the first page, new records will simply appear as they are added

Cons:

- Must page forward and backward sequentially. Can't skip pages.
- No context for how many pages exist and where the user is in the list
- If a user is on the first page, new records will simply appear as they are added

#### Finite Pagination

Finite pagination makes a single "shallow" REST query to pull all of the collection's keys. See [the docs](https://firebase.google.com/docs/reference/rest/database/#section-param-shallow) on how this is done.  

Once FirebasePaginator has all of the keys, it sorts them and finds the page endpoints. So if we have 100 records with a pageSize of 10, the page endpoints will be the keys for records 10, 20, 30, 40, 50... 100.

Pros:

- Users have context for where they are in the collection.
- Users can skip pages.

Cons:

- Beware of scaling issues. Consider archiving records to [Google Cloud Datastore](https://cloud.google.com/datastore/docs/) if the collection grows too large.
- Must call ```paginator.reset()``` to capture new records the may be added