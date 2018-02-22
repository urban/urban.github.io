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
in interviews because in order to answer them, you need to understand many
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

The following multi-part coding challenges that centers around the concept of a
palindrome. Each successive part in the series builds on the previous one and
should be done in order.

> A palindrome is a word, phrase, number, or other sequence of characters which
> reads the same backward or forward, such as madam or kayak.<br/>
> – [Wikipedia](https://en.wikipedia.org/wiki/Palindrome)

### Part 1: Is Palindrome

Write a function called `isPalindrome` that takes a string and returns `true` if
it is a palindrome. The argument passed into the `isPalindrome` function will
always be a string and will not contain spaces.

For example, given the following input, your function should return the
commented out boolean.

```js
isPalindrome("abc") //=> false
isPalindrome("xyz") //=> false
isPalindrome("") //=> true
isPalindrome("aba") //=> true
isPalindrome("aabbbaa") //=> true
isPalindrome("kayak") //=> true
```

#### Solution 1.1

The following is a solution that uses a while loop.

```js
function isPalindrome(str) {
  while (str.length) {
    if (str.charAt(0) != str.charAt(str.length - 1)) return false
    str = str.substr(1, str.length - 2)
  }
  return true
}
```

<a href="http://ramdajs.com/repl/?v=0.24.1#?function%20isPalindrome%20%28str%29%20%7B%0A%20%20while%20%28str.length%29%20%7B%0A%20%20%20%20if%20%28str.charAt%280%29%20%21%3D%20str.charAt%28str.length%20-%201%29%29%20return%20false%0A%20%20%20%20str%20%3D%20str.substr%281%2C%20str.length%20-%202%29%0A%20%20%7D%0A%20%20return%20true%0A%7D%0A%0AisPalindrome%28%27abc%27%29%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27xyz%27%29%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27aba%27%29%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27%27%29%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27aabbbaa%27%29%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27kayak%27%29%20%20%20%2F%2F%3D%3E%20true" target="_blank">Try in REPL</a>

This solution iterate over the string from left to right as long as the string
contains has a length greater than zero. At each iteration, it checks to see if
the first character and last character are equivalent. If they are not, the loop
terminates and the function outputs `false`. If they are equivalent, the string
is mutated by removing the first and last characters and the loop starts a new
iteration. This process is repeated until the string is empty and the loop
terminates.

In my opinion, this solution has several issues. The `while` loop is very
powerful however it relies on mutation for it's terminal condition. If you get
this wrong, it's easy to create an infinite loop in your code.

It also doesn't guard against bad input and always assumes a string that
has the `charAt` method attached to it.

#### Solution 1.2

Here is another solution using recursion instead of the `while` loop, converts
the input to a string and changes the way characters are indexed and new string
are created.

```js
function isPalindrome(s) {
  function run(str) {
    if (str.length <= 1) return true
    if (str[0] != str[str.length - 1]) return false
    return run(str.slice(1, str.length - 1))
  }
  return run(String(s))
}
```

<a href="http://ramdajs.com/repl/?v=0.24.1#?function%20isPalindrome%20%28s%29%20%7B%0A%20%20function%20run%20%28str%29%20%7B%0A%20%20%20%20if%20%28str.length%20%3C%3D%201%29%20return%20true%0A%20%20%20%20if%20%28str%5B0%5D%20%21%3D%20str%5Bstr.length%20-%201%5D%29%20return%20false%0A%20%20%20%20return%20run%28str.slice%281%2C%20str.length%20-%201%29%29%0A%20%20%7D%0A%20%20return%20run%28String%28s%29%29%0A%7D%0A%0AisPalindrome%28%27abc%27%29%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27xyz%27%29%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27%27%29%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27aba%27%29%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27aabbbaa%27%29%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27kayak%27%29%20%20%20%2F%2F%3D%3E%20true" target="_blank">Try in REPL</a>

In this solution, has a "setup" function that converts the input into a string
before calling a nested function that "runs" our palindrome logic. The nested
function will return `true` or `false` based on two conditions or call itself
recursively with a new string.

By converting the value to a string in the setup function, we now get the
following output from converting the input.

```js
String("abc") //=> 'abc'
String([1, 2, 3]) //=> '123'
String(undefined) //=> 'undefined'
```

This means we can now expand our test cases to accept all data types and
structures.

```js
isPalindrome("abc") //=> false
isPalindrome("xyz") //=> false
isPalindrome("") //=> true
isPalindrome("aba") //=> true
isPalindrome("aabbbaa") //=> true
isPalindrome("kayak") //=> true
isPalindrome(["a", "b", "c"]) //=> false
isPalindrome(["a", "b", "a"]) //=> true
isPalindrome([1, 2, 1]) //=> true
isPalindrome(123) //=> false
isPalindrome(12321) //=> true
isPalindrome(undefined) //=> false
isPalindrome(null) //=> false
```

We can then strip out whitespace with `replace(/\s/g, '')` in order to handle phrases such as "nurses run".

```js
isPalindrome("nurses run") //=> true
```

I also took the opportunity to change how I am indexing the characters within the string. As of ECMAScript 5 you can treat strings as array-like objects so you can index characters numerically. This means the following two lines are equivalent.

```js
"cat".charAt(1) //=> 'a'
"cat"[1] //=> 'a'
```

I prefer this recursive solutions to the `while` loop because it is "pure" and
doesn't use destructive state updates. Recursion has it's own issues. When
unbounded and thoughtlessly implemented, it can lead to stack overflow issues
however, your call stack size is directly related to the size of your input.
With relatively "small" input, you shouldn't ever run into this issue and
ECMAScript 2015 offers [tail call optimization][].

This solution also uses `s[1]` (bracket notation) to read characters at the ends
of the string and uses the `slice` method for creating new sub-strings. These
are better techniques because they are also available on other data types or
structures such as Arrays.

#### Solution 1.3

This solution using ECMAScript 2015 features and is conceptually different.

```js
const stripWhitespace = s => s.replace(/\s/g, "")
const splitEvenly = s => {
  const center = Math.floor(s.length / 2)
  return [s.slice(0, center + s.length % 2), s.slice(center)]
}
const reverseString = s =>
  s
    .split("")
    .reverse()
    .join("")

const isPalindrome = s => {
  const halves = splitEvenly(stripWhitespace(String(s)))
  return halves[0] === reverseString(halves[1])
}
```

<a href="http://ramdajs.com/repl/?v=0.24.1#?const%20stripWhitespace%20%3D%20s%20%3D%3E%20s.replace%28%2F%5Cs%2Fg%2C%20%27%27%29%0Aconst%20splitEvenly%20%3D%20s%20%3D%3E%20%7B%0A%20%20const%20center%20%3D%20Math.floor%28s.length%20%2F2%29%0A%20%20return%20%5B%0A%20%20%20%20s.slice%280%2C%20center%20%2B%20%28s.length%20%25%202%29%29%2C%0A%20%20%20%20s.slice%28center%29%0A%20%20%5D%0A%7D%0Aconst%20reverseString%20%3D%20s%20%3D%3E%20s.split%28%27%27%29.reverse%28%29.join%28%27%27%29%0A%0Aconst%20isPalindrome%20%3D%20s%20%3D%3E%20%7B%0A%20%20const%20halves%20%3D%20splitEvenly%28stripWhitespace%28String%28s%29%29%29%0A%20%20return%20halves%5B0%5D%20%3D%3D%3D%20reverseString%28halves%5B1%5D%29%0A%7D%0A%0AisPalindrome%28%27abc%27%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27xyz%27%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27%27%29%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27aba%27%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27aabbbaa%27%29%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27kayak%27%29%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%5B%27a%27%2C%20%27b%27%2C%20%27c%27%5D%29%20%2F%2F%3D%3E%20false%0AisPalindrome%28%5B%27a%27%2C%20%27b%27%2C%20%27a%27%5D%29%20%2F%2F%3D%3E%20true%0AisPalindrome%28%5B1%2C%202%2C%201%5D%29%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28123%29%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%2812321%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28undefined%29%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28null%29%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27nurses%20run%27%29%20%20%20%20%2F%2F%3D%3E%20true" target="_blank">Try in REPL</a>

> These are all just different ways of expressing function composition. The whole reason functions exist is so you can compose them. Functions help you break down complex problems into simple problems that are easier to solve in isolation, so that you can compose them in various ways to form your application.

#### Solution 1.4

<a href="https://en.wikipedia.org/wiki/Lambda_lifting" target="_blank">Lambda
lifting</a>

```js
const stripWhitespace = replace(/\s/g, "")
const toList = compose(split(""), stripWhitespace, String)
const coerceArray = unless(Array.isArray, toList)
const middle = x => Math.floor(x.length / 2)
const splitEqually = xs => splitAt(middle(xs), xs)
const alignHalves = (a, b) => [a, reverse(b)]
const equalPairs = zipWith(equals)
const equalLists = all(equals(true))

const isPalindrome = compose(
  equalLists,
  apply(equalPairs),
  apply(alignHalves),
  splitEqually,
  coerceArray,
)
```

<a href="http://ramdajs.com/repl/?v=0.24.1#?const%20stripWhitespace%20%3D%20replace%28%2F%5Cs%2Fg%2C%20%27%27%29%0Aconst%20toList%20%3D%20compose%28%0A%20%20%20%20split%28%27%27%29%2C%0A%20%20%20%20stripWhitespace%2C%0A%20%20%20%20String%0A%20%20%29%0Aconst%20coerceArray%20%3D%20unless%28Array.isArray%2C%20toList%29%0Aconst%20middle%20%3D%20x%20%3D%3E%20Math.floor%28x.length%20%2F%202%29%0Aconst%20splitEqually%20%3D%20xs%20%3D%3E%20splitAt%28middle%28xs%29%2C%20xs%29%0Aconst%20alignHalves%20%3D%20%28a%2C%20b%29%20%3D%3E%20%5Ba%2C%20reverse%28b%29%5D%0Aconst%20equalPairs%20%3D%20zipWith%28equals%29%0Aconst%20equalLists%20%3D%20all%28equals%28true%29%29%0A%0Aconst%20isPalindrome%20%3D%20compose%28%0A%20%20equalLists%2C%0A%20%20apply%28equalPairs%29%2C%0A%20%20apply%28alignHalves%29%2C%0A%20%20splitEqually%2C%0A%20%20coerceArray%0A%29%0A%0AisPalindrome%28%27abc%27%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27xyz%27%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27%27%29%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27aba%27%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27aabbbaa%27%29%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27kayak%27%29%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%5B%27a%27%2C%20%27b%27%2C%20%27c%27%5D%29%20%2F%2F%3D%3E%20false%0AisPalindrome%28%5B%27a%27%2C%20%27b%27%2C%20%27a%27%5D%29%20%2F%2F%3D%3E%20true%0AisPalindrome%28%5B1%2C%202%2C%201%5D%29%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28123%29%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%2812321%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28undefined%29%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28null%29%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27nurses%20run%27%29%20%20%20%20%2F%2F%3D%3E%20true" target="_blank">Try in REPL</a>

### Part 2: Refactoring Is Palindrome

Write a function called `isPalindrome` that can take a word, phrase, number, or other sequence of
characters and returns `true` if it is a palindrome.

For example, given the following input, your function should return the
commented out boolean.

#### Solutions

```js
function isPalindrome(xs) {
  xs = String(xs).replace(/\s/g, "")
  if (xs.length <= 1) return true
  if (xs[0] != xs[xs.length - 1]) return false
  return isPalindrome(xs.slice(1, xs.length - 1))
}
```

[Try in REPL][challange-2]

#### Explanation

### Part 3: Longest Palindrome

##### Solution

This first solution uses a nested loop to iterate through all combinations. At each step in the outer loop, you reduce your list by one letter from the right. You then loop over your new list, checking if it is a palindrome and removing a letter from the right.

```js
function longestPalindrome(xs) {
  xs = String(xs)
  const len = xs.length
  if (len <= 1) return xs

  let result = ""
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

[Try in REPL][challange-3]

Another solution would be to change how you test for finding a palindrome. Instead of testing from the outside in, we flip it and test from the center outward. With our new expanding `isPalindrome` test, we can iterate in one loop from the first item to the last in our list.

```js
function longestPalindrome(xs) {
  const len = xs.length
  let result = ""

  function isPalindrome(left, right) {
    while (xs[left] === xs[right] && left >= 0 && right < len) {
      left--
      right++
    }
    return xs.slice(left + 1, right)
  }

  for (let i = 0; i < len - 1; i++) {
    const local = i % 2 === 0 ? isPalindrome(i, i + 1) : isPalindrome(i, i)

    if (local.length > result.length) {
      result = local
    }
  }

  return result
}
```

[Try in REPL][challange-3.1]

## Summary

Coding challenges can be fun and help you become a better programmer. They can also teach you new approaches to common problems and help in learning new programming languages. Give them a try today and help keep your brain sharp and focused on problem solving.

[tail call optimization]: http://www.2ality.com/2015/06/tail-call-optimization.html
[challange-2]: http://ramdajs.com/repl/?v=0.23.0#?function%20isPalindrome%20%28xs%29%20%7B%0A%20%20xs%20%3D%20String%28xs%29.replace%28%2F%5Cs%2Fg%2C%20%27%27%29%0A%20%20if%20%28xs.length%20%3C%3D%201%29%20return%20true%0A%20%20if%20%28xs%5B0%5D%20%21%3D%20xs%5Bxs.length%20-%201%5D%29%20return%20false%0A%20%20return%20isPalindrome%28%20xs.slice%281%2C%20xs.length%20-%201%29%20%29%0A%7D%0A%0AisPalindrome%28%27abc%27%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27xyz%27%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27%27%29%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27aba%27%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27aabbbaa%27%29%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%27kayak%27%29%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28%5B%27a%27%2C%20%27b%27%2C%20%27c%27%5D%29%20%2F%2F%3D%3E%20false%0AisPalindrome%28%5B%27a%27%2C%20%27b%27%2C%20%27a%27%5D%29%20%2F%2F%3D%3E%20true%0AisPalindrome%28%5B1%2C%202%2C%201%5D%29%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28123%29%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%2812321%29%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20true%0AisPalindrome%28undefined%29%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28null%29%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%3D%3E%20false%0AisPalindrome%28%27nurses%20run%27%29%20%20%20%20%2F%2F%3D%3E%20true
[challange-3]: http://ramdajs.com/repl/#?function%20isPalindrome%20%28xs%29%20%7B%0A%20%20xs%20%3D%20String%28xs%29.replace%28%2F%5Cs%2Fg%2C%20%27%27%29%0A%20%20if%20%28xs.length%20%3C%3D%201%29%20return%20true%0A%20%20if%20%28xs%5B0%5D%20%21%3D%20xs%5Bxs.length%20-%201%5D%29%20return%20false%0A%20%20return%20isPalindrome%28%20xs.slice%281%2C%20xs.length%20-%201%29%20%29%0A%7D%0A%0Afunction%20longestPalindrome%20%28xs%29%20%7B%0A%20%20xs%20%3D%20String%28xs%29%0A%20%20const%20len%20%3D%20xs.length%20%20%0A%20%20if%20%28len%20%3C%3D%201%29%20return%20xs%0A%20%20%0A%20%20let%20result%20%3D%20%27%27%0A%20%20for%20%28let%20i%20%3D%200%3B%20i%20%3C%20len%3B%20i%2B%2B%29%20%7B%0A%20%20%20%20if%20%28%2F%5Cs%2F.test%28xs%5Bi%5D%29%29%20continue%0A%20%20%20%20for%20%28let%20k%20%3D%20len%20-%20i%3B%20k%20%3E%200%3B%20k--%29%20%7B%0A%20%20%20%20%20%20const%20str%20%3D%20xs.slice%28i%2C%20k%20%2B%20i%29%0A%20%20%20%20%20%20if%20%28isPalindrome%28str%29%20%26%26%20str.length%20%3E%20result.length%29%20%7B%0A%20%20%20%20%20%20%20%20result%20%3D%20str%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%20%20return%20result%0A%7D%0A%0AlongestPalindrome%28%27noon%20is%20when%20nurses%20run%27%29
[challange-3.1]: http://ramdajs.com/repl/#?function%20longestPalindrome%20%28xs%29%20%7B%0A%20%20const%20len%20%3D%20xs.length%0A%20%20let%20result%20%3D%20%27%27%0A%0A%20%20function%20isPalindrome%20%28left%2C%20right%29%20%7B%0A%20%20%20%20while%20%28xs%5Bleft%5D%20%3D%3D%3D%20xs%5Bright%5D%20%26%26%20left%20%3E%3D%200%20%26%26%20right%20%3C%20len%29%20%7B%0A%20%20%20%20%20%20left--%0A%20%20%20%20%20%20right%2B%2B%0A%20%20%20%20%7D%0A%20%20%20%20return%20xs.slice%28left%20%2B%201%2C%20right%29%0A%20%20%7D%0A%0A%20%20for%20%28let%20i%20%3D%200%3B%20i%20%3C%20len%20-%201%3B%20i%2B%2B%29%20%7B%0A%20%20%20%20const%20local%20%3D%20i%20%25%202%20%3D%3D%3D%200%0A%20%20%20%20%20%20%3F%20isPalindrome%28i%2C%20i%20%2B%201%29%0A%20%20%20%20%20%20%3A%20isPalindrome%28i%2C%20i%29%0A%0A%20%20%20%20if%20%28local.length%20%3E%20result.length%29%20%7B%0A%20%20%20%20%20%20result%20%3D%20local%0A%20%20%20%20%7D%0A%20%20%7D%0A%20%20%0A%20%20return%20result%0A%7D%0A%0AlongestPalindrome%28%22nan%20noon%20is%20redder%22%29%3B
