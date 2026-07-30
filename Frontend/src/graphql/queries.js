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

export const GET_GOALS = gql`
  query GetGoals {
    getGoals {
      id
      name
      targetAmount
      savedAmount
      progress
      deadline
      color
      icon
      completed
      createdAt
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

export const GET_SPENDING_ANALYTICS = gql`
  query GetSpendingAnalytics {
    getSpendingAnalytics {
      month
      sent
      received
    }
  }
`;
