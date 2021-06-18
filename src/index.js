import express from "express";
import cors from "cors";
import pg from "pg";
import isImageUrl from "is-image-url";
import joi from "joi";

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
    const request = await connection.query("SELECT * FROM categories");

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
    await connection.query(``);

    res.sendStatus(201);
  } catch {
    res.sendStatus(500);
  }
});

app.get("/games", async (req, res) => {
  try {
    const request = await connection.query(`
    SELECT games.*, category.name as "categoryName" 
    FROM games JOIN categories ON games."categoryName" = categories.name
    `);

    res.status(200).send(request.rows);
  } catch {
    res.sendStatus(500);
  }
});

app.post("/games", async (req, res) => {});

app.listen(4000);
