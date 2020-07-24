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
    round: { type: GraphQLString },
    raceName: { type: GraphQLString },
  }),
});

const RootQueryType = new GraphQLObjectType({
  name: "RootQuery",
  fields: () => ({
    driver: {
      type: new GraphQLList(DriverType),
      args: {
        id: { type: GraphQLString },
      },
      description: "Returns driver",
      resolve: (parent, args) => {
        return axios
          .get(
            `https://ergast.com/api/f1/drivers/${args.id}/results.json?limit=400`
          )
          .then((res) => {
            return res.data.MRData.RaceTable.Races;
          });
      },
    },
    drivers: {
      type: new GraphQLList(DriverType),
      resolve: () => {
        return axios
          .get("http://ergast.com/api/f1/drivers.json?limit=1500")
          .then((res) => {
            return res.data.MRData.DriverTable.Drivers;
          });
      },
    },
  }),
});

const schema = new GraphQLSchema({
  query: RootQueryType,
});

module.exports = schema;
