import { GraphQLError } from 'graphql';

export const authError = () =>
  new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });

export const badRequest = (message) =>
  new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });

export const notFound = (message) =>
  new GraphQLError(message, { extensions: { code: 'NOT_FOUND' } });

export const insufficientFunds = (message = 'Insufficient balance') =>
  new GraphQLError(message, { extensions: { code: 'INSUFFICIENT_FUNDS' } });
