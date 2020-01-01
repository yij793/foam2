/**
 * @license
 * Copyright 2019 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.ruler.predicate',
  name: 'PropertyNEQValue',

  documentation: `A predicate that returns false when a specific property equals the provided value.
   Both the property name and the desired value must be provided. user can choose the new or old object for evaluation.

   An example of usage: When a pizza object is updated, and the status property is equal to pizzaStatus.COOKED evaluate false.`,

  extends: 'foam.mlang.predicate.AbstractPredicate',
  implements: ['foam.core.Serializable'],

  javaImports: [
    'foam.core.FObject',
    'static foam.mlang.MLang.*'
  ],
  properties: [
    {
      class: 'String',
      name: 'propName'
    },
    {
      class: 'Object',
      name: 'propValue'
    },
    {
      class: 'Boolean',
      name: 'isNew',
      value: true
    }
  ],

  methods: [
    {
      name: 'f',
      javaCode: `
        FObject old = (FObject) OLD_OBJ.f(obj);
        if ( getIsNew() ||
             old == null ) {
          FObject nu  = (FObject) NEW_OBJ.f(obj);
          return NEQ(nu.getClassInfo().getAxiomByName(getPropName()), getPropValue()).f(nu);
        }
        return NEQ(old.getClassInfo().getAxiomByName(getPropName()), getPropValue()).f(old);
      `
    }
  ]
});
