function getSettings(userId) {
    return {
        checkvist: {
            username: process.env.CV_USERNAME,
            apiKey: process.env.CV_API_KEY,
            checklistId: process.env.LIST_ID
        }
    };
}

exports.getSettings = getSettings;