import { gql } from '@apollo/client';

export const REGISTER_USER = gql`
  mutation RegisterUser($name: String!, $email: String!, $password: String!) {
    registerUser(name: $name, email: $email, password: $password) {
      token
      user {
        id
        name
        email
        avatar
      }
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser($email: String!, $password: String!) {
    loginUser(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        avatar
      }
    }
  }
`;

export const SEND_TRANSFER = gql`
  mutation SendTransfer($recipientEmail: String!, $amount: Float!, $message: String) {
    sendTransfer(recipientEmail: $recipientEmail, amount: $amount, message: $message) {
      id
      status
      amount
      receiverEmail
      receiverName
      message
      createdAt
    }
  }
`;

export const CREATE_GOAL = gql`
  mutation CreateGoal(
    $name: String!
    $targetAmount: Float!
    $deadline: String
    $color: String
    $icon: String
  ) {
    createGoal(
      name: $name
      targetAmount: $targetAmount
      deadline: $deadline
      color: $color
      icon: $icon
    ) {
      id
      name
      targetAmount
      savedAmount
      progress
      deadline
      color
      icon
      completed
    }
  }
`;

export const ADD_TO_GOAL = gql`
  mutation AddToGoal($goalId: ID!, $amount: Float!) {
    addToGoal(goalId: $goalId, amount: $amount) {
      id
      name
      savedAmount
      targetAmount
      progress
      completed
    }
  }
`;

export const DELETE_GOAL = gql`
  mutation DeleteGoal($goalId: ID!) {
    deleteGoal(goalId: $goalId)
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($notificationId: ID!) {
    markNotificationRead(notificationId: $notificationId) {
      id
      read
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String, $avatar: String) {
    updateProfile(name: $name, avatar: $avatar) {
      id
      name
      email
      avatar
    }
  }
`;
