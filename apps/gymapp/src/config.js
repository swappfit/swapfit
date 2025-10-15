

const config = {
  auth0: {
    domain: process.env.REACT_APP_AUTH0_DOMAIN,
    clientId: process.env.REACT_APP_AUTH0_CLIENT_ID,
    audience: process.env.REACT_APP_AUTH0_AUDIENCE,
  },
  api: {
    baseURL: 'http://192.168.31.10:3000/api',
  },
};

if (!config.auth0.domain || !config.auth0.clientId) {
    throw new Error("Auth0 domain and clientId are missing. Please check your .env file.");
}

export default config;