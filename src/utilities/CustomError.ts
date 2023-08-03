const CustomError = (c: any, message?: any, status?: any) => {
  return c.json({ error: message ?? "Unknown error" }, status ?? 500);
};

export default CustomError;
