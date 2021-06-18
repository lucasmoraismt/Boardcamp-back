import joi from "joi";

export default async function validateRentals(
  { customerId, gameId, daysRented },
  connection
) {
  const rentalSchema = joi.object({
    customerId: joi.number().positive().required(),
    gameId: joi.number().positive().required(),
    daysRented: joi.number().positive().required(),
  });

  const validation = rentalSchema.validate({ customerId, gameId, daysRented });

  if (!!validation.error) {
    return false;
  }

  const gamesRented = await connection.query(
    `SELECT * FROM rentals 
    WHERE "returnDate" is null AND "gameId" = $1`,
    [gameId]
  );
  const stock = await connection.query(
    `SELECT games."stockTotal" FROM games WHERE id = $1`,
    [gameId]
  );

  if (
    parseInt(stock.rows[0].stockTotal) - parseInt(gamesRented.rows.length) <=
    0
  ) {
    return false;
  }

  return true;
}
