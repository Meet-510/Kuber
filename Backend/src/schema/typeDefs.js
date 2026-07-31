const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    avatar: String
    accounts: [Account!]!
    notifications: [Notification!]!
    unreadNotifications: Int!
    createdAt: String!
  }

  type Account {
    id: ID!
    userId: ID!
    accountNumber: String!
    balance: Float!
    currency: String!
    transactions: [Transaction!]!
    createdAt: String!
  }

  type Transaction {
    id: ID!
    senderEmail: String!
    receiverEmail: String!
    senderName: String
    receiverName: String
    amount: Float!
    message: String
    status: TransactionStatus!
    type: TransactionType!
    createdAt: String!
  }

  type Notification {
    id: ID!
    userId: ID!
    title: String!
    message: String!
    type: NotificationType!
    read: Boolean!
    relatedId: ID
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # Result of a recipient email lookup before a transfer is sent.
  type RecipientLookup {
    exists: Boolean!
    name: String
  }

  type TransactionPage {
    items: [Transaction!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  enum TransactionStatus {
    PENDING
    COMPLETED
    FAILED
  }

  enum TransactionType {
    TRANSFER
    DEPOSIT
  }

  enum NotificationType {
    TRANSFER_SENT
    TRANSFER_RECEIVED
    SYSTEM
  }

  type Query {
    getMe: User
    getAccounts: [Account!]!
    getTransactions(limit: Int, offset: Int): TransactionPage!
    getNotifications(limit: Int): [Notification!]!
    lookupRecipient(email: String!): RecipientLookup!

    # Dev convenience: returns the most recent plaintext OTP so the frontend
    # can auto-fill the code without SMTP. Always null in production.
    _devPeekOtp(email: String!): String
  }

  type Mutation {
    # ── Auth (password login + OTP-verified signup) ─────────────────────────
    loginUser(email: String!, password: String!): AuthPayload!

    # Register: send OTP to the email; account is NOT created until the OTP
    # is verified. Payload carries email + name + password so verifyRegister
    # can create the row atomically.
    requestRegisterOtp(email: String!, name: String!, password: String!): Boolean!
    verifyRegisterOtp(email: String!, name: String!, password: String!, code: String!): AuthPayload!

    # Forgot / reset password — link-based, mirrors Eventra
    requestPasswordReset(email: String!): Boolean!
    resetPassword(id: ID!, token: String!, password: String!): Boolean!

    logout: Boolean!

    # ── App mutations ───────────────────────────────────────────────────────
    sendTransfer(
      recipientEmail: String!
      amount: Float!
      message: String
      idempotencyKey: String
    ): Transaction!
    markNotificationRead(notificationId: ID!): Notification!
    markAllNotificationsRead: Boolean!
    updateProfile(name: String, avatar: String): User!
  }
`;

export default typeDefs;
