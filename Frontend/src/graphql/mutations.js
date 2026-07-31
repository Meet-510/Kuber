import { gql } from '@apollo/client';

// ── Auth (password login + OTP-verified signup + forgot-password link) ────

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

// Step 1 of signup — send the OTP; user is NOT created until step 2.
export const REQUEST_REGISTER_OTP = gql`
  mutation RequestRegisterOtp($email: String!, $name: String!, $password: String!) {
    requestRegisterOtp(email: $email, name: $name, password: $password)
  }
`;

// Step 2 — verify OTP and create the account atomically.
export const VERIFY_REGISTER_OTP = gql`
  mutation VerifyRegisterOtp(
    $email: String!
    $name: String!
    $password: String!
    $code: String!
  ) {
    verifyRegisterOtp(email: $email, name: $name, password: $password, code: $code) {
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

export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($id: ID!, $token: String!, $password: String!) {
    resetPassword(id: $id, token: $token, password: $password)
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

// ── App mutations ──────────────────────────────────────────────────────────

export const SEND_TRANSFER = gql`
  mutation SendTransfer(
    $recipientEmail: String!
    $amount: Float!
    $message: String
    $idempotencyKey: String
  ) {
    sendTransfer(
      recipientEmail: $recipientEmail
      amount: $amount
      message: $message
      idempotencyKey: $idempotencyKey
    ) {
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
