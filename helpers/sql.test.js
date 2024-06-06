const { sqlForPartialUpdate } = require('../helpers/sql');
const { BadRequestError } = require("../expressError");
describe('sqlForPartialUpdate', () => {
  it('generates correct SQL for partial update with valid input', () => {
    const dataToUpdate = { firstName: 'Aliya', age: 32 };
    const jsToSql = { firstName: 'first_name', age: 'age' };

    const expectedSetCols = '"first_name"=$1, "age"=$2';
    const expectedValues = ['Aliya', 32];

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result.setCols).toEqual(expectedSetCols);
    expect(result.values).toEqual(expectedValues);
  });

  it('throws BadRequestError when dataToUpdate is empty', () => {
    const dataToUpdate = {};
    const jsToSql = { firstName: 'first_name', age: 'age' };
  
    expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrow(BadRequestError);
  });
  

  it('uses column name directly if jsToSql mapping is not found', () => {
    const dataToUpdate = { lastName: 'Smith' };
    const jsToSql = {};

    const expectedSetCols = '"lastName"=$1';
    const expectedValues = ['Smith'];

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result.setCols).toEqual(expectedSetCols);
    expect(result.values).toEqual(expectedValues);
  });
});
