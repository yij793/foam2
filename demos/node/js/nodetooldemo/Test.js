/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

foam.CLASS({
  package: 'nodetooldemo',
  name: 'Test',
  extends: 'nodetooldemo.TestBaseClass',
  requires: [
    'nodetooldemo.TestCircular',
    'nodetooldemo.TestRequire',
  ],
  messages: [
    {
      name: 'MY_STRING',
      messageMap: {
        en: 'English',
        fr: 'Francais',
      }
    }
  ],
  properties: [
    'name',
/* TODO: Custom property classes need to be handled properly.
    {
      class: 'nodetooldemo.TestCustomProperty',
      name: 'customProp',
    },
*/
  ],
  actions: [
    {
      name: 'execute',
      code: function() {
        console.log('Hello', this.name);
        console.log('Hello', this.customProp);
        console.log('Hello', this.MY_STRING);
        console.log(this.TestRequire.model_.id);
        console.log(this.TestCircular.model_.id);
      },
    },
  ],
});
