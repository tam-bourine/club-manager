import { Modal } from "../config/modalConfig";
import { ModalArg, AlertModalArg } from "../types/Messages";
import { sectionPlainText } from "../blocks/generalComponents";

export const getModal = async ({ client, botToken, triggerId, callbackId, title, blocks, submit }: ModalArg) => {
  await client.views
    .open({
      context: botToken,
      trigger_id: triggerId,
      view: {
        type: "modal",
        callback_id: callbackId,
        title: {
          type: "plain_text",
          text: title,
          emoji: true,
        },
        blocks,
        submit: {
          type: "plain_text",
          text: submit,
        },
        close: {
          type: "plain_text",
          text: Modal.Button.cancel,
        },
      },
    })
    .catch((error) => {
      console.error({ error }); // `dispatch_failed`と出た際にはこの中身を探る
    });
};

export const openAlertModal = async ({ client, botToken, triggerId, title, text }: AlertModalArg) => {
  await client.views
    .open({
      context: botToken,
      trigger_id: triggerId,
      view: {
        type: "modal",
        title: {
          type: "plain_text",
          text: title,
          emoji: true,
        },
        blocks: [sectionPlainText({ text })],
        close: {
          type: "plain_text",
          text: Modal.Button.close,
        },
      },
    })
    .catch((error) => {
      console.error({ error });
    });
};
