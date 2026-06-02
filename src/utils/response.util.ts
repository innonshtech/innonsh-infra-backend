export const sendResponse = (
  res: any,
  statusCode: number,
  message: string,
  data: any = null
) => {
  res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
  });
};
