"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const request = require("supertest");
const app = require("../app");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: 1,
        title: "title1",
        salary: 50000,
        equity: "0",
        company_handle: "c1",
      },
      {
        id: 2,
        title: "title2",
        salary: 25000,
        equity: "0.079",
        company_handle: "c2",
      },
    ]);
  });
  test('filters jobs by title', async () => {
    const jobs = await Job.findAll({ title: 'title1' });
    expect(jobs).toEqual([{ 
      id: 1,
      title: "title1",
      salary: 50000,
      equity: "0",
      company_handle: "c1"
    }]);
  });
  test('filters jobs by minSalary', async () => {
    const jobs = await Job.findAll({ salary: 40000 });
    expect(jobs).toEqual([{ 
      id: 1,
      title: "title1",
      salary: 50000,
      equity: "0",
      company_handle: "c1"
    }]);
  });

  test('filters jobs by hasEquity', async () => {
    const jobs = await Job.findAll({ equity: true });
    expect(jobs).toEqual([{ 
      id: 2,
      title: "title2",
      salary: 25000,
      equity: "0.079",
      company_handle: "c2"
    }]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get("c1");
    expect(job).toEqual({
      title: "title1",
      salary: 50000,
      equity: "0",
      company_handle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    salary: 75000,
    equity: 0.1
  };

  test("works", async function () {
    let job = await Job.update("c1", updateData);
    
    if(job.id){
      job.id = undefined;
    }

    expect(job).toEqual({
      id: undefined,
      title: "title1",
      salary: 75000,
      equity: "0.1",
      company_handle: "c1",
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE company_handle = 'c1'`);

    result.rows[0].id = undefined;

    expect(result.rows).toEqual([{
      id: undefined,
      title: "title1",
      salary: 75000,
      equity: "0.1",
      company_handle: "c1",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      salary: 0,
      equity: null
    };

    let job = await Job.update("c1", updateDataSetNulls);

    if(job.id){
      job.id = undefined;
    }

    expect(job).toEqual({
      id: undefined,
      title: "title1",
      company_handle: "c1",
      ...updateDataSetNulls
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE company_handle = 'c1'`);

    result.rows[0].id = undefined;

    expect(result.rows).toEqual([{
      id: undefined,
      title: "title1",
      salary: 0,
      equity: null,
      company_handle: "c1"
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update("c4", updateData);
      fail();
    } catch (err) {
      console.log(err);
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove("c1");
    const res = await db.query(
        "SELECT id FROM jobs WHERE company_handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
