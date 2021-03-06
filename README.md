Ohm
===

[Ohm](https://github.com/cdglabs/ohm) is a library and domain-specific language for parsing and
pattern matching. You can use it to parse custom file formats, transform complex data structures,
and quickly build parsers, interpreters, and compilers for programming languages. The _Ohm language_
is based on [parsing expression grammars](http://en.wikipedia.org/wiki/Parsing_expression_grammar)
(PEGs), which are a formal way of describing syntax, similar to regular expressions and context-free
grammars. The _Ohm library_ provides a JavaScript interface (known as Ohm/JS) for creating parsers,
interpreters, and more from the grammars you write.

Like its older sibling [OMeta](http://tinlizzie.org/ometa/), Ohm supports object-oriented grammar
extension and allows pattern matching on structured data as well as strings. One thing that
distinguishes Ohm from other parsing tools is that it completely separates grammars from semantic
actions. In Ohm, a grammar defines a language, and semantic actions specify what to do with valid
inputs in that language. Semantic actions are written in the _host language_ -- e.g., for Ohm/JS,
the host language is JavaScript. Ohm grammars, on the other hand, work without modification in any
host language. This separation improves modularity, and makes both grammars and semantic actions
easier to read and understand.

Usage
-----

### Getting Started

For Node.js and io.js (**Note:** As soon as Ohm is ready for release, it will be published on NPM):

    npm install -g https://github.com/cdglabs/ohm.git

Then require it from anywhere:

```js
var ohm = require('ohm');
var g = ohm.grammar('MyGrammar { greeting = "Hello" | "Hola" }');
var result = g.match('Hallo');
if (result.failed()) console.log(result.message);
```

For use in the browser, simply download [dist/ohm.js](./dist/ohm.js) or
[dist/ohm.min.js](./dist/ohm.min.js), and add it as a script tag to your page:

```html
<script src="ohm.min.js"></script>
<script>
  var g = ohm.grammar('MyGrammar { greeting = "Hello" | "Hola" }');
  var result = g.match('hola');
  if (result.failed()) console.log(result.message);
</script>
```

### Basics

#### Instantiating Grammars

To use Ohm, you'll need a grammar that is written in the Ohm language. The grammar provides a formal
definition of the language or data format that you want to parse. In the examples above, the grammar
was simply stored as a string literal in the source code. This works for simple examples, but for
larger grammars, you'll probably want to do things differently. If you are using Node or io.js, you
can store the grammar in a separate file (e.g. 'myGrammar.ohm') and use it like this:

```js
var fs = require('fs');
var ohm = require('ohm');
var myGrammar = ohm.grammar(fs.readFileSync('myGrammar.ohm').toString());
```

In the browser, you can put the grammar into a separate script element, with `type="text/ohm-js"`:

```html
<script type="text/ohm-js" id="grammarSrc">
  MyGrammar {
    greeting = "Hello" | "Hola"
  }
</script>
```

Then, you can instantiate the grammar like this:

```js
var myGrammar = ohm.grammarFromScriptElement();
```

If you have more than one script tag with `type="text/ohm-js"` in your document, you will need to
pass the appropriate script tag as an argument:

```js
var myGrammar = ohm.grammarFromScriptElement(document.querySelector('#grammarSrc'));
```

To instantiate multiple grammars at once, use `ohm.grammars()` and
`ohm.grammarsFromScriptElements()`.

#### Using Grammars

Once you've instantiated a grammar object, you can use the grammar's `match()` method:

```js
var userInput = 'Hello';
var m = myGrammar.match(userInput);
if (m.succeeded()) {
  console.log('Greetings, human.');
} else {
  console.log("That's not a greeting!");
}
```

For more information, see [main documentation](./doc/index.md).

### Debugging

Ohm has two tools to help you debug grammars: a text trace, and a graphical visualizer. The
visualizer is still under development (i.e., it might be buggy!) but it can still be useful.

![Ohm Visualizer](http://www.cdglabs.org/ohm/doc/images/visualizer-small.png)

To run the visualizer, just open `visualizer/index.html` in your web browser.

To see the text trace for a grammar `g`, just use the [`g.trace()`](./doc/api-reference.md#trace)
method instead of `g.match`. It takes the same arguments, but instead of returning a MatchResult
object, it returns a Trace object -- calling its `toString` method returns a string describing
all of the decisions the parser made when trying to match the input. For example, here is the
result of `g.trace('ab')` for the grammar `G { start = letter+ }`:

<script type="text/markscript">
  markscript.transformNextBlock(function(code) {
    var trace = ohm.grammar('G { start = letter+ }').trace('ab');
    assert.equal(trace.toString().trim(), code.trim());
  });
</script>

```
ab         ✓ start ⇒  "ab"
ab           ✓ letter+ ⇒  "ab"
ab             ✓ letter ⇒  "a"
ab                 ✓ lower ⇒  "a"
ab                   ✓ Unicode {Ll} character ⇒  "a"
b              ✓ letter ⇒  "b"
b                  ✓ lower ⇒  "b"
b                    ✓ Unicode {Ll} character ⇒  "b"
               ✗ letter
                   ✗ lower
                     ✗ Unicode {Ll} character
                   ✗ upper
                     ✗ Unicode {Lu} character
                   ✗ unicodeLtmo
                     ✗ Unicode {Ltmo} character
             ✓ end ⇒  ""
```

Contributing
------------

All you need to get started:

    git clone https://github.com/cdglabs/ohm.git
    cd ohm
    npm install

**NOTE:** We recommend using the latest Node.js stable release (>=0.12.1) for
development. Some of the JSDOM-based tests are flaky on io.js, and other tests
will reliably fail on older versions of Node.

### Some useful scripts

* `npm test` runs the unit tests.
* `npm run test-watch` re-runs the unit tests every time a file changes.
* `npm run build` builds [dist/ohm.js](./dist/ohm.js) and [dist/ohm.min.js](./dist/ohm.min.js),
  which are stand-alone bundles that can be included in a webpage.
* When editing Ohm's own grammar (in `src/ohm-grammar.ohm`), run `npm run bootstrap` to re-build Ohm
  and test your changes.

Before submitting a pull request, be sure to add tests, and ensure that `npm run prepublish` runs
without errors.
