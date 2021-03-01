import Constants from "../../shared/Constants";
import Response from "../../shared/Response";
import JoinInterface from "../../shared/types/JoinInterface";
import JoinView from "../../views/Club/JoinView";

export default class JoinModel {
  private res = new Response();

  private view = new JoinView();

  private constants = new Constants();

  addMember(params: JoinInterface) {
    // FIXME #111 https://github.com/tam-bourine/club-manager/issues/111
    // @ts-ignore
    const { slackChannelId, member } = params;

    try {
      const sheetTabName = PropertiesService.getScriptProperties().getProperty("SHEET_TAB_NAME");
      if (!sheetTabName) {
        return this.view.provide(this.res.internalServer);
      }

      const clubsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetTabName);
      const clubs = clubsSheet?.getDataRange().getValues();

      const club = this.findClubBySlackChannelId(clubs, slackChannelId);

      const clubNameArrayNumber = this.constants.SPREAD_SHEET.CLUBS.CLUB_NAME_COLUMN_NUMBER - 1;
      const clubName = club[clubNameArrayNumber];
      this.createMember(member, clubName);
      return this.view.provide(this.res.created);
    } catch (error) {
      return this.view.provide(this.res.internalServer);
    }
  }

  private findClubBySlackChannelId(clubs: any[] | undefined, slackChannelId: string) {
    const slackChannelIdArrayNumber = this.constants.SPREAD_SHEET.CLUBS.SLACK_CHANNEL_ID_COLUMN_NUMBER - 1;
    return clubs?.filter((club: any[]) => club[slackChannelIdArrayNumber] === slackChannelId)[0];
  }

  private createMember(member: JoinInterface["member"], clubName: string) {
    const today = new Date();
    const newMember = {
      name: member.name,
      slackId: member.slackId,
      role: "",
      joinDate: today.toISOString(),
      leftDate: "",
    };
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(clubName);
    sheet?.appendRow(Object.values(newMember));
  }
}
