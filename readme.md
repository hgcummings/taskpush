TaskPush
========
[![Build Status](https://travis-ci.org/hgcummings/taskpush.png?branch=master)](https://travis-ci.org/hgcummings/taskpush)

A service for allowing you to push tasks to your task list from elsewhere, in particular by text message from a mobile
phone. Mainly written as an exercise in learning good practices for node, and to serve as a little node.js demo app.

* Accepts incoming requests from an SMS gateway (nexmo)
* Retrieves user preferences from a datastore (AWS DynamoDB)
* Pushes tasks to an online task list application (checkvist)