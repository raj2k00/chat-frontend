import React from "react";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider as Provider,
  createHttpLink,
  ApolloLink,
  split,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { RetryLink } from "@apollo/client/link/retry";
import { persistCache, LocalStorageWrapper } from "apollo3-cache-persist";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import QueueLink from "apollo-link-queue";

let httpLink = createHttpLink({
  // uri: "https://chat-app2k00.herokuapp.com/",
  uri: "http://localhost:4000/",
});

const authLink = setContext((_, { headers }) => {
  // // get the authentication token from local storage if it exists
  const token = localStorage.getItem("token");
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

httpLink = authLink.concat(httpLink);

const wsLink = new WebSocketLink({
  // uri: `wss://chat-app2k00.herokuapp.com/`,
  uri: `ws://localhost:4000/`,
  options: {
    reconnect: true,
    connectionParams: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  },
});
const link = new RetryLink();
const queueLink = new QueueLink();
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

const cache = new InMemoryCache();

const fun = async () =>
  await persistCache({
    cache,
    storage: new LocalStorageWrapper(window.localStorage),
  });
fun();

const client = new ApolloClient({
  // link: splitLink,
  link: ApolloLink.from([splitLink, queueLink, link]),
  cache,
  name: "chat-app",
  version: "1.0.0",
  queryDeduplication: false,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
    },
  },
});

export default function ApolloProvider(props) {
  return <Provider client={client} {...props} />;
}
