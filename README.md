# Living.MadeByDade

A comprehensive personal finance management application with a sci-fi themed interface that helps you track bills, manage bank accounts, analyze spending patterns, and understand your financial health.

## Overview

Living.MadeByDade is a personal finance dashboard designed to help you understand the difference between cash and credit spending. It integrates with your bank accounts through Plaid, automatically categorizes transactions, and provides detailed insights into your financial activity.

## Key Features

### 🏠 Home Dashboard

Your central hub for managing finances at a glance.

- **Spending Money Display**: Real-time view of your available spending money with dynamic color indicators
  - 🔴 Red when negative
  - 🟡 Amber when below $100
  - 🔵 Cyan for healthy balances
  
- **Unpaid Bills Section**: Quick view of upcoming bill payments
  - Toggle to show/hide auto-pay bills
  - One-click mark-as-paid functionality
  - Clear display of bill names and due dates
  
- **Linked Accounts Overview**: All your connected bank accounts in one place
  - Current and available balances
  - Account type badges (checking, savings, credit)
  - Institution names and masked account numbers
  - Credit limits for credit cards
  
- **Recent Activity Feed**: Real-time log of your financial actions and events

### 💰 Bills Management

Stay on top of recurring expenses with powerful bill tracking.

- **Create and Manage Bills**
  - Add bills with customizable details (name, amount, due date)
  - Choose between fixed day of month or end of month due dates
  - Mark bills as auto-pay for automatic tracking
  - Full CRUD operations (Create, Read, Update, Delete)

- **Visual Bill Cards**
  - Large, easy-to-read bill amounts
  - Due date type badges
  - Auto-pay status indicators
  - Quick access edit and delete buttons

### 🏦 Bank Account Linking

Securely connect your financial accounts using Plaid integration.

- **Easy Account Connection**
  - Link accounts from thousands of financial institutions
  - Secure OAuth-based authentication
  - Automatic retrieval of account details
  - Real-time balance updates

- **Comprehensive Account Data**
  - Account names and types
  - Current and available balances
  - Account metadata and identifiers
  - Automatic transaction synchronization

### 📊 Financial Summaries

Deep insights into your spending patterns with cash vs. credit analysis.

- **Aggregated Metrics by Period** (Day, Week, Month)
  
  **Cash Metrics:**
  - Cash In: External income and transfers
  - Cash Out: Spending from cash accounts
  - Savings: Money moved to savings
  - Cash Net: Overall cash position change
  
  **Credit Card Metrics:**
  - CC Purchases: New charges on credit cards
  - CC Payments: Principal amounts paid
  - CC Refunds: Returns and credits received
  - CC Interest & Fees: Cost of credit
  - CC Principal Delta: Net credit card balance change

- **Dual Viewing Modes**
  - **Table View**: Paginated summaries with expandable rows for detailed breakdowns
  - **Charts View**: Visual representations with pie charts and trend analysis

- **Transaction Drill-Down**
  - View detailed transactions for any period
  - See categorized cash inflows and outflows
  - Track internal transfers between your accounts
  - Monitor credit card purchases and payments
  - Identify refunds, reversals, interest, and fees

- **Smart Categorization**
  - Automatic detection of internal transfers
  - Recognition of credit card payment flows
  - Identification of refunds and reversals
  - Tracking of interest and fee charges

### 📝 Activity Tracking

Comprehensive audit trail of all financial actions.

- **Automatic Activity Logging**
  - Bill payment tracking
  - Bill management actions (add, update, delete)
  - Due date notifications
  - Quest completions (gamification support)
  - Detailed timestamps and user attribution

### 🤖 Automated Features

Set-it-and-forget-it automation for hassle-free finance management.

- **Daily Scheduled Jobs**
  - Automatic upcoming bill payment generation (8 AM EST)
  - Transaction data cleanup for older records (9 AM EST)
  
- **Auto-Pay Support**
  - Mark bills as auto-pay
  - Automatic handling of recurring payments
  
- **Real-Time Sync**
  - Transaction synchronization via Plaid webhooks
  - Up-to-date account balances
  - Instant notification of new transactions

### 🔐 Security & Authentication

Your financial data is protected with enterprise-grade security.

- **Clerk Authentication**
  - Secure user authentication
  - Session management
  - Permission-based access control
  
- **Secure Banking Integration**
  - Plaid's bank-level security
  - OAuth-based account linking
  - No storage of banking credentials

## Data You Can Track

### Bills
- Recurring bill definitions
- Due dates (fixed or end of month)
- Auto-pay status
- Bill amounts

### Bill Payments
- Individual payment records
- Paid/unpaid status
- Payment dates
- Associated bill information

### Bank Accounts
- Connected financial institutions
- Multiple account types (checking, savings, credit)
- Current and available balances
- Credit limits for credit cards

### Transactions
- Complete transaction history
- Automatic categorization
- Transaction amounts and dates
- Merchant information
- Smart detection of transfers and payments

### Financial Summaries
- Aggregated metrics by time period
- Cash vs. credit breakdown
- Income and expense tracking
- Savings analysis

### Activity Log
- User actions
- System events
- Timestamps
- Detailed audit information

## Getting Started

### Prerequisites
- Node.js and npm installed
- A Convex account for the backend
- A Clerk account for authentication
- A Plaid account for banking integration

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/WretchedDade/living.madebydade.git
   cd living.madebydade
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables with your Convex, Clerk, and Plaid credentials

4. Start the development server:
   ```bash
   npm run dev
   ```

5. In a separate terminal, start the Convex backend:
   ```bash
   npm run convex
   ```

6. Open your browser and navigate to the provided local URL

### First Steps

1. **Sign up or log in** using the authentication flow
2. **Connect your bank accounts** by visiting the bank setup page
3. **Add your recurring bills** in the Bills section
4. **View your dashboard** to see your spending money and upcoming bills
5. **Explore financial summaries** to understand your spending patterns

## Technology Stack

- **Frontend Framework**: React 19
- **Routing**: TanStack Router
- **State Management**: TanStack Query
- **Backend**: Convex (serverless database)
- **Authentication**: Clerk
- **Banking Integration**: Plaid API
- **Data Visualization**: Recharts
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS with sci-fi theme
- **Form Validation**: React Hook Form + Zod
- **Build Tool**: Vite

## User Interface Theme

The application features a distinctive **sci-fi aesthetic** with:
- Futuristic color schemes
- Smooth animations and transitions
- Modern, clean component design
- Responsive layout for all devices

## Support & Issues

For bugs, feature requests, or questions, please visit:
https://github.com/WretchedDade/living.madebydade/issues

## License

ISC

---

**Made with ❤️ by Dade**
