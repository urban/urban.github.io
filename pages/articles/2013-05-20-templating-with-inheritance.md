---
title: Templating With Inheritance
date: "2013-05-20T16:00:00.000Z"
layout: post
path: "/articles/2013-05-20-templating-with-inheritance/"
category: Programming
tags: [JavaScript]
description: The [Hogan.js](http://twitter.github.io/hogan.js/) templating engine extends the [Mustache](http://mustache.github.io/) spec by allowing inheritance. This lets you create layouts and [DRY](http://en.wikipedia.org/wiki/Don't_repeat_yourself) up your code without having to use an MVC library. ([demo](/examples/templating-with-inheritance/), [source](https://gist.github.com/urban/5881295))
---

One of the tools I use regularly for both large and small projects is a templating engine. It keeps your code [DRY][] and helps keep things flexible enough to accommodate last minute design changes. Also, with a little practice, it can be just as fast to implement as vanilla HTML.

My go to templating language is [Mustache][] which works for both [Node][] and client-side JavaScript development. It follows the philosophy of a "logic-less" system by prohibiting arbitrary JavaScript code in your templates, only tags. For example, it uses `arrays` and `booleans` instead of `loops` and `if/else` statements. At first glance, this constraint may not seem like an advantage because it requires you to _message_ the data before passing it to your template. However, in the long run, this is a more maintainable and testable approach. It forces you to think in terms of separation of concerns, making your templates cleaner and more re-usable, like they should be.

While the Mustache spec is very powerful, I often find myself in situations where I wish I had `layouts` in addition to `partials` for my templates. This can be achieved using `lambdas` and injecting template processing functions into the context of each template but that [stinks][] in my opinion. Also, some clinet-side MVC like frameworks give you this functionality however I like to keep my prototypes lean whenever possible and a framework is often overkill.

One Mustache implementation that does include inheritance today is [hogan.js][]. This is an undocumented feature that you won't find reading the documentation or using one of the published [builds][]. It is only discussed in the [mustache/spec][] repository under the [Proposal: Template inheritance][] issue. While the Hogan.js [tests][hogan.js tests] show the implementation, the [builds][] do not include this version so for convenience, I created a custom build of [version 3.0][].

To demonstrate the template inheritance implementation I have a slightly contrived [example][demo] of a menu that when selected, spawns a modal window. Each template uses the `modal-layout` that provides the HTML that will wrap the content. What's distinct about this layout is the `{{ $body }}` and `{{ $footer }}` tags. They are custom tags with default content that will be overridden with content if specified in the `foo-modal` and `bar-modal` templates. Both templates are very similar to each other. The only real difference is the `foo-modal` only overrides default content for the `{{ $body }}` tag and not the `{{ $footer }}` tag in the layout.

<div class="alert info">
  <em>Note:</em> JavaScript doesn't have a [here document] syntax so string literal newlines are manually escaped.
</div>

{% gist 5881295 fiddle.js %}

<div class="alert note">
  <em>Note:</em> The `fiddle.css` Gist is purposefully not including however it can be [viewed here][fiddle.css].
</div>

The `index.html` is very bare bones. The only HTML markup is a menu that will spawn the modal windows. It has an `id` attribute that will be used to set up a delegated event listener and anchor links with custom declarative `data-` attributes using the HTML5 Data API. This is a great technique I often use because with it, I no-longer need to add and remove listeners manually on individual DOM elements.

The first listens for `click` events on anchors within the modal menu. When detected, the name of the modal that needs to open is retrieved from the custom `data-modal-name` attribute. Since I'm using [convention over configuration], the name is used as a key to look up the template and corresponding data. The template is then rendered to the DOM with data and any partials and layouts it might need.

The second listener is delegated to the document and controls the removal of the modal.  It listens for a `click` event on an anchor with the `data-js-action=remove` attribute and removes the element that matches the selector in the `data-js-target` attribute from the DOM.

{% gist 5881295 fiddle.html %}

## Next Steps

Templating with inheritance is a powerful tool to have in your arsenal. Once you get comfortable with the concept and implementation you speed up your prototyping and improve the portability of your code across projects. It's a technique I use a lot and I hope this has helped inspire you to use it on your next project.

* [demo][]
* [source][]
* Hogan.js [version 3.0][]

[frog]: http://frogdesign.com
[DRY]: http://en.wikipedia.org/wiki/Don't_repeat_yourself "Don't repeat yourself"
[Mustache]: http://mustache.github.io/ "Mustache templating language"
[Node]: http://nodejs.org/ "Node.js"
[stinks]: http://en.wikipedia.org/wiki/Code_smell "code smells"
[Proposal: Template inheritance]: https://github.com/mustache/spec/issues/38
[mustache/spec]: https://github.com/mustache/spec
[Github]: https://github.com/
[v2.0]: https://github.com/mustache/spec/issues?labels=v2.0.0&page=1&state=open
[hogan.js]: http://twitter.github.io/hogan.js/ "Hogan.js"
[builds]: https://github.com/twitter/hogan.js/tree/master/web/builds
[hogan.js tests]: https://github.com/twitter/hogan.js/blob/master/test/index.js
[version 3.0]: https://github.com/twitter/hogan.js/tree/master/web/builds/3.0.2
[jQuery]: http://jquery.com/
[fiddle.css]: https://gist.github.com/urban/5579302#file-fiddle-css
[here document]: http://en.wikipedia.org/wiki/Here_document
[convention over configuration]: http://en.wikipedia.org/wiki/Convention_over_configuration
[demo]: http://jsfiddle.net/gh/gist/library/pure/5881295/
[source]: https://gist.github.com/urban/5881295
