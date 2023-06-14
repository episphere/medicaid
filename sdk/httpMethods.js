const baseUrl = 'https://data.medicaid.gov/api/1/';
import localForage from "localforage";

async function getItems(endpoint, downloadFlag = false) {
    try{
        const cachedData = await localForage.getItem(endpoint);
        if (cachedData !== null) {
            return cachedData
        }
        const response = await fetch(baseUrl + endpoint);
        if (response.ok){
            let responseData;
            if (downloadFlag){
                responseData = await response.blob();
            } else {
                responseData = await response.json();
            }
            await localForage.setItem(endpoint, responseData);
            return responseData
        }
    } catch (Error){
        console.log("An error occurred in the API request.")
    }
}

async function postItem(endpoint, payload, headerContent, downloadFlag = false) {
    const options = {
        method: 'POST',
        headers: headerContent,
        body: JSON.stringify(payload)
    };
    try {
        const cachedData = localForage.getItem(endpoint)
        if (cachedData !== null){
            return cachedData
        }
        const response = await fetch(baseUrl + endpoint, options);
        if (response.ok){
            let responseData;
            if (downloadFlag){
                responseData = await response.blob();
            } else {
                responseData = await response.json();
            }
            await localForage.setItem(endpoint, responseData);
            return responseData
        }
    } catch (error) {
        console.log("An error occurred in the API post");
    }
}

export{
    getItems,
    postItem
}
