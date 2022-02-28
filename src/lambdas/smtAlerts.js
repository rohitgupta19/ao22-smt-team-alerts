'use strict';
const axios = require("axios");
var moment = require('moment-timezone');
const WebHookDefault = 'https://m365x278630.webhook.office.com/webhookb2/de1dc647-aa5d-404c-9664-57ff8491d718@98064929-c7a9-47e5-9710-4bafd89e3b0f/IncomingWebhook/ace5a73f5459455a8ffc9e9c4d2960e3/1a0bade3-43af-4ccf-8f81-68e19fea43b7';
var format = "YYYY-MM-DD HH:mm:ss";
var tz = 'Australia/Melbourne';
const WebHookURL = process.env.webHookURL ? process.env.webHookURL : WebHookDefault ;
const matchStartTime = process.env.matchStartTime ? process.env.matchStartTime : '00:00:00'; // This is UTC time, In Melbourne corresponds to 11 AM
const matchEndTime = process.env.matchEndTime ? process.env.matchEndTime : '13:59:59'; // This is UTC time, In Melbourne corresponds to 1 AM (Midnight)
const isTeamsAlertsEnabled = process.env.isTeamsAlertsEnabled ? process.env.isTeamsAlertsEnabled : false;

exports.handler = async (event) => {
    console.log('WebHookURL', WebHookURL);
    console.log('received event', JSON.stringify(event));

    if (!isTeamsAlertsEnabled || isTeamsAlertsEnabled === "false") {
        console.log('Teams Alert not enabled, please enable it first');
        return false;
    }

    const message = event.Records[0].Sns.Message;
    console.log('From SNS:', message);
    const timeStamp = event.Records[0].Sns.Timestamp;
    console.log('timeStamp:', timeStamp);
    const localDateTime = getLocalDateTime(timeStamp);
    console.log('localDateTime:', localDateTime);


    const timestampFromSnS = moment(new Date(timeStamp)).tz(tz).format(format);
    console.log("timestampFromSnS : " + timestampFromSnS);

    // Hacky fix to substract a day for formattedMatchStartTime and formattedMatchEndTime since converting to Melbourne time will change the utc date.
    // This is a temporary fix and require a nice fix. Probably treat everything as UTC date for comparison
    let formattedMatchStartTime = moment().set({
        "hour": matchStartTime.split(":")[0],
        "minute": matchStartTime.split(":")[1],
        "second": matchStartTime.split(":")[2]
    }).tz(tz).subtract(1, 'day').format(format);
    console.log("formattedMatchStartTime : " + formattedMatchStartTime);

    let formattedMatchEndTime = moment().set({
        "hour": matchEndTime.split(":")[0],
        "minute": matchEndTime.split(":")[1],
        "second": matchEndTime.split(":")[2]
    }).tz(tz).subtract(1, 'day').format(format);
    console.log("formattedMatchEndTime : " + formattedMatchEndTime);

    const isEndTimeBeforeStartTime =  moment(formattedMatchEndTime).isBefore(formattedMatchStartTime);
    console.log("isEndTimeBeforeStartTime : " + isEndTimeBeforeStartTime);

    if(isEndTimeBeforeStartTime) {
        formattedMatchEndTime=  moment(formattedMatchEndTime).add(1, 'day').format(format);
        console.log("formattedMatchEndTime : " + formattedMatchEndTime);
    }

    const isMatchBetween = moment(timestampFromSnS).isBetween(formattedMatchStartTime, formattedMatchEndTime);
    console.log("isMatchBetween : " + isMatchBetween);

    let snsAlerts = ''
    let isSMTStoppedMessages = false;
    if (message.indexOf('Players') > -1) {
        console.log("Contains Players")
        snsAlerts = `AllPlayers - New SMT AlLPlayers message received at ${localDateTime}`;
    } else if (message.indexOf('Schedule') > -1) {
        console.log("Contains Schedule")
        snsAlerts = `Schedule - New SMT Schedule message received at ${localDateTime}`;
    } else if (message.indexOf('No Messages Received') > -1) {
        console.log("SMT No Messages Received");
        isSMTStoppedMessages = true;
        snsAlerts = `No SMT Messages Received at ${localDateTime} while AO22 Event is going on. Please verify if this is a real issue or a false alarm`;
    } else {
        console.log("No AllPlayers or Schedule")
        snsAlerts = message;
    }

    console.log('snsAlerts', snsAlerts);
    let teamDefaultMessageCard = {
        "type": "message",
        "attachments": [{
            "contentType": "application/vnd.microsoft.card.adaptive",
            "contentUrl": null,
            "content": {
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "type": "AdaptiveCard",
                "version": "1.2",
                "body": [{
                    "type": "TextBlock",
                    "text": snsAlerts,
                    "wrap": true,
                    "weight": "bolder",
                    "size": "large"
                }]
            }
        }]
    };

    console.log('teamDefaultMessageCard', JSON.stringify(teamDefaultMessageCard));
    if (isSMTStoppedMessages) {
        if (isMatchBetween) {
            const response = await axios.post(WebHookURL, teamDefaultMessageCard);
            console.log('response.data', response.data);
        } else {
            console.log('Matches are finished so no SMT messages expected');
        }
    } else {
        const response = await axios.post(WebHookURL, teamDefaultMessageCard);
        console.log('response.data', response.data);
    }

    return {
        statusCode: 200,
        body: {
            'success': true,
            'data': 'post is completed'
        },
    };

};

function getLocalDateTime(timestamp) {
    var currentDateTime;
    var tz = 'Australia/Melbourne';
    currentDateTime = moment(timestamp).tz(tz).format(format);
    return currentDateTime;
}