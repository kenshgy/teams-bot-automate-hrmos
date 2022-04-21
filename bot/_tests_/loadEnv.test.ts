import dotenv from 'dotenv';
dotenv.config();

test('loadEnvTest', () => {
  expect(process.env.ENVIRONMENT).toEqual("development");
});
