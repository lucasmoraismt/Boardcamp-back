import express from "express";
import cors from "cors";
import pg from "pg";

import validateGame from "./helpers/validateGame.js";

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
      `SELECT id, INITCAP(name) as name 
      FROM categories;`
    );

    res.send(request.rows);
  } catch {
    res.sendStatus(500);
  }
});

app.post("/categories", async (req, res) => {
  const body = req.body;

  if (!body.name || body.name.trim().length === 0) {
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
      [body.name.toLowerCase()]
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
  SELECT games.id, INITCAP(games.name) AS name, games.image, games.stockTotal, games.categoryId, games.pricePerDay, categories.name AS "categoryName"
  FROM games JOIN categories
  ON games."categoryId" = categories.id`;

  if (!!req.query.name) {
    queryText += ` WHERE games.name ILIKE '${req.query.name}%'`;
    console.log(queryText, req.query.name);
  }

  try {
    const request = await connection.query(queryText);

    res.status(200).send(request.rows);
  } catch {
    res.sendStatus(500);
  }
});

app.post("/games", async (req, res) => {
  const body = req.body;
  const isBodyValid = validateGame(body);

  console.log(isBodyValid);
  if (!isBodyValid) {
    res.sendStatus(400);
  } else {
    console.log(body.name.toLowerCase());
    try {
      const request = await connection.query(
        `INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") 
        SELECT $1, $2, $3, $4, $5 
        WHERE NOT EXISTS (SELECT 1 FROM games WHERE name=$1)
      `,
        [
          body.name.toLowerCase(),
          body.image,
          parseInt(body.stockTotal),
          parseInt(body.categoryId),
          parseInt(body.pricePerDay),
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

app.get("/customers", async (req, res) => {});

app.listen(4000);
