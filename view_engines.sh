#!/bin/bash

pidof java | xargs -r pwdx

ps aux | grep python

tail -f out.log