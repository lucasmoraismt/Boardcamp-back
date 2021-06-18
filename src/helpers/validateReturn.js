export default async function validateReturn(id, connection) {
  if (!!id && id <= 0) {
    return 400;
  }

  const request = await connection.query(
    `SELECT * FROM rentals WHERE rentals.id = $1`,
    [id]
  );

  if (request.rows.length === 0) {
    return 404;
  } else if (request.rows[0].returnDate !== null) {
    return 400;
  }

  return request.rows[0];
}
