const axios = require('axios');

class TestRail {
    constructor({ host, username, apiKey, projectId }) {
        this.host = host;
        this.username = username;
        this.apiKey = apiKey;
        this.projectId = projectId;
    }

    async addResultForCase(runId, caseId, statusId, comment) {
        try {
            const response = await axios.post(
                `${this.host}/index.php?/api/v2/add_result_for_case/${runId}/${caseId}`,
                {
                    status_id: statusId, // 1 = Passed, 2 = Blocked, 5 = Failed, etc.
                    comment: comment
                },
                {
                    auth: {
                        username: this.username,
                        password: this.apiKey,
                    },
                }
            );
            console.log(`Test case ${caseId} updated with status ${statusId}`);
        } catch (error) {
            console.error('Error updating test result in TestRail:', error);
        }
    }
}

module.exports = TestRail;
