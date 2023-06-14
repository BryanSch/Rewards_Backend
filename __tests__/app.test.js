const request = require("supertest");
const app = require("../server");
const calculatePoints = require("../pointsCalculator");

describe("POST /receipts/process", () => {
  it("should calculate points and return a receipt id", async () => {
    const receipt = {
      retailer: "Walmart",
      purchaseDate: "2023-06-05",
      purchaseTime: "12:00",
      items: [
        { shortDescription: "Banana", price: "0.20" },
        { shortDescription: "Apple", price: "0.25" },
      ],
      total: "0.45",
    };

    const res = await request(app).post("/receipts/process").send(receipt);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("id");
  });

  it("should return an error when receipt fields are empty", async () => {
    const receipt = {
      retailer: "",
      purchaseDate: "",
      purchaseTime: "",
      items: [],
      total: "",
    };

    const res = await request(app).post("/receipts/process").send(receipt);

    expect(res.statusCode).toEqual(400);
  });
});

describe("GET /receipts/:id/points", () => {
  it("should return the points for a given receipt id", async () => {
    // First, create a receipt
    const receipt = {
      retailer: "Walmart",
      purchaseDate: "2023-06-05",
      purchaseTime: "12:00",
      items: [
        { shortDescription: "Banana", price: "0.20" },
        { shortDescription: "Apple", price: "0.25" },
      ],
      total: "0.45",
    };
    const postRes = await request(app).post("/receipts/process").send(receipt);
    const id = postRes.body.id;

    // Then, fetch the points for that receipt
    const getRes = await request(app).get(`/receipts/${id}/points`);

    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body).toHaveProperty("points");
  });
});

describe("calculatePoints function", () => {
  test("calculates points correctly for a sample receipt", () => {
    const receipt = {
      retailer: "test123",
      total: "50.00",
      items: [
        { shortDescription: "abc", price: "10.00" },
        { shortDescription: "def", price: "20.00" },
      ],
      purchaseDate: "2023-06-15",
      purchaseTime: "15:00:00",
    };

    const expectedPoints = 109; // manually calculated expected points based on rules
    expect(calculatePoints(receipt)).toBe(expectedPoints);
  });

  test("calculates points correctly when receipt total is not a multiple of 0.25", () => {
    const receipt = {
      retailer: "test123",
      total: "49.99",
      items: [],
      purchaseDate: "2023-06-15",
      purchaseTime: "15:00:00",
    };

    const expectedPoints = 23; // manually calculated expected points
    expect(calculatePoints(receipt)).toBe(expectedPoints);
  });

  test("retailer name contributes to total points", () => {
    const receipt = {
      retailer: "test", // 4 points
      total: "1.10", // no extra points, no round dollar amount
      items: [], // no items, no extra points
      purchaseDate: "2023-06-14", // even day, no extra points
      purchaseTime: "13:00:00", // not between 2pm and 4pm, no extra points
    };

    const expectedPoints = 4;
    expect(calculatePoints(receipt)).toBe(expectedPoints);
  });

  test("round dollar amount contributes to total points", () => {
    const receipt = {
      retailer: "test", // 4 points
      total: "60.00", // 50 points, round dollar amount
      items: [], // no items, no extra points
      purchaseDate: "2023-06-14", // even day, no extra points
      purchaseTime: "13:00:00", // not between 2pm and 4pm, no extra points
    };

    const expectedPoints = 79; // 4 for retailer name, 50 for round dollar amount, 25 for multiple of .25
    expect(calculatePoints(receipt)).toBe(expectedPoints);
  });

  test("multiple of 0.25 contributes to total points", () => {
    const receipt = {
      retailer: "test", // 4 points
      total: "1.25", // 25 points, multiple of 0.25
      items: [], // no items, no extra points
      purchaseDate: "2023-06-14", // even day, no extra points
      purchaseTime: "13:00:00", // not between 2pm and 4pm, no extra points
    };

    const expectedPoints = 29; // 4 for retailer name, 25 for multiple of 0.25
    expect(calculatePoints(receipt)).toBe(expectedPoints);
  });

  test("number of items contributes to total points", () => {
    const receipt = {
      retailer: "test", // 4 points
      total: "1.10", // no extra points,  no round dollar amount
      items: [
        { shortDescription: "ab", price: "1.00" },
        { shortDescription: "cd", price: "1.00" },
      ], // 5 points, for every two items
      purchaseDate: "2023-06-14", // even day, no extra points
      purchaseTime: "13:00:00", // not between 2pm and 4pm, no extra points
    };

    const expectedPoints = 9; // 4 for retailer name, 5 for number of items
    expect(calculatePoints(receipt)).toBe(expectedPoints);
  });

  test("odd day in purchase date contributes to total points", () => {
    const receipt = {
      retailer: "test", // 4 points
      total: "1.10", // no extra points, not a round dollar amount
      items: [], // no items, no extra points
      purchaseDate: "2023-06-15", // 6 points, odd day
      purchaseTime: "13:00:00", // not between 2pm and 4pm, no extra points
    };

    const expectedPoints = 10; // 4 for retailer name, 6 for odd day
    expect(calculatePoints(receipt)).toBe(expectedPoints);
  });

  test("time of purchase between 2:00pm and 4:00pm contributes to total points", () => {
    const receipt = {
      retailer: "test", // 4 points
      total: "1.10", // no extra points, not a round dollar amount
      items: [], // no items, no extra points
      purchaseDate: "2023-06-14", // even day, no extra points
      purchaseTime: "15:00:00", // 10 points, time of purchase between 2pm and 4pm
    };

    const expectedPoints = 14; // 4 for retailer name, 10 for time of purchase
    expect(calculatePoints(receipt)).toBe(expectedPoints);
  });

  test("trim item length multiple of 3", () => {
    const receipt = {
      retailer: "tester", // 6 points
      total: "558.10", // no extra points, not a round dollar amount
      items: [
        { shortDescription: "abcdef", price: "10.00" },
        { shortDescription: "cde", price: "350.00" },
        { shortDescription: "cd", price: "99.00" },
        { shortDescription: "ab", price: "99.10" },
      ], // 2 points and 70 points for item length multiple of 3 price * .2 and 10 points for 2 items* 2
      purchaseDate: "2023-06-14", // even day, no extra points
      purchaseTime: "15:00:00", // 10 points, time of purchase between 2pm and 4pm
    };

    const expectedPoints = 98; // 6 for retailer, 82 for items, 10 for purchase time
    expect(calculatePoints(receipt)).toBe(expectedPoints);
  });
});
