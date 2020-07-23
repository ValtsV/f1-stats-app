const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
} = require("graphql");
const axios = require("axios");
const { response } = require("express");

const DriverType = new GraphQLObjectType({
  name: "Driver",
  fields: () => ({
    driverId: { type: GraphQLString },
    givenName: { type: GraphQLString },
    familyName: { type: GraphQLString },
  }),
});

const RootQueryType = new GraphQLObjectType({
  name: "RootQuery",
  fields: () => ({
    driver: {
      type: DriverType,
      args: {
        id: { type: GraphQLString },
      },
      description: "List of All Drivers",
      resolve: (parentValue, args) => {
        return axios
          .get(`http://ergast.com/api/f1/drivers/${args.id}.json`)
          .then((res) => {
            return res.data.MRData.DriverTable.Drivers[0];
          });
      },
    },
  }),
});

const schema = new GraphQLSchema({
  query: RootQueryType,
});

module.exports = schema;
