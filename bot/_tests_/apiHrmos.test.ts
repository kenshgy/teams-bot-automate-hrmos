import {logger} from '../logger'
import HermosApi from '../apiHrmos';

import dotenv from 'dotenv';
dotenv.config();
const api = new HermosApi(process.env.HRMOS_API_URL, process.env.HRMOS_SECRET);

const email = process.env.TESTUSER_EMAIL;

// test('testGetToken', async () => {
//   return await api.getToken()
//   .then(data => {
//     logger.info(data)
//     expect(data.status).toEqual(200);
//   })
// });

// test('testDeleteToken', async () => {
//   const res = await api.getToken();
//   return api.deleteToken(res.token)
//   .then(data => {
//     logger.info(data)
//     expect(data.status).toEqual(200);
//   })
// });

// test ('testGetUserList', async() => {
//   const res = await api.getToken();
//   return await api.getUserList(res.token, 1)
//   .then(response => {
//     logger.info(response);
//     expect(response.status).toEqual(200);
//   })
//   .finally(() => {
//     api.deleteToken(res.token);
//   })
// });

// test ('testGetUserId', async() => {
//   const res = await api.getToken();
//   await api.getUserId(res.token, email)
//   .then(response => {
//     logger.info("id:", response)
//     expect(response.status).toEqual(200);
//   })
//   .finally(() => api.deleteToken(res.token))
// });

test ('testStampLogsStartWork', async() => {
  var response = await api.stampLogs(email, 1) 
  expect(response.status).toEqual(200);
});

test ('testStampLogsStartBreak', async() => {
  var response = await api.stampLogs(email, 7) 
  expect(response.status).toEqual(200);
});

test ('testStampLogsBacktoWork', async() => {
  var response = await api.stampLogs(email, 8) 
  expect(response.status).toEqual(200);
});

// test ('testStampLogsEndWork', async() => {
//   var response = await api.stampLogs(email, 2) 
//   expect(response.status).toEqual(200);
// });

