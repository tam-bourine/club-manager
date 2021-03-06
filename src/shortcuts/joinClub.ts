import { AllMiddlewareArgs, App, SlackShortcutMiddlewareArgs } from "@slack/bolt";
import { Modal } from "../config/modalConfig";
import { openModal, openAlertModal } from "../modal/modalTemplate";
import { ErrorAlert } from "../config/errorConfig";
import { Club } from "../config/clubConfig";
import { sectionPlainText } from "../blocks/generalComponents";
import { getJoinClubBlocks } from "../blocks/joinClub";
import * as gas from "../api/gas";
// import * as kibela from "../api/kibela";
import * as slack from "../api/slack";

export const enableJoinClubShortcut = (app: App, approvalChannelId: string) => {
  app.shortcut(
    "open_join_club_modal",
    async ({ ack, body, client, context: { botToken } }: SlackShortcutMiddlewareArgs & AllMiddlewareArgs) => {
      ack();

      const response = await gas.api.callNewJoinClub();
      if (!response.success) {
        await client.chat
          .postMessage({
            channel: approvalChannelId,
            text: ErrorAlert.text.NOTIFICATION,
            blocks: [sectionPlainText({ title: Club.label.ERROR, text: ErrorAlert.text.CONTACT_DEVELOPER })],
          })
          .catch((error) => {
            throw new Error(error);
          });
        return;
      }

      const { clubs } = response;
      if (!clubs) {
        await openAlertModal({
          client,
          botToken,
          triggerId: body.trigger_id,
          title: Modal.title.NO_CLUB,
          text: ErrorAlert.text.NO_EXIST_CLUB,
          imageUrl: ErrorAlert.image.SORRY,
        });
        return;
      }

      const injectClubs = clubs.map(({ id, name }) => ({
        text: name,
        value: id,
      }));
      openModal({
        client,
        botToken,
        triggerId: body.trigger_id,
        callbackId: Modal.id.JOIN_CLUB_VIEWS_ID,
        title: Modal.title.JOIN,
        blocks: getJoinClubBlocks(injectClubs),
        submit: Modal.button.REQUEST,
      });
    }
  );

  app.view(
    Modal.id.JOIN_CLUB_VIEWS_ID,
    async ({
      ack,
      view: {
        state: { values },
      },
      client,
      body: {
        user: { id: slackUserId },
      },
    }) => {
      ack();

      const { value: clubRecordId }: { value: string } = values.join_input.join.selected_option;

      const member = await slack.user.getById(slackUserId);
      // const kibelaUsers = await kibela.query.user.getAll();
      // const userKibelaInfo = await kibela.query.user.findByEmail(member.profile.email, kibelaUsers);

      const response = await gas.api.callJoinClub({
        club: {
          id: clubRecordId,
        },
        member: {
          slackId: member.id,
          name: member.real_name,
        },
      });

      const { success, club } = response;
      if (!success || !club || !club.kibelaUrl || !club.channelId) {
        await client.chat
          .postMessage({
            channel: approvalChannelId,
            text: ErrorAlert.text.NOTIFICATION,
            blocks: [sectionPlainText({ title: Club.label.ERROR, text: ErrorAlert.text.CONTACT_DEVELOPER })],
          })
          .catch((error) => {
            console.error({ error });
          });
        return;
      }

      const { kibelaUrl, channelId } = club;

      await Promise.all([
        client.conversations.invite({
          channel: channelId,
          users: slackUserId,
        }),
        // (async () => {
        //   const group = await kibela.query.group.getByNoteUrl(kibelaUrl);
        //   kibela.mutation.user.joinGroup(userKibelaInfo.id, group.id);
        // })(),
      ]);
    }
  );
};
