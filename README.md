# Rewards Backend

## Overview

This project is a simple points calculation system for receipts. The API details can be found in the api.yml file.

This allows for POST/GET method to take in a JSON receipt and a return a random ID- then passing this ID to a getter endpoint to get the points awarded.

## Rules

The points calculations are handled in pointsCalculator.js and handle the below rules:

These rules collectively define how many points should be awarded to a receipt.

One point for every alphanumeric character in the retailer name.

50 points if the total is a round dollar amount with no cents.

25 points if the total is a multiple of 0.25.

5 points for every two items on the receipt.

If the trimmed length of the item description is a multiple of 3, multiply the price by 0.2 and round up to the nearest integer. The result is the number of points earned.

6 points if the day in the purchase date is odd.

10 points if the time of purchase is after 2:00pm and before 4:00pm.

## Requirements

- Docker

## Instructions

1. Clone the repository:

```
git clone https://github.com/web34nBeYonD/Rewards_Backend
```

2. Build the Docker Image:

```
docker build -t rewards_backend .
```

3. Run the Docker container:

```
docker run -p 3000:3000 rewards_backend
```

The app should now be running on http://localhost:3000.

## Optional Alternative Non Docker Method (node.js)

Users with Node.js installed: clone your repository, install the dependencies with npm install, and start the application with npm start.

## node.js testing

Unit tests are in **tests** directory via app.test.js ------ this can be run via npm test
