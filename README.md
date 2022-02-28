# ao22-smt-team-alerts

This repo is created for a lambda to handle SMT alerts on teams channel. There is only one lambda at the moment.

This repo can be used to add more lambda as needed with clear folder naming as we go

master is the root branch, develop to start any develop and feature to make any changes in the code.

Below are the command to get started.

1. npm install
2. npm i serverless
3. npx sls deploy (Need to have you aws credentials configured locally for deployment using aws config/credentials)

There are 3 environment variables defined for the project and needs to be verified if correct values are populated.

1. isTeamsAlertsEnabled - false/true (true only during the AO Event and can turn off after)
2. webHookURL - This is teams webhook where we want to post the alerts.
3. matchStartTime - This is the match start time in UTC ( Example -  '00:00:00' means 11:00:00 Melbourne Time)
4. matchEndTime - This is the match finished time in UTC ( Example - '13:59:59' means 00:59:59 midnight)

Change 2 and 3 accordingly for each day to prevent any false alarms.


# Testing Alarm State Change ([INSUFFICIENT_DATA, ALARM, OK])
# Change the alarm state value to OK and revert it back to ALARM in order to trigger manually

aws cloudwatch set-alarm-state --alarm-name "SMT No Messages Received" --state-value OK --state-reason "testing purposes"

aws cloudwatch set-alarm-state --alarm-name "SMT No Messages Received" --state-value ALARM --state-reason "testing purposes"
