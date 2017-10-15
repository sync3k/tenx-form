Tenx Form
===

TenX Form is a custom HTML element that provides offline-first synchronization to web forms. Built on top of [sync3k](http://github.com/google/sync3k-client), the aim of the project is to make it painless to utilize sync3k without any JavaScript coding.

Example Code
---

```html
<tenx-form
  sync3k-base-url="wss://demo.sync3k.io/kafka" 
  sync3k-topic="tenx-form-demo" 
  result-div="tenx-result" 
  result-template="result-template">

  <label for="name">Name</label>
  <input type="text" id="name">
  <br>

  <label for="email">Email</label>
  <input type="text" id="email">
  <br>

  <input type="submit" value="Send!">
</tenx-form>

<div id="tenx-result"></div>
<template id="result-template">
  <ul>
    <li>
      <b>Name</b>
      <span tenx-name="name" />
    </li>
    <li>
      <b>Email</b>
      <span tenx-name="email" />
    </li>
  </ul>
</template>
```

`tenx-form` tag requires the following attributes:

  * `sync3k-base-url` and `sync3k-topic` specifies sync3k backend that the client should talk to
  * `result-div` is a place holder div id where the submitted results will be rendered
  * `result-template` is a template element with whose child elements with `tenx-name` attributes will have the value of the corresponding submitted content

Please see [`index.html`](https://github.com/sync3k/tenx-form/blob/master/index.html) for the full blown example, and the [live demo](https://tenx-form-demo.sync3k.io/).
