const { ApolloServer, gql } = require("apollo-server");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();
const { DB_URI, DB_NAME, JWT_SECRET } = process.env;
const {
  ApolloServerPluginLandingPageLocalDefault,
} = require("apollo-server-core");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

///////////
const getToken = (user) =>
  jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "30 days" });

const getUserFromToken = async (token, db) => {
  if (!token) {
    return null;
  }
  const tokenData = jwt.verify(token, JWT_SECRET);

  if (!tokenData?.id) {
    return null;
  }
  return await db.collection("User"), findOne({ _id: ObjectId(tokenData.id) });
};

const typeDefs = gql`
  type Query {
    myTaskList: [TaskList!]!
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
    token: String!
  }
  type User {
    id: ID!
    name: String!
    email: String!
    avatar: String
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
    signUp: async (_, data, { db }) => {
      //console.log(data);

      const hashedPass = bcrypt.hashSync(data.password);

      const newUser = {
        ...data,
        password: hashedPass,
      };
      //console.log(newUser);
      const result = await db.collection("Users").insertOne(newUser);
      //const user = result.ops[0];
      console.log(result);
      return {
        token: getToken(user),
      };
    },
    signIn: async (_, data, { db }) => {
      const user = await db.collection("Users").findOne({ email: data.email });
      const isPasswordCorrect =
        user && bcrypt.compareSync(data.password, user.password);

      if (!user || !isPasswordCorrect) {
        throw new Error("Invalid credentials");
      }

      return {
        token: getToken(user),
      };
      //console.log(data.input);
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

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    cache: "bounded",
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    context: async ({ req }) => {
      //console.log(req.headers);
      const user = await getUserFromToken(req.headers.authorization, db);
      return {
        db,
        user,
      };
    },
  });

  // The `listen` method launches a web server.
  server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });
};

start();
// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
