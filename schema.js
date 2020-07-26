const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLFloat,
} = require("graphql");
const axios = require("axios");
const { response } = require("express");

const DriverInfoType = new GraphQLObjectType({
  name: "DriverInfo",
  fields: () => ({
    driverId: { type: GraphQLString },
    givenName: { type: GraphQLString },
    familyName: { type: GraphQLString },
  }),
});

const SeasonType = new GraphQLObjectType({
  name: "Season",
  fields: () => ({
    season: { type: GraphQLString },
  }),
});

const DriverType = new GraphQLObjectType({
  name: "Driver",
  fields: () => ({
    totalPoints: { type: GraphQLString },
    pointsAvg: { type: GraphQLFloat },
    highestGrid: { type: GraphQLInt },
    gridAvg: { type: GraphQLFloat },
    highestPos: { type: GraphQLInt },
    posAvg: { type: GraphQLFloat },
    raceEntries: { type: GraphQLInt },
    fastestLaps: { type: GraphQLString },
    posGained: { type: GraphQLFloat },
    wins: { type: GraphQLInt },
    champWins: { type: GraphQLString },
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
      description: "Returns driver",
      resolve: (parent, args) => {
        return axios
          .all([
            axios.get(
              `https://ergast.com/api/f1/drivers/${args.id}/results.json?limit=400`
            ),
            axios.get(
              `https://ergast.com/api/f1/drivers/${args.id}/fastest/1/results.json`
            ),
            axios.get(
              `https://ergast.com/api/f1/drivers/${args.id}/driverStandings/1/seasons.json`
            ),
          ])
          .then(
            axios.spread((...res) => {
              let pointsCount = 0;
              let posCount = 0;
              let winCount = 0;
              let highGrid = parseInt(
                res[0].data.MRData.RaceTable.Races[0].Results[0].grid
              );
              let highPos = parseInt(
                res[0].data.MRData.RaceTable.Races[0].Results[0].position
              );
              let posAvg = 0;
              let pointsAvg = 0;
              const entries = parseInt(res[0].data.MRData.total);
              const fastLaps = res[1].data.MRData.total;
              const champWins = res[2].data.MRData.total;
              let posGained = 0;
              let finishedCount = 0;
              let posGainedAvg = 0;
              let gridAvg = 0;
              let gridCount = 0;

              res[0].data.MRData.RaceTable.Races.forEach((race) => {
                pointsCount += parseInt(race.Results[0].points);
                posCount += parseInt(race.Results[0].position);
                gridCount += parseInt(race.Results[0].grid);
                if (race.Results[0].position === race.Results[0].positionText) {
                  finishedCount++;
                  posGained +=
                    parseInt(race.Results[0].grid) -
                    parseInt(race.Results[0].position);
                }
                if (race.Results[0].position === "1") {
                  winCount++;
                }

                if (highGrid > race.Results[0].grid) {
                  highGrid = race.Results[0].grid;
                }
                if (highPos > race.Results[0].position) {
                  highPos = race.Results[0].position;
                }
              });

              posGainedAvg = (posGained / finishedCount).toFixed(2);
              pointsAvg = (pointsCount / entries).toFixed(2);
              posAvg = (posCount / entries).toFixed(2);
              gridAvg = (gridCount / entries).toFixed(2);

              const driverData = {
                totalPoints: pointsCount,
                pointsAvg: pointsAvg,
                highestGrid: highGrid,
                gridAvg: gridAvg,
                highestPos: highPos,
                posAvg: posAvg,
                raceEntries: entries,
                fastestLaps: fastLaps,
                posGained: posGainedAvg,
                wins: winCount,
                champWins: champWins,
              };

              return driverData;
            })
          );
      },
    },
    drivers: {
      type: new GraphQLList(DriverInfoType),
      resolve: () => {
        return axios
          .get("http://ergast.com/api/f1/drivers.json?limit=1500")
          .then((res) => {
            return res.data.MRData.DriverTable.Drivers;
          });
      },
    },
    seasons: {
      type: new GraphQLList(SeasonType),
      resolve: () => {
        return axios
          .get("https://ergast.com/api/f1/seasons.json?limit=100")
          .then((res) => {
            return res.data.MRData.SeasonTable.Seasons;
          });
      },
    },
    season: {
      type: new GraphQLList(DriverInfoType),
      args: {
        year: { type: GraphQLString },
      },
      resolve: (parent, args) => {
        return axios
          .get(`http://ergast.com/api/f1/${args.year}/drivers.json?limit=100`)
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
