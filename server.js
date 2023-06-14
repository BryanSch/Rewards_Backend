const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");
const receipts = {};
const calculatePoints = require("./pointsCalculator");
const { body, validationResult, param } = require("express-validator");

const app = express();

// Middleware for setting various HTTP headers
app.use(helmet());

// Middleware for rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Needed to parse JSON request bodies
app.use(express.json());

app.post(
  "/receipts/process",
  //validation rules
  [
    body("retailer").isLength({ min: 1 }).withMessage("retailer is required"),
    body("purchaseDate")
      .isISO8601()
      .withMessage("purchaseDate must be a valid ISO 8601 date"),
    body("purchaseTime")
      .matches("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
      .withMessage("purchaseTime must be in 24-hour format"),
    body("items")
      .isArray({ min: 1 })
      .withMessage("At least one item is required"),
    body("items.*.shortDescription")
      .isLength({ min: 1 })
      .withMessage("item shortDescription is required"),
    body("items.*.price")
      .matches("^\\d+\\.\\d{2}$")
      .withMessage("item price must be in the format 0.00"),
    body("total")
      .matches("^\\d+\\.\\d{2}$")
      .withMessage("total must be in the format 0.00"),
  ],

  (req, res) => {
    // Check if there were validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const receipt = req.body;

    // Generate a random ID for the receipt
    const id = uuidv4();

    try {
      // Calculate points based on the provided rules
      const points = calculatePoints(receipt);

      // Store the receipt and points in memory
      receipts[id] = { receipt, points };

      // Respond with the generated ID
      res.json({ id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get(
  "/receipts/:id/points",
  [param("id").isLength({ min: 1 }).withMessage("ID is required")],

  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = req.params.id;

    // Check if a receipt with the given ID exists
    if (id in receipts) {
      // Respond with the points of the receipt
      res.json({ points: receipts[id].points });
    } else {
      // Respond with an error if the receipt was not found
      res.status(404).json({ error: "No receipt found for that id" });
    }
  }
);

// General error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

module.exports = app;
