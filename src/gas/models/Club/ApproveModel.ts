import Constants from "../../shared/Constants";
import Response from "../../shared/Response";
import ApproveInterface from "../../shared/types/ApproveInterface";
import ResponseInterface from "../../shared/types/ResponseInterface";
import ApproveView from "../../views/Club/ApproveView";

/* global GoogleAppsScript */
export interface UpdateAuthorizerParams {
  sheet: GoogleAppsScript.Spreadsheet.Sheet;
  exists: number;
  authorizer: ApproveInterface["authorizer"];
}

export interface updateIsApproved {
  club: ApproveInterface["club"];
  authorizer: ApproveInterface["authorizer"];
  isApproved: ApproveInterface["isApproved"];
}

export interface CreateClubSheetParams {
  club: ApproveInterface["club"];
}

export interface InsertInitialValuesParams {
  channelId: string;
  clubName: string;
  kibelaUrl: string;
  members: {
    name: string;
    slackId: string;
    role: string;
    joinedDate: string;
    leftDate: string;
  }[];
}

export default class ApproveModel {
  private res = new Response();

  private view = new ApproveView();

  private constants = new Constants();

  approveClub(params: ApproveInterface) {
    /**
     * @description
     *  Bolt 側からは基本的に TRUE で送信されて来るが
     *  UI の変更などで FALSE で送信が追加された場合も想定する
     *
     *  Approved : 公認セルを TRUE で更新
     *  Rejected : 公認セルを FALSE で更新
     */
    const { club, authorizer, isApproved } = params;

    const response = this.updateIsApproved({ club, authorizer, isApproved });

    /**
     * @description
     *  updateApprovedclub が成功し、かつ公認が TRUE の場合は createClubSheet をコールしてシート作成
     */
    if (response === this.res.created && isApproved) return this.view.provide(this.createClubSheet(params));
    return this.view.provide(response);
  }

  private updateIsApproved(params: updateIsApproved) {
    const { club, authorizer, isApproved } = params;
    try {
      const sheetTabName = PropertiesService.getScriptProperties().getProperty("SHEET_TAB_NAME");
      if (sheetTabName) {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetTabName);
        const data = sheet?.getDataRange().getValues();
        /**
         * @description
         *  &&
         *    @see https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Logical_AND
         *
         *  `rowData.includes && rowIndex` によって、 clubId が行に含まれている場合
         *  && の右の rowIndex(クラブが含まれる行の index)が return される
         *  clubId が行に含まれていない場合は false が return される
         *
         *  existsClubInRow
         *    [false, 4, false, false, ... ,false] のようなデータになる
         */
        const existsClubInRow = data?.map((rowData, rowIndex) => {
          return rowData.includes(club.id) && rowIndex;
        });
        /**
         * @description
         *  existsClubInRow の各要素 exists が false 以外(clubId と id が一致するクラブが存在する)の場合
         *  sheet?.getRange(exists + 1, this.constants.SPREAD_SHEET.APPROVED_COLUMN_NUMBER).setValue(isApproved)
         *  が実行される
         *
         *  result
         *    [false, Range, false, false, ..., false] のようなデータになる
         */
        const results = existsClubInRow?.map((exists) => {
          return (
            exists &&
            sheet
              ?.getRange(exists + 1, this.constants.SPREAD_SHEET.CLUBS.APPROVED_COLUMN_NUMBER)
              .setValue(isApproved) &&
            this.updateAuthorizer({ sheet, exists, authorizer })
          );
        });
        /**
         * @description
         *  Array.prototype.every
         *    @see https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/every
         *
         *  results に false が含まれない(シートの更新が正常に終了した)場合
         *  201 created を返す
         */
        if (results?.every((result) => typeof result === "boolean")) {
          return this.res.notFound;
        }
        return this.res.created;
      }
      return this.res.internalServer;
    } catch (error) {
      return this.res.internalServer;
    }
  }

  private updateAuthorizer(params: UpdateAuthorizerParams) {
    const { sheet, exists, authorizer } = params;
    return (
      sheet
        .getRange(exists + 1, this.constants.SPREAD_SHEET.CLUBS.AUTHORIZER_SLACK_ID_COLUMN_NUMBER)
        .setValue(authorizer.slackId) &&
      sheet
        .getRange(exists + 1, this.constants.SPREAD_SHEET.CLUBS.AUTHORIZER_NAME_COLUMN_NUMBER)
        .setValue(authorizer.name)
    );
  }

  private createClubSheet(params: CreateClubSheetParams) {
    const { club } = params;
    try {
      const sheetTabName = PropertiesService.getScriptProperties().getProperty("SHEET_TAB_NAME");
      if (sheetTabName) {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetTabName);
        const data = sheet?.getDataRange().getValues();
        /**
         * @description
         *  Array.prototype.reduce
         *    @see https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
         *
         *  reduce で Bolt 側から送信された slackChannelId を includes している行を取り出す
         */
        const rowDataIncludesClub = data?.reduce((acc, cur) => {
          if (cur.includes(club.id)) return cur;
          return acc;
        }, []);
        if (rowDataIncludesClub) {
          /**
           * @description
           *  GAS は index が1開始なので constants.SPREAD_SHEET.CLUB_NAME_COLUMN_NUMBER - 1 で配列から
           *  clubName と channelId を取り出す
           */
          const clubNameIndex = this.constants.SPREAD_SHEET.CLUBS.CLUB_NAME_COLUMN_NUMBER - 1;
          const clubName = rowDataIncludesClub[clubNameIndex];
          const channelIdIndex = this.constants.SPREAD_SHEET.CLUBS.SLACK_CHANNEL_ID_COLUMN_NUMBER - 1;
          const channelId = rowDataIncludesClub[channelIdIndex];
          const targetSheet = SpreadsheetApp.getActiveSpreadsheet();
          const result = targetSheet.insertSheet(clubName);

          /**
           * @description
           *  初期メンバーは最低3人確定なので、3以上の長さの配列 members (Tuple 扱い)に部活動一覧シートから取得した
           *  部長、発起人1、発起人2 を入れる
           */
          const applicationDate =
            rowDataIncludesClub[this.constants.SPREAD_SHEET.CLUBS.APPLICATION_DATE_COLUMN_NUMBER - 1];
          /*
          部長~部員10のカラムだけ配列の形で抽出
          @example [
              "F2FDKWOI", "キャプテンキッド", "XEF8FDSX", "ほげ山ほげ子", "F39SFDW", "ふが田ふが男", "FJEIANLO", "ららららら", "FJEIANLO", "ららららら", "FJEIANLO", "ららららら", "FJEIANLO", "ららららら",  "", "", "", "", "", "", ""
              ]
          */
          const membersArray: string[] = rowDataIncludesClub.slice(
            this.constants.SPREAD_SHEET.CLUBS.AUTHORIZER_NAME_COLUMN_NUMBER,
            rowDataIncludesClub.length
          );
          const members: InsertInitialValuesParams["members"] = this.toObjectInArrayMembers(
            membersArray,
            applicationDate
          );

          const kibelaUrl = rowDataIncludesClub[this.constants.SPREAD_SHEET.CLUBS.KIBELA_URL_COLUMN_NUMBER - 1];

          if (result) return this.insertClubInitialValues({ clubName, kibelaUrl, members, channelId });
          return this.res.notFound;
        }
      }
      return this.res.internalServer;
    } catch (error) {
      return this.res.internalServer;
    }
  }

  private insertClubInitialValues(params: InsertInitialValuesParams): ResponseInterface {
    const { clubName, kibelaUrl, members, channelId } = params;
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(clubName);
      /**
       * @description
       *  行の名前を付与
       */
      sheet?.appendRow([
        this.constants.SPREAD_SHEET.CLUB.MEMBER.NAME,
        this.constants.SPREAD_SHEET.CLUB.MEMBER.SLACK_ID,
        this.constants.SPREAD_SHEET.CLUB.MEMBER.ROLE,
        this.constants.SPREAD_SHEET.CLUB.MEMBER.JOINED_DATE,
        this.constants.SPREAD_SHEET.CLUB.MEMBER.LEFT_DATE,
      ]);
      /**
       * @description
       *  部長、発起人1、発起人2 を順に追加
       */
      members.forEach((member) => {
        sheet?.appendRow([member.name, member.slackId, member.role, member.joinedDate, member.leftDate]);
      });
      const header = this.res.created;
      return { ...header, club: { channelId, name: clubName, kibelaUrl, members } };
    } catch (error) {
      return this.res.internalServer;
    }
  }

  private toObjectInArrayMembers(membersArray: string[], applicationDate: any) {
    const members: InsertInitialValuesParams["members"] = [];
    membersArray.forEach((value, index) => {
      if (!value) {
        /*
        FIXME: 本当は処理を中断させたい
        NOTE: return文だとfor文でいうcontinueの役割になる。 参考: https://www.deep-rain.com/programming/javascript/778
        for in使いたいけど、Lintに弾かれるので一旦このまま
        */
        return;
      }
      const isIdColumn = !(index % 2);
      const isNameColumn = index % 2;
      if (isIdColumn) {
        members.push({
          name: "",
          slackId: value,
          role: "",
          joinedDate: applicationDate,
          leftDate: "",
        });
      }
      if (isNameColumn) {
        const lastArrayNumber = members.length - 1;
        members[lastArrayNumber].name = value;
      }
    });
    return members;
  }
}
