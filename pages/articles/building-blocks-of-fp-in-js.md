---
title: Bulding Blocks of FP in JS
date: "2017-01-24-17T16:00:00.000Z"
layout: post
category: Programming
tags: [JavaScript]
description: ''
---


FP terminology:

* function
* arity
* first class functions
* [Referential transparency][] & pure functions
* immutable
* higher order functions
* partial application
* pointer free style


Functions:

* flip
* curry
* compose

#### Disclaimer

This article assumes you already know what a closure and higher-order functions

[Currying
ES5](http://ramdajs.com/repl/?v=0.23.0#?function%20currier%20%28fn%29%20%7B%0A%20%20var%20arity%20%3D%20fn.length%0A%20%20var%20slice%20%3D%20Array.prototype.slice%0A%20%20function%20resolver%20%28%29%20%7B%0A%20%20%20%20var%20memory%20%3D%20slice.call%28arguments%29%0A%20%20%20%20return%20function%20%28%29%20%7B%0A%20%20%20%20%20%20var%20local%20%3D%20memory.concat%28slice.call%28arguments%29%29%0A%20%20%20%20%20%20var%20next%20%3D%20local.length%20%3E%3D%20arity%20%3F%20fn%20%3A%20resolver%0A%20%20%20%20%20%20return%20next.apply%28null%2C%20local%29%0A%20%20%20%20%7D%0A%20%20%7D%0A%20%20return%20resolver%28%29%0A%7D%0A%0Avar%20addition%20%3D%20currier%28%28a%2C%20b%29%20%3D%3E%20a%20%2B%20b%29%0Avar%20addFive%20%3D%20addition%285%29%0AaddFive%281%29)

[Currying ES6](http://ramdajs.com/repl/?v=0.23.0#?function%20currier%20%28fn%29%20%7B%0A%20%20const%20arity%20%3D%20fn.length%0A%20%20function%20resolver%20%28...memory%29%20%7B%0A%20%20%20%20return%20function%20%28%29%20%7B%0A%20%20%20%20%20%20const%20local%20%3D%20%5B...memory%2C%20...arguments%5D%0A%20%20%20%20%20%20const%20next%20%3D%20local.length%20%3E%3D%20arity%20%3F%20fn%20%3A%20resolver%0A%20%20%20%20%20%20return%20next.apply%28null%2C%20local%29%0A%20%20%20%20%7D%0A%20%20%7D%0A%20%20return%20resolver%28%29%0A%7D%0A%0Aconst%20addition%20%3D%20currier%28%28a%2C%20b%2C%20c%29%20%3D%3E%20a%20%2B%20b%20%2B%20c%29%0Aconst%20addFive%20%3D%20addition%285%29%0AaddFive%281%2C1%29)

[All
Together](http://ramdajs.com/repl/?v=0.23.0#?function%20currier%20%28fn%29%20%7B%0A%20%20var%20arity%20%3D%20fn.length%0A%20%20var%20slice%20%3D%20Array.prototype.slice%0A%20%20function%20resolver%20%28%29%20%7B%0A%20%20%20%20var%20memory%20%3D%20slice.call%28arguments%29%0A%20%20%20%20return%20function%20%28%29%20%7B%0A%20%20%20%20%20%20var%20local%20%3D%20memory.concat%28slice.call%28arguments%29%29%0A%20%20%20%20%20%20var%20next%20%3D%20local.length%20%3E%3D%20arity%20%3F%20fn%20%3A%20resolver%0A%20%20%20%20%20%20return%20next.apply%28null%2C%20local%29%0A%20%20%20%20%7D%0A%20%20%7D%0A%20%20return%20resolver%28%29%0A%7D%0A%0Afunction%20flipper%20%28fn%29%20%7B%0A%20%20return%20currier%28function%20%28a%2C%20b%29%20%7B%0A%20%20%20%20return%20fn.apply%28this%2C%20%5Bb%2C%20a%5D%29%0A%20%20%7D%29%0A%7D%0A%0Afunction%20fixArity%20%28fn%29%20%7B%0A%20%20return%20currier%28flipper%28function%20%28a%2C%20b%29%20%7B%0A%20%20%20%20return%20fn.call%28a%2C%20b%29%0A%20%20%7D%29%29%0A%7D%0A%0Avar%20addition%20%3D%20currier%28%28a%2C%20b%29%20%3D%3E%20a%20%2B%20b%29%0Avar%20addFive%20%3D%20addition%285%29%0A%2F%2FaddFive%281%29%0A%0Avar%20mapper%20%3D%20fixArity%28Array.prototype.map%29%0Avar%20concatter%20%3D%20fixArity%28Array.prototype.concat%29%0Avar%20conn%20%3D%20fixArity%28Array.prototype.concat%29%0A%0A%2F%2Fvar%20concatter%20%3D%20%28a%2C%20b%29%20%3D%3E%20a.concat%28b%29%0A%2F%2Fvar%20con%20%3D%20flipper%28concatter%29%0A%2F%2F%20conn%28%5B1%2C%202%2C%203%5D%2C%20%5B4%2C%205%2C%206%5D%29%0A%2F%2F%20concatter%28%5B1%2C%202%2C%203%5D%2C%20%5B4%2C%205%2C%206%5D%29%0Amapper%28%28a%29%20%3D%3E%20a%20%2B%202%2C%20%5B1%2C%202%2C%203%5D%29)

[Referential transparency]: https://wiki.haskell.org/Referential_transparency
