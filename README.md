# firebase-paginator-web
Paginate your Firebase 3.0 collections with JavaScript

### Installation

- NPM: ```npm install --save firebase-paginator```
- Bower: ```bower install --save firebase-paginator```

### Test

- ```npm install```
- ```npm test```

### Usage

If you're in Node.js, you'll need to do something like ```var FirebasePaginator = require('firebase-paginator')```. 

If you're in the browser, you'll have access to FirebasePaginator on the ```window``` object like so: ```var FirebasePaginator = window.FirebasePaginator;```

Once you have your ```FirebasePaginator``` object, the rest is isomorphic JavaScript. Just pass in a Firebase ref and start configuring.

```
var paginator = new FirebasePaginator(ref);

``` 
