const { BadRequestError } = require("../expressError");

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // Ensure column names and placeholders are properly quoted
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}" = $${idx + 1}`
  ).join(","); // Join columns with commas

  // Prepare the values array to match the placeholders in the SQL statement
  const values = Object.values(dataToUpdate);

  return {
    setCols: cols,
    values: values,
  };
}

module.exports = { sqlForPartialUpdate };


