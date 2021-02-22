import gql from "graphql-tag";
import type { Note } from "../../../../@types/kibela.d";
import { callAPI } from "../../api/kibela";

export const fetchNoteByUrl = async (url: string): Promise<Note> => {
  const query = gql`
    query {
      noteFromPath(path: "${url}") {
        id
        title
        folderName
      }
    }
  `;

  const data = await callAPI(query).catch((err) => {
    throw err;
  });
  return data.noteFromPath;
};
