---
title: Coding Challenges
date: "2017-01-17T16:00:00.000Z"
layout: post
category: Programming
tags: [JavaScript]
description: ''
---

Coding challenges are a great way to learn new languages or train in a language
you already know. Successfully passing a coding challenge is not a good
predictor of your future success however failing to pass can show gaps in your
knowledge and reasoning.

Research suggests that people fall into two different populations when it comes
to computer programming. Those that understand assignment, iteration, recursion
and those that do not. This is the reason why people are asked coding challenges
in interviews is because in order to answer them, you need to understand many
vital programming concepts such as variables, function calls, scope and of
course loops and recursion. You also have to have the mental flexibility to
approach the problem from different angles and move between different
manifestations of the same concepts.

They are also used when interviewing for a technical job because they can help
indicate what you know today. Getting the correct answer isn't the only thing
interviewers should be looking for. They also want to know how you think in
order to get a better understanding of what it would be like working together.

Some of the things they can learn when observing you are:

* How do you approach problems?
* Can you articulate their thought process?
* What tools and programming paradigms do you use?
* What do you do when you get stuck?

There are no right and wrong answers to the questions above but it's always
helpful to articulate your thought process so they can see how you work.

What a coding challenge doesn't do is identify whether or not you're capable of
learning. It can show you what you know today but it doesn't represent your
ability to learn and adapt to changing environments.

## Example Challenge

The following multi-part coding challenges that centers around the concept of a palindrome. Each
successive part in the series builds on the previous one and should be done in order.

> A palindrome is a word, phrase, number, or other sequence of characters which
> reads the same backward or forward, such as madam or kayak.<br/>
> – [Wikipedia](https://en.wikipedia.org/wiki/Palindrome)

### Part 1: Is Palindrome

Write a function called `isPalindrome` that takes a string and returns `true` if it is a palindrome.
The argument passed into the `isPalindrome` function will always be a string
and will not contain spaces.

For example, given the following input, your function should return the
commented out boolean.

```js
isPalindrome('abc')     //=> false
isPalindrome('xyz')     //=> false
isPalindrome('')        //=> true
isPalindrome('aba')     //=> true
isPalindrome('aabbbaa') //=> true
isPalindrome('kayak')   //=> true
```

#### Solutions

The following is a solution that uses a while loop.

```js
function isPalindrome (str) {
  let result = true
  while (str.length) {
    if (str.charAt(0) != str.charAt(str.length - 1)) result = false
    str = str.substr(1, str.length - 2)
  }
  return result
}
```

[Try in REPL][CHALLANGE-1.1]

Another solution using recursion.

```js
function isPalindrome (str) {
  if (str.length <= 1) return true
  if (str.charAt(0) != str.charAt(str.length - 1)) return false
  return isPalindrome( str.substr(1, str.length - 2) )
}
```

[Try in REPL][CHALLANGE-1.2]

I prefer the recursive solutions to the imperative loop because it is pure and doesn't use destructive state updates. Unbounded and thoughtless use of recursion can lead to stack overflow issues, however, your call stack size is directly related to the size of your input and ECMAScript 2015 offers [tail call optimization][].

A variation on this first part could be the translating of the imperative loop to a recursive solution. Through a refactoring, you can quickly filter out the non-programmers.

### Part 2: Refactoring Is Palindrome

Write a function called `isPalindrome` that can take a word, phrase, number, or other sequence of
characters and returns `true` if it is a palindrome.

For example, given the following input, your function should return the
commented out boolean.

```js
isPalindrome('abc')           //=> false
isPalindrome('xyz')           //=> false
isPalindrome('')              //=> true
isPalindrome('aba')           //=> true
isPalindrome('aabbbaa')       //=> true
isPalindrome('kayak')         //=> true
isPalindrome(['a', 'b', 'c']) //=> false
isPalindrome(['a', 'b', 'a']) //=> true
isPalindrome([1, 2, 1])       //=> true
isPalindrome(123)             //=> false
isPalindrome(12321)           //=> true
isPalindrome(undefined)       //=> false
isPalindrome(null)            //=> false
isPalindrome('nurses run')    //=> true
```

#### Solutions

```js
function isPalindrome (xs) {
  xs = String(xs).replace(/\s/g, '')
  if (xs.length <= 1) return true
  if (xs[0] != xs[xs.length - 1]) return false
  return isPalindrome( xs.slice(1, xs.length - 1) )
}

```

[Try in REPL][CHALLANGE-2]

We need to convert the value being passed into our function as a string primitive. In JavaScript, there are 2 ways to do this. I prefer the second approach because it's explicit.

1. Type coercion using the plus operator: `'' + value`
2. Function call in a non-constructor context (i.e., without using the `new` keyword): `String(value)`

By converting the value to a string, we now get the following.

```js
String('abc')     //=> 'abc'
String([1, 2, 3]) //=> '123'
String(undefined) //=> 'undefined'
```

Lastly, we can stripping out whitespace in order to handle phrases such as "nurses run".

I also took the opportunity to change how I am indexing the characters within the string. As of ECMAScript 5 you can treat strings as array-like objects so you can index characters numerically. This means the following two lines are equivalent.

```js
'cat'.charAt(1) //=> 'a'
'cat'[1]        //=> 'a'
```

### Part 3: Longest Palindrome

##### Solution

This first solution uses a nested loop to iterate through all combinations. At each step in the outer loop, you reduce your list by one letter from the right. You then loop over your new list, checking if it is a palindrome and removing a letter from the right.

```js
function longestPalindrome (xs) {
  xs = String(xs)
  const len = xs.length
  if (len <= 1) return xs

  let result = ''
  for (let i = 0; i <= xs.length; i++) {
    if (/\s/.test(xs[i])) continue
    for (let k = 0; k <= xs.length - i; k++) {
      const str = xs.slice(i, k + i)
      if (isPalindrome(str) && str.length > result.length) {
        result = str
      }
    }
  }
  return result
}
```

[Try in REPL][CHALLANGE-3]

Another solution would be to change how you test for finding a palindrome. Instead of testing from the outside in, we flip it and test from the center outward. With our new expanding `isPalindrome` test, we can iterate in one loop from the first item to the last in our list.

```js
function longestPalindrome (xs) {
  const len = xs.length
  const isEven = (x) => x % 2 === 0
  let result = ''

  function isPalindrome (left, right) {
    while (xs[left] === xs[right] && left >= 0 && right < len) {
      left--
      right++
    }
    return xs.slice(left + 1, right)
  }

  for (let i = 0; i < len - 1; i++) {
    const local = isEven(i)
      ? isPalindrome(i, i + 1)
      : isPalindrome(i, i)

    if (local.length > result.length) {
      result = local
    }
  }

  return result
}
```

[Try in REPL][CHALLANGE-3.1]

## Summary

Coding challenges can be fun and help you become a better programmer. They can also teach you new approaches to common problems and help in learning new programming languages. Give them a try today and help keep your brain sharp and focused on problem solving.

[CHALLANGE-1.1]: http://ramdajs.com/repl/?v=0.23.0#?function%20isPalindrome%20%28str%29%20%7B%0A%20%20let%20result%20%3D%20true%0A%20%20while%20%28str.length%29%20%7B%0A%20%20%20%20if%20%28str.charAt%280%29%20%21%3D%20str.charAt%28str.length%20-%201%29%29%20result%20%3D%20false%0A%20%20%20%20str%20%3D%20str.substr%281%2C%20str.length%20-%202%29%0A%20%20%7D%0A%20%20return%20result%0A%7D%0A%0AisPalindrome%28%27abc%27%29%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27xyz%27%29%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27aba%27%29%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27%27%29%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27aabbbaa%27%29%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27kayak%27%29%20%20%20%2F%2F%3D%3E%20true

[CHALLANGE-1.2]: http://ramdajs.com/repl/?v=0.23.0#?function%20isPalindrome%20%28str%29%20%7B%0A%20%20if%20%28str.length%20%3C%3D%201%29%20return%20true%0A%20%20if%20%28str.charAt%280%29%20%21%3D%20str.charAt%28str.length%20-%201%29%29%20return%20false%0A%20%20return%20isPalindrome%28%20str.substr%281%2C%20str.length%20-%202%29%20%29%0A%7D%0A%0AisPalindrome%28%27abc%27%29%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27xyz%27%29%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27%27%29%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27aba%27%29%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27aabbbaa%27%29%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27kayak%27%29%20%20%20%2F%2F%3D%3E%20true

[tail call optimization]: http://www.2ality.com/2015/06/tail-call-optimization.html

[CHALLANGE-2]:http://ramdajs.com/repl/?v=0.23.0#?function%20isPalindrome%20%28xs%29%20%7B%0A%20%20xs%20%3D%20String%28xs%29.replace%28%2F%5Cs%2Fg%2C%20%27%27%29%0A%20%20if%20%28xs.length%20%3C%3D%201%29%20return%20true%0A%20%20if%20%28xs%5B0%5D%20%21%3D%20xs%5Bxs.length%20-%201%5D%29%20return%20false%0A%20%20return%20isPalindrome%28%20xs.slice%281%2C%20xs.length%20-%201%29%20%29%0A%7D%0A%0AisPalindrome%28%27abc%27%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27xyz%27%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27%27%29%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27aba%27%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27aabbbaa%27%29%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27kayak%27%29%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%5B%27a%27%2C%20%27b%27%2C%20%27c%27%5D%29%20%2F%2F%3D%3E%20false%0AisPalindrome%28%5B%27a%27%2C%20%27b%27%2C%20%27a%27%5D%29%20%2F%2F%3D%3E%20true%0AisPalindrome%28%5B1%2C%202%2C%201%5D%29%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28123%29%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%2812321%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28undefined%29%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28null%29%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27nurses%20run%27%29%20%20%20%20%2F%2F%3D%3E%20true

[CHALLANGE-3]:http://ramdajs.com/repl/#?function%20isPalindrome%20%28xs%29%20%7B%0A%20%20xs%20%3D%20String%28xs%29.replace%28%2F%5Cs%2Fg%2C%20%27%27%29%0A%20%20if%20%28xs.length%20%3C%3D%201%29%20return%20true%0A%20%20if%20%28xs%5B0%5D%20%21%3D%20xs%5Bxs.length%20-%201%5D%29%20return%20false%0A%20%20return%20isPalindrome%28%20xs.slice%281%2C%20xs.length%20-%201%29%20%29%0A%7D%0A%0Afunction%20longestPalindrome%20%28xs%29%20%7B%0A%20%20xs%20%3D%20String%28xs%29%0A%20%20const%20len%20%3D%20xs.length%20%20%0A%20%20if%20%28len%20%3C%3D%201%29%20return%20xs%0A%20%20%0A%20%20let%20result%20%3D%20%27%27%0A%20%20for%20%28let%20i%20%3D%200%3B%20i%20%3C%20len%3B%20i%2B%2B%29%20%7B%0A%20%20%20%20if%20%28%2F%5Cs%2F.test%28xs%5Bi%5D%29%29%20continue%0A%20%20%20%20for%20%28let%20k%20%3D%20len%20-%20i%3B%20k%20%3E%200%3B%20k--%29%20%7B%0A%20%20%20%20%20%20const%20str%20%3D%20xs.slice%28i%2C%20k%20%2B%20i%29%0A%20%20%20%20%20%20if%20%28isPalindrome%28str%29%20%26%26%20str.length%20%3E%20result.length%29%20%7B%0A%20%20%20%20%20%20%20%20result%20%3D%20str%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%20%20return%20result%0A%7D%0A%0AlongestPalindrome%28%27noon%20is%20when%20nurses%20run%27%29

[CHALLANGE-3.1]: http://ramdajs.com/repl/#?function%20longestPalindrome%20%28xs%29%20%7B%0A%20%20const%20len%20%3D%20xs.length%0A%20%20const%20isEven%20%3D%20%28x%29%20%3D%3E%20x%20%25%202%20%3D%3D%3D%200%0A%20%20let%20result%20%3D%20%27%27%0A%0A%20%20function%20isPalindrome%20%28left%2C%20right%29%20%7B%0A%20%20%20%20while%20%28xs%5Bleft%5D%20%3D%3D%3D%20xs%5Bright%5D%20%26%26%20left%20%3E%3D%200%20%26%26%20right%20%3C%20len%29%20%7B%0A%20%20%20%20%20%20left--%0A%20%20%20%20%20%20right%2B%2B%0A%20%20%20%20%7D%0A%20%20%20%20return%20xs.slice%28left%20%2B%201%2C%20right%29%0A%20%20%7D%0A%0A%20%20for%20%28let%20i%20%3D%200%3B%20i%20%3C%20len%20-%201%3B%20i%2B%2B%29%20%7B%0A%20%20%20%20const%20local%20%3D%20isEven%28i%29%0A%20%20%20%20%20%20%3F%20isPalindrome%28i%2C%20i%20%2B%201%29%0A%20%20%20%20%20%20%3A%20isPalindrome%28i%2C%20i%29%0A%0A%20%20%20%20if%20%28local.length%20%3E%20result.length%29%20%7B%0A%20%20%20%20%20%20result%20%3D%20local%0A%20%20%20%20%7D%0A%20%20%7D%0A%20%20%0A%20%20return%20result%0A%7D%0A%0AlongestPalindrome%28%22nan%20noon%20is%20redder%22%29%3B
