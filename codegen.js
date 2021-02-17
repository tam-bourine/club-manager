// example : @see https://hasura.io/learn/graphql/typescript-react-apollo/codegen/
require("dotenv").config();

module.exports = {
  schema: [
    {
      [`https://${process.env.KIBELA_TEAM_NAME}.kibe.la/api/v1`]: {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.KIBELA_ACCESS_TOKEN}`,
        },
      },
    },
  ],
  overwrite: true,
  generates: {
    "./src/functions/types/kibela.d.ts": {
      plugins: ["typescript"],
    },
  },
};
