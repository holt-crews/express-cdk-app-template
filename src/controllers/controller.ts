import { Request, Response } from "express";

export const endpoint = async (req: Request, res: Response) => {
  res.status(201).json({
    message: "endpoint response",
  });
};
