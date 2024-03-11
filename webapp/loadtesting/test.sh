#!/bin/bash

for i in {1..5}; 
    do
        node load-test.js
        sleep 1
    done