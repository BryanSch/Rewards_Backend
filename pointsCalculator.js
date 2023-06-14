const calculatePoints = (receipt) => {
  let points = 0;

  // Verify receipt structure
  if (
    !receipt ||
    typeof receipt.retailer !== "string" ||
    typeof receipt.total !== "string" ||
    !Array.isArray(receipt.items)
  ) {
    throw new Error("Invalid receipt structure");
  }

  // One point for every alphanumeric character in the retailer name.
  const retailerNamePoints = (receipt.retailer.match(/[a-z0-9]/gi) || [])
    .length;
  console.log("Retailer Name Points: ", retailerNamePoints);
  points += retailerNamePoints;

  // 50 points if the total is a round dollar amount with no cents.
  const totalPoints = receipt.total.endsWith(".00") ? 50 : 0;
  console.log("Total Points (round dollar): ", totalPoints);
  points += totalPoints;

  // 25 points if the total is a multiple of 0.25.
  const total = parseFloat(receipt.total);
  if (total % 0.25 === 0) {
    console.log(`Total (${total}) is a multiple of 0.25, awarding 25 points`);
    points += 25;
  } else {
    console.log(
      `Total (${total}) is not a multiple of 0.25, no points awarded for this condition`
    );
  }

  // 5 points for every two items on the receipt.
  const itemPoints = Math.floor(receipt.items.length / 2) * 5;
  console.log("Item Points: ", itemPoints);
  points += itemPoints;

  // Process each item
  receipt.items.forEach((item) => {
    if (
      typeof item.shortDescription !== "string" ||
      typeof item.price !== "string"
    ) {
      throw new Error("Invalid item structure");
    }

    // If the trimmed length of the item description is a multiple of 3,
    // multiply the price by 0.2 and round up to the nearest integer.
    const descLength = item.shortDescription.trim().length;
    if (descLength % 3 === 0) {
      let itemPoints = Math.ceil(parseFloat(item.price) * 0.2);
      points += itemPoints;
      console.log(
        `Item '${item.shortDescription}' length is a multiple of 3, added ${itemPoints} points. Total points: ${points}`
      );
    }
  });

  // 6 points if the day in the purchase date is odd.
  const purchaseDate = new Date(`${receipt.purchaseDate}Z`);
  if (Number.isNaN(purchaseDate.getTime())) {
    throw new Error("Invalid purchaseDate");
  }
  console.log(
    `Interpreted day from purchaseDate: ${purchaseDate.getUTCDate()}`
  );
  const dayPoints = purchaseDate.getUTCDate() % 2 === 1 ? 6 : 0;
  points += dayPoints;
  console.log(
    `Purchase date is ${
      dayPoints === 6 ? "odd" : "even"
    }, added ${dayPoints} points. Total points: ${points}`
  );

  // 10 points if the time of purchase is after 2:00pm and before 4:00pm.
  const purchaseTime = receipt.purchaseTime
    .split(":")
    .map((num) => parseInt(num, 10));
  const hour = purchaseTime[0];
  const timePoints = hour >= 14 && hour < 16 ? 10 : 0;
  points += timePoints;
  console.log(
    `Purchase time is ${
      timePoints === 10
        ? "between 2:00pm and 4:00pm"
        : "outside of 2:00pm and 4:00pm"
    }, added ${timePoints} points. Total points: ${points}`
  );

  return points;
};

module.exports = calculatePoints;
