const { ApolloServer, gql } = require("apollo-server");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");
dotenv.config();
const { DB_URI, DB_NAME } = process.env;
const {
  ApolloServerPluginLandingPageLocalDefault,
} = require("apollo-server-core");
const bcrypt = require("bcryptjs");
const typeDefs = gql`
  type Query {
    myTaskList: [TaskList!]!
  }
  type User {
    id: ID!
    name: String!
    email: String!
    avatar: String
  }

  type Mutation {
    signUp(
      email: String!
      password: String!
      name: String!
      avatar: String
    ): AuthUser!
    signIn(email: String!, password: String!): AuthUser!
  }
  type AuthUser {
    user: User!
    token: String!
  }
  type TaskList {
    id: ID!
    createdAt: String!
    title: String!
    process: Float!
    users: [User!]
    todos: [ToDo!]
  }

  type ToDo {
    id: ID!
    content: String!
    isCompleted: Boolean!

    TaskList: TaskList!
  }
`;

const resolvers = {
  Query: {
    myTaskList: () => [],
  },
  Mutation: {
    signUp: (_, { input }) => {
      const hashedPass = bcrypt.hashSync(input.password);
      const user = {
        ...input,
        password: hashedPass,
      };
      const result = db.collection("Users").insert(user);
    },
    signIn: (_, data) => {
      console.log(data);
    },
  },
  User: {
    id: ({ _id, id }) => _id || id,
  },
};

const start = async () => {
  const client = new MongoClient(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });
  await client.connect();
  const db = client.db(DB_NAME);

  const context = {
    db,
  };
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    cache: "bounded",
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    context,
  });

  // The `listen` method launches a web server.
  server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });
};

start();
// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
