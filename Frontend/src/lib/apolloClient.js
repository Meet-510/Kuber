import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('kuber_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const { message } of graphQLErrors) {
      if (message === 'Authentication required') {
        localStorage.removeItem('kuber_token');
        window.location.href = '/login';
      }
    }
  }
  if (networkError) {
    console.error('Network error:', networkError);
  }
});

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Offset-based pagination: separate cache buckets per page size,
          // and merge incoming pages into the list at their offset so
          // "load more" appends instead of replacing.
          getTransactions: {
            keyArgs: ['limit'],
            merge(existing, incoming, { args }) {
              const offset = args?.offset ?? 0;
              const items = existing ? existing.items.slice(0) : [];
              for (let i = 0; i < incoming.items.length; i++) {
                items[offset + i] = incoming.items[i];
              }
              return { ...incoming, items };
            },
          },
          getNotifications: { merge: false },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
