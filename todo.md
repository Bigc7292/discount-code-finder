# Discount Code Finder - Project TODO

## Core Features
- [x] Database schema for users, subscriptions, discount codes, searches, inbox messages, and referrals
- [x] Stripe integration for payment processing
- [x] Subscription management with 7-day free trial and $9.99/month billing
- [x] AI-powered discount code search across multiple sources
- [x] Automated code verification system with checkout simulation
- [x] User authentication and profile management
- [x] In-app inbox for verified discount codes
- [x] Referral system with unique links and 1 free month reward
- [x] User dashboard with search history
- [x] Admin dashboard for user management
- [x] Admin analytics and monitoring
- [x] Elegant and modern UI design
- [x] Responsive layout for all screen sizes

## Backend Implementation
- [x] Database schema with all required tables
- [x] Stripe webhook handlers for subscription events
- [x] tRPC procedures for subscription management
- [x] AI search integration with web scraping capabilities
- [x] Code verification engine with browser automation
- [x] Inbox message delivery system
- [x] Referral tracking and reward logic
- [x] Admin API endpoints for user management
- [x] Search history tracking
- [x] Subscription status checking middleware

## Frontend Implementation
- [x] Landing page with feature showcase
- [x] User authentication flow
- [x] Search interface with AI-powered results
- [x] User profile page with subscription status
- [x] Inbox component for verified codes
- [x] Search history view
- [x] Referral dashboard with unique link
- [x] Payment and subscription management UI
- [x] Admin dashboard layout
- [x] Admin user management interface
- [x] Admin analytics and metrics display

## Testing & Deployment
- [x] Test subscription flow end-to-end
- [x] Test referral reward system
- [x] Test AI search and verification
- [x] Test Stripe webhook handling
- [x] Create final checkpoint

## Puppeteer Integration
- [x] Install Puppeteer and dependencies
- [x] Create browser automation module for checkout simulation
- [x] Update verification system to use real browser testing
- [x] Add timeout and error handling for browser operations
- [x] Test verification with real merchant websites
- [x] Update verification logs with detailed browser results

## Trial Search Limits
- [x] Add daily search count tracking to users table
- [x] Add search limit reset logic (daily reset)
- [x] Update search creation to check daily limits for trial users
- [x] Set trial users to 15 searches per day
- [x] Keep unlimited searches for paid subscribers
- [x] Display remaining searches in UI for trial users
- [x] Show upgrade prompt when trial limit reached

## Email Notifications
- [x] Set up email notification infrastructure using built-in notification API
- [x] Create email template for search limit warning (3 remaining)
- [x] Create email template for trial expiry warning (24 hours)
- [x] Add notification tracking to prevent duplicate emails
- [x] Implement search limit notification trigger
- [x] Implement trial expiry notification with hourly check
- [x] Test email notifications

## Analytics Dashboard
- [x] Create analytics events table for tracking email opens and clicks
- [x] Add email tracking pixels and click tracking links
- [x] Create analytics aggregation queries for metrics
- [x] Build admin analytics API endpoints
- [x] Create analytics dashboard UI with charts
- [x] Display email engagement metrics (open rate, CTR)
- [x] Display trial-to-paid conversion metrics
- [x] Add date range filters for analytics
- [x] Test analytics tracking and dashboard

## Analytics Enhancements
- [x] Install Recharts library for data visualization
- [x] Create daily email performance trend chart
- [x] Create conversion funnel visualization
- [x] Add time-series data aggregation queries
- [x] Implement cohort analysis backend queries
- [x] Create cohort retention curve visualization
- [x] Add lifetime value calculation by cohort
- [x] Build automated weekly report generator
- [x] Schedule weekly report emails to admins
- [ ] Test all charts and reports
