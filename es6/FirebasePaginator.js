/* eslint-disable */

import FinitePagingStrategy from './FirebasePaginatorFiniteStrategy';
import InfinitePagingStrategy from './FirebasePaginatorInfiniteStrategy';

class FirebasePaginator {
  constructor(ref, defaults) {
    this.defaults = defaults || {};
    this.pages = {};
    this.pageSize = defaults.pageSize ? parseInt(defaults.pageSize, 10) : 10;
    this.isFinite = defaults.finite ? defaults.finite : false;
    this.retainLastPage = defaults.retainLastPage || false;
    this.auth = defaults.auth;
    this.ref = ref;
    this.isBrowser = defaults.isBrowser;
    this.events = {};
    this.pageCount;

    // Events
    this.listen = callback => {
      this.allEventHandler = callback;
    };

    this.fire = this.fire.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.once = this.once.bind(this);

    // Pagination can be finite or infinite. Infinite pagination is the default.
    const paginator = this;
    if (this.isFinite) {
      //this.setupFinite();
      this.strategy = new FinitePagingStrategy(paginator);
    } else {
      this.strategy = new InfinitePagingStrategy(paginator);
    }

    this.next = this.next.bind(this);
    this.previous = this.previous.bind(this);
    this.goToPage = this.goToPage.bind(this);

    console.log('FirebasePaginator constructor this: ', this);
  }

  fire(eventName, payload) {
    if (typeof this.allEventHandler === 'function') {
      this.allEventHandler.call(this, eventName, payload);
    }

    if (this.events[eventName] && this.events[eventName].queue) {
      const queue = events[eventName].queue.reverse();
      let i = queue.length;
      while (i--) {
        if (typeof queue[i] === 'function') {
          queue[i].call(this, payload);
        }
      }
    }
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = {
        queue: []
      };
    }
    this.events[eventName].queue.push(callback);
  }

  off(eventName, callback) {
    if (this.events[eventName] && this.events[eventName].queue) {
      const queue = this.events[eventName].queue;
      let i = queue.length;
      while (i--) {
        if (queue[i] === callback) {
          queue.splice(i, 1);
        }
      }
    }
  }

  once(eventName, callback) {
    return new Promise((resolve, reject) => {
      const handler = payload => {
        this.off(eventName, handler);
        if (typeof callback === 'function') {
          try {
            resolve(callback.call(this, payload));
          } catch (e) {
            reject(e);
          }
        } else {
          resolve(payload);
        }
      };
      this.on(eventName, handler);
    });
  }

  // strategies based on finite or infinite
  next() {
    return this.strategy.next();
  }
  previous() {
    return this.strategy.previous();
  }
  reset() {
    return this.strategy.reset();
  }
  goToPage(pageNumber) {
    console.log('access this.strategy', this.strategy);

    if (isFinite) return this.strategy.goToPage(pageNumber);
    else
      return new Promise((resolve, reject) => {
        reject({ message: 'infinite does not support paging' });
      });
  }
}

export default FirebasePaginator;
