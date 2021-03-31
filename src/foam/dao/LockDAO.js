/**
 * @license
 * Copyright 2021 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.dao',
  name: 'LockDAO',
  extends: 'foam.dao.ProxyDAO',

  documentation: `
    A DAO Decorator which prevents concurrent operations.
    This should not be used on server DAOs as doing so can enable DOS attacks.
  `,

  requires: [
    'foam.core.Lock'
  ],

  properties: [
    {
      name: 'lock',
      class: 'FObjectProperty',
      of: 'foam.core.Lock',
      factory: function () {
        return this.Lock.create();
      }
    }
  ],

  methods: [
    function put_(x, obj) {
      return new Promise(resolve => {
        this.lock.then(() => {
          resolve(this.SUPER(x, obj));
        });
      });
    },

    function remove_(x, obj) {
      return new Promise(resolve => {
        this.lock.then(() => {
          resolve(this.SUPER(x, obj));
        });
      });
    },

    function removeAll_(x, sink, skip, limit, order, predicate) {
      return new Promise(resolve => {
        this.lock.then(() => {
          resolve(this.SUPER(x, sink, skip, limit, order, predicate));
        });
      });
    },
  ]
});
