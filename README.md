# FujiTV Livestream

Watching Japan livestream TV from http://play.fujitv.live without timeout popup.
This is a clone site without a timeout code.

## Why do you do this ?
[fujitv](https://github.com/makemek/fujitv.git) has an annoying timeout that appear every a couple of minutes.
I would like to watch them without skipping a beat.
I cloned the whole site and strip out those annoying JS codes.

## Installation
You need http server with this file locally
```
npm install http-server -g
```
`cd` to this project directory and run
```
http-server .
```
A local server will listen on port 8080 by default
```
http://localhost:8080
```
