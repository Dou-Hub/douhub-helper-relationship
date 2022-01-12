//  COPYRIGHT:       DouHub Inc. (C) 2021 All Right Reserved
//  COMPANY URL:     https://www.douhub.com/
//  CONTACT:         developer@douhub.com
//
//  This source is subject to the DouHub License Agreements.
//
//  Our EULAs define the terms of use and license for each DouHub product.
//  Whenever you install a DouHub product or research DouHub source code file, you will be prompted to review and accept the terms of our EULA.
//  If you decline the terms of the EULA, the installation should be aborted and you should remove any and all copies of our products and source code from your computer.
//  If you accept the terms of our EULA, you must abide by all its terms as long as our technologies are being employed within your organization and within your applications.
//
//  THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY
//  OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT
//  LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
//  FITNESS FOR A PARTICULAR PURPOSE.
//
//  ALL OTHER RIGHTS RESERVED

import _ from "../../libs/helper";
import { HTTPERROR_400 } from "../../douhub-libs/constants";
import graphDb from "../../libs/graph-db";
// import dynamoDb from "../../libs/dynamo-db";

export const processSNSDataToGraphDb = async (event, context, callback) => {

    if (callFromAWSEvents(event)) return;

    //loop through batch SNS records
    const result = await _.processSNSRecords(event.Records, async (record) => {

        const action = await _.getActionDataFromSNSRecord(record);

        const context = action.cx && action.cx.context ? action.cx.context : {};
        const onError = _.validateActionDataFromSNSRecord(context, event, action.data);
        if (onError) return onError;

        const graph = action.graph;

        if (_.track) console.log({ action: JSON.stringify(action) });

        if (!(_.isArray(graph) && graph.length > 0)) return _.onError(null, { context, event }, HTTPERROR_400, 'ERROR_API_MISSING_GRAPH', 'The graph is not provided.');

        try {
            console.log('DONE');
        }
        catch (error) {
            return _.onError(null, { context, event }, error, 'ERROR_API_FAILED_SENDEMAIL', 'The email is failed to send.');
        }
    });

    if (_.track) console.log({ result });
};


export const sendRelationship = async (event, context, callback) => {

    const caller = await _.checkCaller(event, context, callback);
    if (caller) return caller;

    const cx = await _.cx(event);
    const settings = {};
    const name = _.getPropValueOfEvent(event, 'name');

    if (_.isNonEmptyString(name)) settings.name = name;

    try {
        const id = await _.sendGraph(cx, [{
            source: _.getObjectValueOfEvent(event, 'source'),
            target: _.getObjectValueOfEvent(event, 'target'),
            relationship: _.getPropValueOfEvent(event, 'relationship')
        }], settings);
        return _.onSuccess(callback, cx, { id });
    }
    catch (error) {
        return _.onError(callback, cx, error, 'ERROR_API_SYSTEM', `Failed to send relationship.`);
    }
}


export const sendGraph = async (event, context, callback) => {

    const caller = await _.checkCaller(event, context, callback);
    if (caller) return caller;

    const cx = await _.cx(event);
    const settings = {};
    const name = _.getPropValueOfEvent(event, 'name');
    if (_.isNonEmptyString(name)) settings.name = name;

    try {
        const id = await _.sendGraph(cx, _.getArrayPropValueOfEvent(event, 'graph'), settings);
        return _.onSuccess(callback, cx, { id });
    }
    catch (error) {
        return _.onError(callback, cx, error, 'ERROR_API_SYSTEM', `Failed to send graph.`);
    }
}

export const test = async (event,context, callback) => {

    const caller = await _.checkCaller(event, context, callback);
    if (caller) return caller;

    const cx = await _.cx(event);
    
    await graphDb.upsertObject(cx, cx.context.user);

}


export const handleSQS = async event => {
    return await _.handleActionSQS(event);
}