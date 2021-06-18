import joi from "joi";
import dayjs from "dayjs";
import { request } from "express";

export default function validateCustomer({ name, phone, cpf, birthday }) {
  const customerSchema = joi.object({
    name: joi.string().min(1).required(),
    phone: joi.string().min(10).max(11).required(),
    cpf: joi
      .string()
      .pattern(/^\d{11}$/)
      .required(),
  });

  const validation = customerSchema.validate({ name, phone, cpf, birthday });

  if (!!validation.error) {
    return false;
  }
  if (name.trim().length === 0) {
    return false;
  }
  if (dayjs(birthday).format("YYYY-MM-DD") !== birthday) {
    return false;
  }

  return true;
}
