import { default as axios } from "axios";
import * as querystring from "querystring";
import { TeamsActivityHandler, CardFactory, TurnContext, AdaptiveCardInvokeValue, AdaptiveCardInvokeResponse, MessageFactory, TeamsInfo} from "botbuilder";

export interface DataInterface {
  likeCount: number
}

import HermosApi from './apiHrmos';

import dotenv from 'dotenv';
dotenv.config();
const api = new HermosApi(process.env.HRMOS_API_URL, process.env.HRMOS_SECRET);

export class TeamsBot extends TeamsActivityHandler {
  // record the likeCount
  likeCountObj: { likeCount: number };

  constructor() {
    super();

    this.likeCountObj = { likeCount: 0 };

    this.onMessage(async (context, next) => {
      console.log("Running with Message Activity.");

      let txt = context.activity.text;
      const removedMentionText = TurnContext.removeRecipientMention(
        context.activity
      );
      if (removedMentionText) {
        // Remove the line break
        txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
      }
      // teams上のアカウント情報を取得する
      const member = await TeamsInfo.getMember(context, context.activity.from.id);
      // Trigger command by IM text
      switch (txt) {
        case "welcome": {
          const replyText = `${member.name}さん、勤怠自動化botへようこそ! Hermosの入力をteamsから行うbotです。使い方は"learn"と入力してください`;
          await context.sendActivity(MessageFactory.text(replyText, replyText));
          break;
        }
        case "learn": {
          const replyText = `使用方法: in:出勤を記録、out:退勤を記録、break:休憩開始を記録、back:休憩終了を記録`;
          await context.sendActivity(MessageFactory.text(replyText, replyText));
          break;
        }
        case "howto": {
          const replyText = `使用方法: in:出勤を記録、out:退勤を記録、break:休憩開始を記録、back:休憩終了を記録`;
          await context.sendActivity(MessageFactory.text(replyText, replyText));
          break;
        }
        case (txt.includes("おはよう") && txt) || (txt.includes("in") && txt): {
          let result = await api.stampLogs(member.email,1);
          let replyText = "";
          if(result.status != 200){
            replyText = `すみません、打刻できませんでした`;
          }else{
            replyText = `${member.name}さん、おはようございます！`;
          }
          await context.sendActivity(MessageFactory.text(replyText, replyText));
          break;
        }
        case txt.includes("out") && txt: {
          let result = await api.stampLogs(member.email,2);
          let replyText = "";
          if(result.status != 200){
            replyText = `すみません、打刻できませんでした。休憩状態からは退勤できません。一度休憩終了してから退勤のリクエストを送信してください`;
          }else{
            replyText = `${member.name}さん、今日もお疲れ様でした！`;
          }
          await context.sendActivity(MessageFactory.text(replyText, replyText));
          break;
        }
        case txt.includes("break") && txt: {
          let result = await api.stampLogs(member.email,7);
          let replyText = "";
          if(result.status != 200){
            replyText = `すみません、打刻できませんでした`;
          }else{
            replyText = `休憩大事！`;
          }
          await context.sendActivity(MessageFactory.text(replyText, replyText));
          break;
        }
        case txt.includes("back") && txt: {
          let result = await api.stampLogs(member.email,8);
          let replyText = "";
          if(result.status != 200){
            replyText = `すみません、打刻できませんでした`;
          }else{
            replyText = `${member.surname}選手backを宣言。引き続きお仕事頑張ってください!`;
          }
          await context.sendActivity(MessageFactory.text(replyText, replyText));
          break;
        }
        case "version": {
          let replyText = "ver.1.0.0"
          await context.sendActivity(MessageFactory.text(replyText, replyText));
          break;
        }
        case "env": {
          let replyText = process.env.HRMOS_API_URL
          await context.sendActivity(MessageFactory.text(replyText, replyText));
          break;
        }
        /**
         * case "yourCommand": {
         *   await context.sendActivity(`Add your response here!`);
         *   break;
         * }
         */
      }

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id) {

          break;
        }
      }
      await next();
    });
  }

  // Messaging extension Code
  // Action.
  public async handleTeamsMessagingExtensionSubmitAction(
    context: TurnContext,
    action: any
  ): Promise<any> {
    switch (action.commandId) {
      case "createCard":
        return createCardCommand(context, action);
      case "shareMessage":
        return shareMessageCommand(context, action);
      default:
        throw new Error("NotImplemented");
    }
  }

  // Search.
  public async handleTeamsMessagingExtensionQuery(context: TurnContext, query: any): Promise<any> {
    const searchQuery = query.parameters[0].value;
    const response = await axios.get(
      `http://registry.npmjs.com/-/v1/search?${querystring.stringify({
        text: searchQuery,
        size: 8,
      })}`
    );

    const attachments = [];
    response.data.objects.forEach((obj) => {
      const heroCard = CardFactory.heroCard(obj.package.name);
      const preview = CardFactory.heroCard(obj.package.name);
      preview.content.tap = {
        type: "invoke",
        value: { name: obj.package.name, description: obj.package.description },
      };
      const attachment = { ...heroCard, preview };
      attachments.push(attachment);
    });

    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: attachments,
      },
    };
  }

  public async handleTeamsMessagingExtensionSelectItem(
    context: TurnContext,
    obj: any
  ): Promise<any> {
    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: [CardFactory.heroCard(obj.name, obj.description)],
      },
    };
  }

  // Link Unfurling.
  public async handleTeamsAppBasedLinkQuery(context: TurnContext, query: any): Promise<any> {
    const attachment = CardFactory.thumbnailCard("Image Preview Card", query.url, [query.url]);

    const result = {
      attachmentLayout: "list",
      type: "result",
      attachments: [attachment],
    };

    const response = {
      composeExtension: result,
    };
    return response;
  }
}

async function createCardCommand(context: TurnContext, action: any): Promise<any> {
  // The user has chosen to create a card by choosing the 'Create Card' context menu command.
  const data = action.data;
  const heroCard = CardFactory.heroCard(data.title, data.text);
  heroCard.content.subtitle = data.subTitle;
  const attachment = {
    contentType: heroCard.contentType,
    content: heroCard.content,
    preview: heroCard,
  };

  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [attachment],
    },
  };
}

async function shareMessageCommand(context: TurnContext, action: any): Promise<any> {
  // The user has chosen to share a message by choosing the 'Share Message' context menu command.
  let userName = "unknown";
  if (
    action.messagePayload &&
    action.messagePayload.from &&
    action.messagePayload.from.user &&
    action.messagePayload.from.user.displayName
  ) {
    userName = action.messagePayload.from.user.displayName;
  }

  // This Messaging Extension example allows the user to check a box to include an image with the
  // shared message.  This demonstrates sending custom parameters along with the message payload.
  let images = [];
  const includeImage = action.data.includeImage;
  if (includeImage === "true") {
    images = [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtB3AwMUeNoq4gUBGe6Ocj8kyh3bXa9ZbV7u1fVKQoyKFHdkqU",
    ];
  }
  const heroCard = CardFactory.heroCard(
    `${userName} originally sent this message:`,
    action.messagePayload.body.content,
    images
  );

  if (
    action.messagePayload &&
    action.messagePayload.attachment &&
    action.messagePayload.attachments.length > 0
  ) {
    // This sample does not add the MessagePayload Attachments.  This is left as an
    // exercise for the user.
    heroCard.content.subtitle = `(${action.messagePayload.attachments.length} Attachments not included)`;
  }

  const attachment = {
    contentType: heroCard.contentType,
    content: heroCard.content,
    preview: heroCard,
  };

  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [attachment],
    },
  };
}
