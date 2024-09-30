/**
 * smartCardModule.js
 * 
 * A functional module to interact with the Smart Card API.
 * Provides functions to authenticate and retrieve a secret key from a smart card.
 */

/**
 * Checks if the Smart Card API is supported in the current browser.
 * @throws {Error} If the Smart Card API is not supported.
 */
function checkSmartCardSupport() {
    if (!('smartCard' in navigator)) {
        throw new Error("Smart Card API not supported in this browser.");
    }
}

/**
 * Authenticates the user with the smart card using the provided PIN.
 * @param {Object} session - The session object of the smart card.
 * @param {string} pin - The PIN code for authentication.
 * @returns {Promise<void>} Resolves when authentication is successful.
 * @throws {Error} If authentication fails.
 */
async function authenticateUser(session, pin) {
    try {
        const isAuthenticated = await session.authenticate({ method: "PIN", pin });
        if (!isAuthenticated) {
            throw new Error("User authentication failed.");
        }
    } catch (error) {
        console.error("Authentication error:", error);
        throw new Error("Failed to authenticate with the smart card.");
    }
}

/**
 * Connects to the smart card and retrieves the secret key.
 * @param {string} pin - The PIN code for authentication.
 * @returns {Promise<string>} Resolves to the secret key string if successful.
 * @throws {Error} If any step in the process fails.
 */
export async function getSecretKey(pin) {
    try {
        // Step 0: Check for Smart Card API support
        checkSmartCardSupport();

        // Step 1: Request access to the smart card
        const smartCardAccess = await navigator.smartCard.requestAccess();
        if (!smartCardAccess) {
            throw new Error("Unable to access the smart card.");
        }

        // Step 2: Open a session with the smart card
        const cardSession = await smartCardAccess.openSession();
        if (!cardSession) {
            throw new Error("Failed to open a smart card session.");
        }

        try {
            // Step 3: Authenticate using the provided PIN
            await authenticateUser(cardSession, pin);

            // Step 4: Retrieve the secret key from the smart card
            const secretKey = await cardSession.getSecretKey();
            if (!secretKey) {
                throw new Error("No secret key found on the smart card.");
            }

            return secretKey;
        } finally {
            // Step 5: Ensure the session is closed regardless of success or failure
            await cardSession.close();
        }

    } catch (error) {
        console.error("Error while retrieving the secret key from the smart card:", error);
        throw error;
    }
}