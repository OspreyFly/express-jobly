"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
     /** Find all jobs.
   *
   * Filters can be applied based on:
   * title: filter by job title. Like before, this should be a case-insensitive, matches-any-part-of-string search.
   * minSalary: filter to jobs with at least that salary.
   * hasEquity: if true, filter to jobs that provide a non-zero amount of equity.
   *  If false or not included in the filtering, list all jobs regardless of equity.
   *
   * Returns [{ title, salary, equity, company_title },...]
   */
   static async findAll(filters = {}) {
  
    let whereClause = '';
    let queryParams = [];
  
    if (filters.title !== undefined) {
      whereClause += 'title ILIKE $' + (queryParams.length + 1);
      queryParams.push('%' + filters.title + '%');
    }
  
    if (filters.salary !== undefined) {
      whereClause += 'salary >= $' + (queryParams.length + 1);
      queryParams.push(filters.salary);
    }

    if (filters.equity!== undefined && filters.equity === true) {
      whereClause += 'equity > 0';
    }

    if (whereClause !== '') {
      whereClause = 'WHERE ' + whereClause;
    }
  
    const jobsRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle
       FROM jobs
       ${whereClause}
       ORDER BY title`,
      queryParams);
    return jobsRes.rows;
  }

  /** Given a title, return data about job.
   *
   * Returns { title, salary, equity }
   *   where jobs is [{ title, salary, equity, company_handle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const jobRes = await db.query(
          `SELECT
                  title,
                  salary,
                  equity,
                  company_handle
           FROM jobs
           WHERE company_handle = $1`,
        [handle]);
        
    const job = jobRes.rows[0];
    if (!job) throw new NotFoundError(`No job: ${handle}`, 400);

    return job;
  }

  static async create({ title, salary, equity, company_handle }) {
    const duplicateCheck = await db.query(
          `SELECT title
           FROM jobs
           WHERE title = $1`,
        [title]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${title}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle`,
        [
          title,
          salary,
          equity,
          company_handle
        ],
    );
    const job = result.rows[0];

    return job;
  }

 /** Update job data with `data`.
 *
 * This is a "partial update" --- it's fine if data doesn't contain all the
 * fields; this only changes provided ones.
 *
 * Data can include: { salary, equity }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Throws NotFoundError if not found.
 */
static async update(handle, data) {
  // Define the jsToSql mapping
  const jsToSql = {
    salary: 'salary',
    equity: 'equity'
  };

  const { setCols, values } = sqlForPartialUpdate(data, jsToSql);
  const idVarIdx = "$" + (values.length + 1);

  // Correctly interpolate the variables into the SQL query
  const querySql = `UPDATE jobs 
                    SET ${setCols} 
                    WHERE id = ${idVarIdx} 
                    RETURNING id, 
                              title, 
                              salary, 
                              equity, 
                              company_handle`;

  // Execute the query with the correct parameters
  const result = await db.query(querySql, [...values, handle]);

  // Check if the job was found
  const job = result.rows[0];
  if (!job) throw new NotFoundError(`No job: ${handle}`);

  return job;
}



  /** Delete given job from database; returns undefined.
 *
 * Throws NotFoundError if job not found.
 **/
  static async remove(id) {
    try{
      const result = await db.query(
        `DELETE FROM jobs WHERE id = $1 RETURNING id`,
      [id]
      );

  // Get the number of rows affected by the DELETE operation
      const rowCount = result.rowCount;

  // If no rows were affected, throw NotFoundError
      if (rowCount === 0) {
        throw new NotFoundError(`No job: ${id}`);
      }
    }catch(err){
      throw new NotFoundError(`No job: ${id}`);
    }
  }
}


module.exports = Job;
