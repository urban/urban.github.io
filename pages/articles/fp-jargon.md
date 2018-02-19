---
title: functional-programming-jargon 
date: "2017-08-23T16:00:00.000Z"
layout: post
category: Programming
tags: []
description: ""
---

# Functional Programming Jargon

### Function

A function is a relationship between a set of possible inputs to a set of
possible outputs. The function itself defines and represents the relationship.
When you apply a function such as the addition of two inputs, it maps those two
inputs to an output – the sum of those two numbers.

### Abstraction (Lambda Calculus)

Lambda Structure and Terms

```
λ x . x
^─┬─^
  └────── extent of the head of the lambda.
λ x . x
  ^────── the single parameter of the
          function. This binds any
          variables with the same name
          in the body of the function.
λ x . x
      ^── body, the expression the lambda
          returns when applied. This is a
          bound variable.
```

The dot (`.`) separates the parameters of the lambda from the function body.

The abstraction as a hole has no name, but the reason we call it an
_abstraction_ is that it is a generalization, or abstraction, from a concrete
instance of a problem, and it abstracts through th introduction of names.

### Saturation

A function is saturated when all of it's arguments have been applied but it has
not been evaluated.

### Beta Reduction

When you can apply a function to an argument, we substitute the input expression
for all instances of bound variables within the body of the abstraction
(function).

### Beta Normal From

Beta normal form is from Lambda Calculus and it is when
you cannot beta reduce (apply lambdas to arguments) the terms any
further.

```
2000 / 1000
// Normal Form = 2
```

### Divergence

Divergence means that the reduction process never terminates or ends. Reducing
terms should normally _converge_ to beta normal form, and divergence is the
opposite of convergence, or normal form.

This matters in programming because terms that diverge are terms that do not
produce an _answer_ or meaningful result.
