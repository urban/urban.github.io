webpackJsonp([59053860788479],{424:function(n,a){n.exports={data:{site:{siteMetadata:{title:"Urban Faubion / Design Technologist",author:"Urban Faubion"}},markdownRemark:{id:"/Users/urban/Documents/Projects/urban.github.io/data/article/2013-05-20-templating-with-inheritance/index.md absPath of file >>> MarkdownRemark",html:'<p>One of the tools I use regularly for both large and small projects is a templating engine. It keeps your code <a href="http://en.wikipedia.org/wiki/Don&#x27;t_repeat_yourself" title="Don&#x27;t repeat yourself">DRY</a> and helps keep things flexible enough to accommodate last minute design changes. Also, with a little practice, it can be just as fast to implement as vanilla HTML.</p>\n<p>My go to templating language is <a href="http://mustache.github.io/" title="Mustache templating language">Mustache</a> which works for both <a href="http://nodejs.org/" title="Node.js">Node</a> and client-side JavaScript development. It follows the philosophy of a “logic-less” system by prohibiting arbitrary JavaScript code in your templates, only tags. For example, it uses <code class="language-text">arrays</code> and <code class="language-text">booleans</code> instead of <code class="language-text">loops</code> and <code class="language-text">if/else</code> statements. At first glance, this constraint may not seem like an advantage because it requires you to <em>message</em> the data before passing it to your template. However, in the long run, this is a more maintainable and testable approach. It forces you to think in terms of separation of concerns, making your templates cleaner and more re-usable, like they should be.</p>\n<p>While the Mustache spec is very powerful, I often find myself in situations where I wish I had <code class="language-text">layouts</code> in addition to <code class="language-text">partials</code> for my templates. This can be achieved using <code class="language-text">lambdas</code> and injecting template processing functions into the context of each template but that <a href="http://en.wikipedia.org/wiki/Code_smell" title="code smells">stinks</a> in my opinion. Also, some clinet-side MVC like frameworks give you this functionality however I like to keep my prototypes lean whenever possible and a framework is often overkill.</p>\n<p>One Mustache implementation that does include inheritance today is <a href="http://twitter.github.io/hogan.js/" title="Hogan.js">hogan.js</a>. This is an undocumented feature that you won’t find reading the documentation or using one of the published <a href="https://github.com/twitter/hogan.js/tree/master/web/builds">builds</a>. It is only discussed in the <a href="https://github.com/mustache/spec">mustache/spec</a> repository under the <a href="https://github.com/mustache/spec/issues/38">Proposal: Template inheritance</a> issue. While the Hogan.js <a href="https://github.com/twitter/hogan.js/blob/master/test/index.js">tests</a> show the implementation, the <a href="https://github.com/twitter/hogan.js/tree/master/web/builds">builds</a> do not include this version so for convenience, I created a custom build of <a href="https://github.com/twitter/hogan.js/tree/master/web/builds/3.0.2">version 3.0</a>.</p>\n<p>To demonstrate the template inheritance implementation I have a slightly contrived <a href="http://jsfiddle.net/gh/gist/library/pure/5881295/">example</a> of a menu that when selected, spawns a modal window. Each template uses the <code class="language-text">modal-layout</code> that provides the HTML that will wrap the content. What’s distinct about this layout is the <code class="language-text">{{ $body }}</code> and <code class="language-text">{{ $footer }}</code> tags. They are custom tags with default content that will be overridden with content if specified in the <code class="language-text">foo-modal</code> and <code class="language-text">bar-modal</code> templates. Both templates are very similar to each other. The only real difference is the <code class="language-text">foo-modal</code> only overrides default content for the <code class="language-text">{{ $body }}</code> tag and not the <code class="language-text">{{ $footer }}</code> tag in the layout.</p>\n<div class="alert info">\n  <em>Note:</em> JavaScript doesn\'t have a [here document] syntax so string literal newlines are manually escaped.\n</div>\n<div class="gatsby-highlight">\n      <pre class="language-js"><code class="language-js"><span class="token operator">!</span><span class="token punctuation">(</span><span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>\n  <span class="token keyword">var</span> <span class="token constant">TEMPLATES</span> <span class="token operator">=</span> <span class="token punctuation">(</span>window<span class="token punctuation">.</span><span class="token constant">TEMPLATES</span> <span class="token operator">=</span> window<span class="token punctuation">.</span><span class="token constant">TEMPLATES</span> <span class="token operator">||</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n  <span class="token comment">//  modal-layout</span>\n  <span class="token constant">TEMPLATES</span><span class="token punctuation">[</span><span class="token string">"modal-layout"</span><span class="token punctuation">]</span> <span class="token operator">=</span> Hogan<span class="token punctuation">.</span><span class="token function">compile</span><span class="token punctuation">(</span>\n    <span class="token string">\' \\\n                      &lt;section class="modal {{ class-names }}"> \\\n                        &lt;div class="modal-chrome"> \\\n                          &lt;header> \\\n                            &lt;h3>{{ title }}&lt;/h3> \\\n                            {{# has-close-button }} \\\n                            &lt;a href="#" class="close" data-js-action="remove" data-js-target="body > .modal">X&lt;/a> \\\n                            {{/ has-close-button}} \\\n                          &lt;/header> \\\n                          &lt;div class="modal-content"> \\\n                            {{$ body }} \\\n                              Default content! \\\n                            {{/ body }} \\\n                          &lt;/div> \\\n                          {{$ footer }}{{/ footer }} \\\n                        &lt;/div> \\\n                      &lt;/section> \\\n                      \'</span>\n  <span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n  <span class="token comment">//  foo-modal</span>\n  <span class="token constant">TEMPLATES</span><span class="token punctuation">[</span><span class="token string">"foo-modal"</span><span class="token punctuation">]</span> <span class="token operator">=</span> Hogan<span class="token punctuation">.</span><span class="token function">compile</span><span class="token punctuation">(</span>\n    <span class="token string">" \\\n                      {{&lt; modal-layout }} \\\n                        {{$ body }} \\\n                          &lt;p>This is the &lt;b>foo&lt;/b> modal!&lt;/p> \\\n                        {{/ body }} \\\n                      {{/ modal-layout }} \\\n                      "</span>\n  <span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n  <span class="token comment">//  bar-modal</span>\n  <span class="token constant">TEMPLATES</span><span class="token punctuation">[</span><span class="token string">"bar-modal"</span><span class="token punctuation">]</span> <span class="token operator">=</span> Hogan<span class="token punctuation">.</span><span class="token function">compile</span><span class="token punctuation">(</span>\n    <span class="token string">\' \\\n                      {{&lt; modal-layout }} \\\n                        {{$ body }} \\\n                          &lt;p>This is the &lt;b>bar&lt;/b> modal!&lt;/p> \\\n                        {{/ body }} \\\n                        {{$ footer }} \\\n                          &lt;footer> \\\n                            &lt;a href="#" data-js-action="remove" data-js-target="body > .modal">Cancel&lt;/a> \\\n                            &lt;a href="#" data-js-action="remove" data-js-target="body > .modal">Okay&lt;/a> \\\n                          &lt;/footer> \\\n                        {{/ footer }} \\\n                      {{/ modal-layout }} \\\n                      \'</span>\n  <span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></code></pre>\n      </div>\n<div class="alert note">\n  <em>Note:</em> The `fiddle.css` Gist is purposefully not including however it can be [viewed here][fiddle.css].\n</div>\n<p>The <code class="language-text">index.html</code> is very bare bones. The only HTML markup is a menu that will spawn the modal windows. It has an <code class="language-text">id</code> attribute that will be used to set up a delegated event listener and anchor links with custom declarative <code class="language-text">data-</code> attributes using the HTML5 Data API. This is a great technique I often use because with it, I no-longer need to add and remove listeners manually on individual DOM elements.</p>\n<p>The first listens for <code class="language-text">click</code> events on anchors within the modal menu. When detected, the name of the modal that needs to open is retrieved from the custom <code class="language-text">data-modal-name</code> attribute. Since I’m using <a href="http://en.wikipedia.org/wiki/Convention_over_configuration">convention over configuration</a>, the name is used as a key to look up the template and corresponding data. The template is then rendered to the DOM with data and any partials and layouts it might need.</p>\n<p>The second listener is delegated to the document and controls the removal of the modal. It listens for a <code class="language-text">click</code> event on an anchor with the <code class="language-text">data-js-action=remove</code> attribute and removes the element that matches the selector in the <code class="language-text">data-js-target</code> attribute from the DOM.</p>\n<div class="gatsby-highlight">\n      <pre class="language-html"><code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>nav</span> <span class="token attr-name">id</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>modal-menu<span class="token punctuation">"</span></span> <span class="token attr-name">class</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>menu<span class="token punctuation">"</span></span><span class="token punctuation">></span></span>\n  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>dl</span><span class="token punctuation">></span></span>\n    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>dt</span><span class="token punctuation">></span></span>Modal Menu<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>dt</span><span class="token punctuation">></span></span>\n    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>dd</span><span class="token punctuation">></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>#<span class="token punctuation">"</span></span> <span class="token attr-name">data-modal-name</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>foo-modal<span class="token punctuation">"</span></span><span class="token punctuation">></span></span>Show foo!<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>dd</span><span class="token punctuation">></span></span>\n    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>dd</span><span class="token punctuation">></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>#<span class="token punctuation">"</span></span> <span class="token attr-name">data-modal-name</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>bar-modal<span class="token punctuation">"</span></span><span class="token punctuation">></span></span>Show bar!<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>dd</span><span class="token punctuation">></span></span>\n  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>dl</span><span class="token punctuation">></span></span>\n<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>nav</span><span class="token punctuation">></span></span>\n\n<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script language-javascript">\n\n  <span class="token comment">// template data</span>\n  <span class="token keyword">var</span> data <span class="token operator">=</span> <span class="token punctuation">{</span>\n    <span class="token string">"foo-modal"</span><span class="token punctuation">:</span> <span class="token punctuation">{</span>\n      <span class="token string">"title"</span><span class="token punctuation">:</span> <span class="token string">"Foo Modal"</span><span class="token punctuation">,</span>\n      <span class="token string">"has-close-button"</span><span class="token punctuation">:</span> <span class="token boolean">true</span>\n    <span class="token punctuation">}</span><span class="token punctuation">,</span>\n    <span class="token string">"bar-modal"</span><span class="token punctuation">:</span> <span class="token punctuation">{</span>\n      <span class="token string">"title"</span><span class="token punctuation">:</span> <span class="token string">"Bar Modal"</span><span class="token punctuation">,</span>\n      <span class="token string">"class-names"</span><span class="token punctuation">:</span> <span class="token string">"bar-modal"</span>\n    <span class="token punctuation">}</span>\n  <span class="token punctuation">}</span><span class="token punctuation">;</span>\n\n  <span class="token comment">// create modal</span>\n  <span class="token function">$</span><span class="token punctuation">(</span><span class="token string">"#modal-menu"</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">on</span><span class="token punctuation">(</span><span class="token string">"click"</span><span class="token punctuation">,</span> <span class="token string">"a"</span><span class="token punctuation">,</span> <span class="token keyword">function</span> <span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n    event<span class="token punctuation">.</span><span class="token function">preventDefault</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token keyword">var</span> modalName <span class="token operator">=</span> <span class="token function">$</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">data</span><span class="token punctuation">(</span><span class="token string">"modal-name"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token keyword">var</span> output <span class="token operator">=</span> <span class="token constant">TEMPLATES</span><span class="token punctuation">[</span>modalName<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">render</span><span class="token punctuation">(</span>data<span class="token punctuation">[</span>modalName<span class="token punctuation">]</span><span class="token punctuation">,</span> <span class="token constant">TEMPLATES</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token function">$</span><span class="token punctuation">(</span><span class="token string">"body"</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">append</span><span class="token punctuation">(</span>output<span class="token punctuation">)</span><span class="token punctuation">;</span>\n  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n  <span class="token comment">// remove modal</span>\n  <span class="token function">$</span><span class="token punctuation">(</span>document<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">on</span><span class="token punctuation">(</span><span class="token string">"click"</span><span class="token punctuation">,</span> <span class="token string">"a[data-js-action=\'remove\']"</span><span class="token punctuation">,</span> <span class="token keyword">function</span> <span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n    event<span class="token punctuation">.</span><span class="token function">preventDefault</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token keyword">var</span> target <span class="token operator">=</span> <span class="token function">$</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">data</span><span class="token punctuation">(</span><span class="token string">"js-target"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token function">$</span><span class="token punctuation">(</span>target<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">remove</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span></code></pre>\n      </div>\n<h2>Next Steps</h2>\n<p>Templating with inheritance is a powerful tool to have in your arsenal. Once you get comfortable with the concept and implementation you speed up your prototyping and improve the portability of your code across projects. It’s a technique I use a lot and I hope this has helped inspire you to use it on your next project.</p>\n<ul>\n<li><a href="http://jsfiddle.net/gh/gist/library/pure/5881295/">demo</a></li>\n<li><a href="https://gist.github.com/urban/5881295">source</a></li>\n<li>Hogan.js <a href="https://github.com/twitter/hogan.js/tree/master/web/builds/3.0.2">version 3.0</a></li>\n</ul>',frontmatter:{title:"Templating With Inheritance",date:"May 20, 2013"}}},pathContext:{slug:"/article/2013-05-20-templating-with-inheritance/",next:{fields:{slug:"/article/2013-09-24-tmux/"},frontmatter:{title:"Using tmux",draft:null}}}}}});
//# sourceMappingURL=path---article-2013-05-20-templating-with-inheritance-c2386fc6ee03cf97bafe.js.map