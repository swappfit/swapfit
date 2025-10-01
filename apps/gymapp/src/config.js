// // src/config.js
// const config = {
//   auth0: {
//     domain: process.env.REACT_APP_AUTH0_DOMAIN,
//     clientId: process.env.REACT_APP_AUTH0_CLIENT_ID,
//     audience: process.env.REACT_APP_AUTH0_AUDIENCE,
//   },
//   api: {
//     baseURL: 'https://b4354295eace.ngrok-free.app/api',
//   },
// };

// if (!config.auth0.domain || !config.auth0.clientId) {
//     throw new Error("Auth0 domain and clientId are missing. Please check your .env file.");
// }

// export default config;

const config = {
  auth0: {
    domain: process.env.REACT_APP_AUTH0_DOMAIN,
    clientId: process.env.REACT_APP_AUTH0_CLIENT_ID,
    audience: process.env.REACT_APP_AUTH0_AUDIENCE,
  },
  api: {
    baseURL: 'https://611ce325aa2c.ngrok-free.app/api',
  },
};

if (!config.auth0.domain || !config.auth0.clientId) {
    throw new Error("Auth0 domain and clientId are missing. Please check your .env file.");
}

export default config;