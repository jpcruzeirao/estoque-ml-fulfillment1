#!/bin/bash
echo "Listing repository structure:"
ls -la
echo "Checking frontend directory:"
ls -la frontend || echo "Frontend directory not found"
echo "Checking dashboard directory:"
ls -la frontend/dashboard || echo "Dashboard directory not found"
