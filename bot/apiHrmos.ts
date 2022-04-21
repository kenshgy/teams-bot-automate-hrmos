import {logger} from './logger'

import fetch from 'node-fetch';
import { resolveProjectReferencePath } from 'typescript';

// import AsyncLock from 'async-lock';
// const lock = new AsyncLock({ timeout: 1000 * 30 });

class HermosApi {
  url: string;
  secret: string;

  constructor(url, secret){
    this.url = url;
    this.secret = secret;
  }
  /**
   * トークンを取得します
   * @returns {JSON} ex.{status: 200, token: string }
   */
  getToken() {
    logger.info(this.getToken.name, "start")
    let result = {status:"", token:""};
    return fetch(`${this.url}/v1/authentication/token`, {
      headers: {
          'Authorization': `Basic ${this.secret}`,
          'Content-Type': 'application/json'
      }
    })
    .then(response => {
      result.status = response.status;
      if (!response.ok) {
        logger.error('response.ok', response.ok);
        logger.error('esponse.status:', response.status);
        logger.error('esponse.statusText:', response.statusText);
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then(data => {
      logger.info("token:", data.token, "取得");
      result.token = data.token;
      return result;
    })
    .catch(error => {
      logger.error('tokenの取得でエラーが発生しました', error);
      return result;
    })
    .finally(() => {
      logger.info(this.getToken.name, "end")
    });
  }
  /**
   * トークンを削除します
   * @param {string} token 
   * @returns {JSON} ex.{status:200}
   */
  deleteToken(token) {
    logger.info(this.deleteToken.name, "start")
    let result = {status:""};
    return fetch(`${this.url}/v1/authentication/destroy`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
      result.status = response.status;
      if (!response.ok) {
        logger.error('response.ok', response.ok);
        logger.error('response.status:', response.status);
        logger.error('response.statusText:', response.statusText);
        throw new Error(response.statusText);
      }
      logger.info("token:",token,"を削除しました")
      return response.json();
    })
    .then(data => {
      logger.debug(data);
      return result;
    })
    .catch(error => {
      logger.error('tokenの削除でエラーが発生しました', error);
      return result;
    })
    .finally(() => {
      logger.info(this.deleteToken.name, "end")
    });
  }
  /**
   * ユーザーのリストを取得します
   * @param {string} token 
   * @param {number} page 
   * @returns {JSON} ex.{status:200, users:JSON}
   */
  getUserList(token, page) {
    logger.info(this.getUserList.name, "start")
    logger.info("page=", page)
    let result = {status:"", users:""};
    return fetch(`${this.url}/v1/users?page=${page}`, {
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
      result.status = response.status;
      if(!response.ok) {
        logger.error('response.ok', response.ok);
        logger.error('esponse.status:', response.status);
        logger.error('esponse.statusText:', response.statusText);
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then(data => {
      logger.debug(data)
      result.users = data;
      return result;
    })
    .catch(error => {
      logger.error('ユーザーリストの取得でエラーが発生しました', error);
      return result;
    })
    .finally(() => {
      logger.info(this.getUserList.name, "end")
    });
  }
  /**
   * ユーザーのidを取得します
   * @param {string} token 
   * @param {string} email 
   * @returns {JSON} ex.{status: 200, userid: number}
   */
  async getUserId(token, email){
    logger.info(this.getUserId.name, "start")
    let result = {status:"", userid:""};
    let page = 1;
    let userlist;
    let targetUser;
    try{
      userlist = await this.getUserList(token, page)
      if(userlist.status != "200"){
        throw(userlist.status + "something went wrong");
      }else{
        result.status = userlist.status;
      }
    }catch(error){
      logger.error('ユーザーIDの取得でエラーが発生しました', error);
    }
    while(userlist.users.length){
      targetUser = userlist.users.find((v) => v.email === email)
      if(targetUser != undefined){break;}
      page ++;
      userlist = await this.getUserList(token, page);
    }
    logger.debug(targetUser);
    logger.info(this.getUserId.name, "end")
    result.userid = targetUser.id;
    return result;
  }

  /**
   * Hermos勤怠に打刻リクエストを送信します
   * @module stamplogs
   * @param {number} stamp_type 1:出勤、2:退勤、7:休憩start、8:休憩end
   * @returns {JSON} ex.{status: 200, response: JSON}
  */
  async stampLogs(email, stamp_type) {
    logger.info(this.stampLogs.name, "start");
    logger.debug("email:", email, ", stamp_type:", stamp_type);
    let result = {status:"", response:""}

    const token = await this.getToken();
    const userId = await this.getUserId(token.token, email);

    logger.debug("userid: ", userId.userid);

    return fetch(`${this.url}/v1/stamp_logs`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"user_id":userId.userid,"stamp_type":stamp_type,"latitude":0, "longitude":0,"address":""})
    })
    .then(response => {
      result.status = response.status;
      if(!response.ok) {
        logger.error(this.stampLogs.name, 'response.ok', response.ok);
        logger.error(this.stampLogs.name, 'esponse.status:', response.status);
        logger.error(this.stampLogs.name, 'esponse.statusText:', response.statusText);
        throw new Error(response.statusText);
      }
      logger.info(`打刻が正常しました。ユーザー:${userId}打刻タイプ:${stamp_type}`)
      return response.json();
    })
    .then(data => {
      logger.debug(data);
      result.response = data;
      return result;
    })
    .catch(error => {
      logger.error('打刻でエラーが発生しました', error);
      return result;
    })
    .finally(() => {
      logger.info(this.stampLogs.name, "end");
      this.deleteToken(token.token);
    });
  }
}

export default HermosApi;
