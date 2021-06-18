import joi from "joi";
import isImageUrl from "is-image-url";

export default function validateGame({
  name,
  image,
  stockTotal,
  categoryId,
  pricePerDay,
}) {
  const gameSchema = joi.object({
    name: joi.string().min(1).max(50).required(),
    image: joi.string().min(1).required(),
    stockTotal: joi.number().positive().required(),
    categoryId: joi.number().positive().required(),
    pricePerDay: joi.number().positive().required(),
  });

  const validation = gameSchema.validate({
    name,
    image,
    stockTotal,
    categoryId,
    pricePerDay,
  });

  if (!!validation.error) {
    return false;
  }
  if (name.trim().length === 0) {
    return false;
  }
  if (!isImageUrl(image)) {
    return false;
  }

  return true;
}
