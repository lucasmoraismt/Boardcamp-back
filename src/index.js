import express from "express";
import cors from "cors";
import pg from "pg";

import validateGame from "./helpers/validateGame.js";
import validateCustomer from "./helpers/validateCustomer.js";
import validateRentals from "./helpers/validateRentals.js";
import validateReturn from "./helpers/validateReturn.js";
import dayjs from "dayjs";

pg.types.setTypeParser(1082, (str) => str);

const app = express();

const { Pool } = pg;
const connection = new Pool({
  user: "bootcamp_role",
  password: "senha_super_hiper_ultra_secreta_do_role_do_bootcamp",
  host: "localhost",
  port: 5432,
  database: "boardcamp",
});

app.use(cors());
app.use(express.json());

app.get("/categories", async (req, res) => {
  try {
    const request = await connection.query(
      `SELECT categories.id, INITCAP(categories.name) AS name 
      FROM categories;`
    );

    res.send(request.rows);
  } catch {
    res.sendStatus(500);
  }
});

app.post("/categories", async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.sendStatus(400);
  }

  try {
    const request = await connection.query(
      `
    INSERT INTO categories (name) 
    SELECT $1 
    WHERE NOT EXISTS (
      SELECT 1 FROM categories WHERE name=$1
      )`,
      [name.toLowerCase()]
    );

    if (request.rowCount === 0) {
      res.sendStatus(409);
    } else {
      res.sendStatus(201);
    }
  } catch {
    res.sendStatus(500);
  }
});

app.get("/games", async (req, res) => {
  let queryText = `
  SELECT games.id, INITCAP(games.name) AS name, games.image, games."stockTotal", games."categoryId", games."pricePerDay", INITCAP(categories.name) AS "categoryName" 
  FROM games JOIN categories ON games."categoryId"= categories.id`;

  if (!!req.query.name) {
    queryText += ` WHERE games.name ILIKE '${req.query.name}%'`;
  }

  try {
    const request = await connection.query(queryText);

    res.status(200).send(request.rows);
  } catch {
    res.sendStatus(500);
  }
});

app.post("/games", async (req, res) => {
  const { name, image, stockTotal, categoryId, pricePerDay } = req.body;
  const isBodyValid = await validateGame(req.body);

  if (!isBodyValid) {
    res.sendStatus(400);
  } else {
    try {
      const request = await connection.query(
        `INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") 
        SELECT $1, $2, $3, $4, $5 
        WHERE NOT EXISTS (SELECT 1 FROM games WHERE name=$1)
      `,
        [
          name.toLowerCase(),
          image,
          parseInt(stockTotal),
          parseInt(categoryId),
          parseInt(pricePerDay),
        ]
      );

      if (request.rowCount === 0) {
        res.sendStatus(409);
      } else {
        res.sendStatus(201);
      }
    } catch {
      res.sendStatus(500);
    }
  }
});

app.get("/customers", async (req, res) => {
  let queryString = `SELECT * FROM customers`;

  if (!!req.query.cpf) {
    queryString += ` WHERE cpf='${req.query.cpf}%'`;
  }

  try {
    const request = await connection.query(queryString);

    res.status(200).send(request.rows);
  } catch {
    res.sendStatus(500);
  }
});

app.get("/customers/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const request = await connection.query(
      `SELECT * FROM customers WHERE id = $1`,
      [id]
    );

    res.status(200).send(request.rows[0]);
  } catch {
    res.sendStatus(500);
  }
});

app.post("/customers", async (req, res) => {
  const { name, phone, cpf, birthday } = req.body;
  const isBodyValid = validateCustomer(req.body);

  if (!isBodyValid) {
    return res.sendStatus(400);
  }

  try {
    const request = await connection.query(
      `INSERT INTO customers (name, phone, cpf, birthday) 
      SELECT $1, $2, $3, $4 
      WHERE NOT EXISTS (SELECT 1 FROM customers WHERE cpf = $3)`,
      [name, phone, cpf, birthday]
    );

    if (request.rowCount === 0) {
      res.sendStatus(409);
    } else {
      res.sendStatus(201);
    }
  } catch (err) {
    res.sendStatus(500);
  }
});

app.get("/rentals", async (req, res) => {
  let queryString = `
  SELECT rentals.*, 
  jsonb_build_object('name', customers.name, 'id', customers.id) AS customer,
  jsonb_build_object('id', games.id, 'name', INITCAP (games.name), 'categoryId', games."categoryId", 'categoryName', categories.name) AS game
  FROM rentals 
  JOIN customers ON rentals."customerId" = customers.id
  JOIN games ON rentals."gameId" = games.id
  JOIN categories ON categories.id = games."categoryId"`;

  const customerId = req.params.customerId;
  const gameId = req.params.gameId;
  try {
    if (!!customerId) {
      queryString = `
      SELECT rentals.*, 
      jsonb_build_object('name', customers.name, 'id', customers.id) AS customer,
      jsonb_build_object('id', games.id, 'name', games.name, 'categoryId', games."categoryId", 'categoryName', categories.name) AS game
      FROM rentals 
      JOIN customers ON rentals."customerId" = customers.id WHERE "customerId" = $1
      JOIN games ON rentals."gameId" = games.id
      JOIN categories ON categories.id = games."categoryId"`;
      const request = await connection.query(queryString, [customerId]);

      res.status(200).send(request.rows);
    } else if (!!gameId) {
      queryString += `
      SELECT rentals.*, 
      jsonb_build_object('name', customers.name, 'id', customers.id) AS customer,
      jsonb_build_object('id', games.id, 'name', games.name, 'categoryId', games."categoryId", 'categoryName', categories.name) AS game
      FROM rentals 
      JOIN customers ON rentals."customerId" = customers.id
      JOIN games ON rentals."gameId" = games.id WHERE "gameId" = $1
      JOIN categories ON categories.id = games."categoryId"`;
      const request = await connection.query(queryString, [gameId]);

      res.status(200).send(request.rows);
    } else {
      const request = await connection.query(queryString);

      res.status(200).send(request.rows);
    }
  } catch {
    res.sendStatus(500);
  }
});

app.post("/rentals", async (req, res) => {
  const { customerId, gameId, daysRented } = req.body;
  const isBodyValid = await validateRentals(req.body, connection);

  if (!isBodyValid) {
    res.sendStatus(400);
  } else {
    try {
      const request = await connection.query(
        `
      INSERT INTO rentals ("customerId", "gameId",  "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") 
      SELECT $1, $2, $3, $4, $5, $4 * games."pricePerDay" AS "originalPrice", $6 
      FROM games, customers WHERE customers.id = $1 AND games.id = $2`,
        [
          customerId,
          gameId,
          dayjs().format("YYYY-MM-DD"),
          daysRented,
          null,
          null,
        ]
      );

      if (request.rowCount === 0) {
        res.sendStatus(400);
      } else {
        res.sendStatus(201);
      }
    } catch (err) {
      res.sendStatus(500);
    }
  }
});

app.post("/rentals/:id/return", async (req, res) => {
  const id = req.params.id;
  const validation = await validateReturn(id, connection);

  if (typeof validation === "number") {
    return res.sendStatus(validation);
  }

  try {
    const returnDate = dayjs().format("YYYY-MM-DD");
    let diff = dayjs().diff(validation.rentDate, "day");
    let delayFee = null;

    if (diff - validation.daysRented > 0) {
      delayFee = 0;
    } else {
      delayFee = diff * (validation.originalPrice / validation.daysRented);
    }
    const request = await connection.query(
      `UPDATE rentals SET "returnDate" = $1, "delayFee" = $2`,
      [returnDate, delayFee]
    );

    res.sendStatus(200);
  } catch {
    res.sendStatus(500);
  }
});

app.delete("/rentals/:id", async (req, res) => {
  const id = req.params.id;
  const validation = await validateReturn(id, connection);

  if (typeof validation === "number") {
    return res.sendStatus(validation);
  }

  try {
    const request = await connection.query(
      `DELETE FROM rentals WHERE rentals.id = $1`,
      [id]
    );

    res.sendStatus(200);
  } catch {
    res.sendStatus(500);
  }
});

app.listen(4000);
