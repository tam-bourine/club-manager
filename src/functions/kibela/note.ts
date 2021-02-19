import gql from "graphql-tag";
import { KibelaAPI } from "../api/kibela";
import type { Note } from "../../../@types/kibela.d";

const fetchNoteByUrl = async (url: string): Promise<Note> => {
  const query = gql`
    query {
      noteFromPath(path: "${url}") {
        id
        title
        folderName
      }
    }
  `;

  const data = await KibelaAPI(query);
  return data.noteFromPath;
};

export const apploveOfficallyClub = async (url: string, clubName: string): Promise<Note> => {
  const note = await fetchNoteByUrl(url);

  const mutation = gql`
    mutation {
      updateNoteFolder(input: { noteId: "${note.id}", folderFullName: "部活動/公認/${clubName}" }) {
        note {
          id
          title
          folderName
        }
      }
    }
  `;
  const data = await KibelaAPI(mutation);
  return data.updateNoteFolder.note;
};
