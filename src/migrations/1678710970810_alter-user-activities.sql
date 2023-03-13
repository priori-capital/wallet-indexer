-- Up Migration
ALTER TABLE user_activity_view RENAME TO user_aggregated_transactions_details;
ALTER TABLE user_activities RENAME TO user_transactions;
-- Down Migration