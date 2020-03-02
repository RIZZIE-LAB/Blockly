function getHelp(endpoint, robotIP, callback) {

    const url = `http://${robotIP}/api/${endpoint}`;
    
    if (endpoint === 'help') {

        const searchTerm = 'API endpoints';

        return fetch(url)
            .then(response => response.json())
            .then(data => {
                // we want only one part of response from misty
                //const resultObject = JSON.parse(data.result);
				const resultObject = data.result;
                
                const readableResult = {
                    get: getReadableResultFromArray(resultObject.get),
                    post: getReadableResultFromArray(resultObject.post),
                    status: data.status
                };

                console.log(`GetHelp: ${searchTerm}\n`, readableResult);

                if (callback) {
                    callback(data.result);
                }
            })
            .catch(err => console.log(err))    

    } else if (endpoint.includes('?command=')) {

        const urlParts = endpoint.split('?command=');
        const searchTerm = urlParts[1];

        return fetch(url)
            .then(response => response.json())
            .then(data => {

                const resultObject = JSON.parse(data.result);
                const readableResult = getReadableResultFromObject(resultObject);

                console.log(`GetHelp: ${searchTerm}\n`, readableResult);

                if (callback) {
                    callback(data.result);
                }
            })
            .catch(err => console.log(err))
    }
}

// this function reformats the response from Misty for displaying the information for get requests. 
function getReadableResultFromArray(array) {

    const readableInformation = array.map((apiEndpoint) => {

        const { endpoint, baseApiCommand, apiCommand } = apiEndpoint;
        const { apiCommandGroup, commandType, id, name, resultType, arguments } = apiCommand;

        return {
            [endpoint]: { baseApiCommand, endpoint, apiCommandGroup, commandType, id, name, resultType, arguments }
        }

    });

    return readableInformation;
}

function getReadableResultFromObject(object) {

    const readableInformation = {};

        for (requestMethod in object) {
           
            const { endpoint, baseApiCommand, apiCommand } = object[requestMethod];
            const { apiCommandGroup, commandType, id, name, resultType, arguments } = apiCommand;

            readableInformation[requestMethod] = {
                [endpoint]: { baseApiCommand, endpoint, apiCommandGroup, commandType, id, name, resultType, arguments }
            }
        }

    return readableInformation;
}