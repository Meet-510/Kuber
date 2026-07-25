const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    avatar: String
    accounts: [Account!]!
    goals: [Goal!]!
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

  type Goal {
    id: ID!
    userId: ID!
    name: String!
    targetAmount: Float!
    savedAmount: Float!
    progress: Float!
    deadline: String
    color: String!
    icon: String!
    completed: Boolean!
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

  type SpendingData {
    month: String!
    sent: Float!
    received: Float!
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
    TRANSFER_PENDING
    GOAL_PROGRESS
    SYSTEM
  }

  type Query {
    getMe: User
    getAccounts: [Account!]!
    getTransactions(limit: Int, offset: Int): [Transaction!]!
    getGoals: [Goal!]!
    getNotifications(limit: Int): [Notification!]!
    getSpendingAnalytics: [SpendingData!]!
  }

  type Mutation {
    registerUser(name: String!, email: String!, password: String!): AuthPayload!
    loginUser(email: String!, password: String!): AuthPayload!
    sendTransfer(recipientEmail: String!, amount: Float!, message: String): Transaction!
    createGoal(name: String!, targetAmount: Float!, deadline: String, color: String, icon: String): Goal!
    addToGoal(goalId: ID!, amount: Float!): Goal!
    deleteGoal(goalId: ID!): Boolean!
    markNotificationRead(notificationId: ID!): Notification!
    markAllNotificationsRead: Boolean!
    updateProfile(name: String, avatar: String): User!
  }
`;

export default typeDefs;
