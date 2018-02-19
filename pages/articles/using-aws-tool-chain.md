---
title: Using the AWS
date: "2018-09-01T16:00:00.000Z"
layout: post
category: Programming
tags: [Tools, CLI]
description: How I consolidated our build chain using AWS
---

With the addition of pull requests to [AWS
CodeCommit](https://aws.amazon.com/codecommit/) in November, I figured it was
time to consolidate our the [kfadvance.com](https://kfadvance.com)
infrastructure services onto AWS. We are already using the AWS Lambda to create
serverless REST API's and a combination of S3 and CloudFront host our UI. In
this post, I will explain how I moved our front-end codebase and build chain
over to AWS using a combination of CodeCommit, CodeBuild and CodePipeline.

## Moving the source
