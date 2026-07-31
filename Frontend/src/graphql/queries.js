import { gql } from '@apollo/client';

export const GET_ME = gql`
  query GetMe {
    getMe {
      id
      name
      email
      avatar
      unreadNotifications
      createdAt
      accounts {
        id
        accountNumber
        balance
        currency
      }
    }
  }
`;

export const GET_TRANSACTIONS = gql`
  query GetTransactions($limit: Int, $offset: Int) {
    getTransactions(limit: $limit, offset: $offset) {
      items {
        id
        senderEmail
        receiverEmail
        senderName
        receiverName
        amount
        message
        status
        type
        createdAt
      }
      totalCount
      hasMore
    }
  }
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($limit: Int) {
    getNotifications(limit: $limit) {
      id
      title
      message
      type
      read
      relatedId
      createdAt
    }
  }
`;

export const LOOKUP_RECIPIENT = gql`
  query LookupRecipient($email: String!) {
    lookupRecipient(email: $email) {
      exists
      name
    }
  }
`;

// Dev convenience — returns the plaintext OTP so we don't need SMTP set up
// during development. Returns null in production.
export const DEV_PEEK_OTP = gql`
  query DevPeekOtp($email: String!) {
    _devPeekOtp(email: $email)
  }
`;
