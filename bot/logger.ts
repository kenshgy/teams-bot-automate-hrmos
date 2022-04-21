// import dotenv from 'dotenv';
// dotenv.config();
const LOG_LEVEL = "debug"

import log4js from "log4js";
log4js.configure({
  appenders: {
    // 標準出力
    stdout: {
      type: 'stdout'
    },
    // ファイル出力
    system: {
      type: 'dateFile',
      filename: './logs/app.log',  // プロジェクトルートディレクトリを起点とした相対パスで解釈される
      pattern: '.yyyy-MM-dd',         // `filename` の後ろにこのパターンでファイル名が付けられる
      keepFileExt: true,              // `true` を指定すると、ローテートしたファイル名の末尾に拡張子が付く
      compress: true,                 // `true` を指定すると、ローテートしたファイルを .gz 形式で圧縮してくれる
      daysToKeep: 5                   // この数以上にログファイルが溜まると、古いファイルを削除してくれる
    }
  },
  categories: {
    // 標準出力とファイルの両方に出力する
    default: {
      appenders: ['stdout', 'system'],
      // level: process.env.LOG_LEVEL
      level: LOG_LEVEL 
    }
  }
});

export const logger = log4js.getLogger();
// logger.level = process.env.LOG_LEVEL
// logger.level = LOG_LEVEL 


// import winston from 'winston';
// const format = winston.format;
// export const logger = winston.createLogger({
//   level: process.env.LOG_LEVEL,
//   format: 
//   format.combine(
//     format.timestamp(),  // timestampを出力する
//     format.cli(),
//     format.printf(info => `[${info.timestamp}] ${info.level} ${info.message}`)
//   ),
//   transports: [
//     new (winston.transports.Console)(),
//     new winston.transports.File({filename: './logs/app.log', level: 'debug'})
//   ]
// });

