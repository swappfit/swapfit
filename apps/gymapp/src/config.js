

const config = {
  auth0: {
    domain: process.env.REACT_APP_AUTH0_DOMAIN,
    clientId: process.env.REACT_APP_AUTH0_CLIENT_ID,
    audience: process.env.REACT_APP_AUTH0_AUDIENCE,
  },
  api: {
<<<<<<< HEAD
    baseURL: 'https://87a23d31abee.ngrok-free.app/api',
=======
    baseURL: 'http://localhost:5000/api',
>>>>>>> 755f623fedcf2bc0fe929bd70495c0f2e12545ed
  },
};

if (!config.auth0.domain || !config.auth0.clientId) {
    throw new Error("Auth0 domain and clientId are missing. Please check your .env file.");
}

export default config;