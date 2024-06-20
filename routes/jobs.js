"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const Company = require("../models/company");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be {  title, salary, equity, company_handle }
 *
 * Returns {  title, salary, equity, company_handle }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    } 
    const job = await Job.create(req.body);
    job.equity = parseInt(job.equity); //Convert equity back to an Int 
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { handle, title, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - salary
 * - equity
 * - titleLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

  router.get("/", async function (req, res, next) {
    try {
      // Extract query parameters
      const { title, salary, equity } = req.query;
  
      // Construct filters object
      const filters = {};
      if (title) {
        filters.title = { $ilike: `%${title.toLowerCase()}%` }; // Case-insensitive partial match
      }
      if (salary!== undefined) {
        filters.salary = { $gte: parseInt(salary) };
      }
      if (equity!== undefined) {
        filters.equity = { $lte: parseInt(equity) };
      }
  
      // Call Job.findAll with filters
      const jobs = await Job.findAll(filters);
      return res.json({ jobs });
    } catch (err) {
      return next(err);
    }
  });
  

/** GET /[handle]  =>  { job }
 *
 *  job is { handle, title, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
    try{
    const handle = req.params.handle;
    const job = await Job.get(handle);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, description, numEmployees, logo_url }
 *
 * Returns { handle, title, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch("/:handle", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    } 

    const job = {"job": { "company"}}//await Job.update(req.params.handle, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureLoggedIn, async function (req, res, next) {
  try {
    await Job.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
