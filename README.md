# MedicaidJS
**MedicaidJS** is a versatile Software Development Kit (SDK) designed to facilitate seamless interaction with the [data.gov Medicaid API](https://data.medicaid.gov/). 

## Installation

### Node.js Environment
To integrate MedicaidJS into your Node.js project, use npm for installation:
`npm install medicaid` or `npm ci medicaid`

### Browser Environment
For web-based projects, you can directly import MedicaidJS using ES6 module syntax:
`const MedicaidSDK = await import('https://kunaalagarwal.github.io/medicaid/sdk.js');` 

Script tag loading: `<script type='module' src='https://kunaalagarwal.github.io/medicaid/sdk.js'></script>`
## Resources
###  [Availability](https://kunaalagarwal.github.io/medicaid/)
Visit the landing page to explore the capabilities and the MedicaidJS ecosystem
### [Publication](https://academic.oup.com/bioinformaticsadvances/article/3/1/vbad170/7455249?login=false)
Refer to the published research article for more information about MedicaidJS.
### [Tutorial](https://www.youtube.com/watch?v=5ie68NFGEHs)
Comprehensive tutorial describing the best practices surrounding usage of MedicaidJS.

Note that the "Official" version of the repository lives within the [Episphere Github Repository](https://github.com/episphere/medicaid). Check out this repository for production-ready features.

## CORS Proxy Support
MedicaidJS includes optional CORS proxy support for environments where CORS restrictions prevent direct API access. By default, CORS proxy is **disabled** and the SDK makes direct requests to external APIs.

### Enabling CORS Proxy
To enable CORS proxy support:
```javascript
const MedicaidSDK = await import('https://episphere.github.io/medicaid/sdk.js');
// Enable with default proxy (cors-anywhere.herokuapp.com)
MedicaidSDK.setCorsProxy(true);

// Or specify a custom proxy URL
MedicaidSDK.setCorsProxy(true, 'https://your-cors-proxy.com/');
```

### Disabling CORS Proxy
```javascript
MedicaidSDK.setCorsProxy(false);
```

### Checking Current Configuration
```javascript
const config = MedicaidSDK.getCorsProxyConfig();
console.log(config); // { enabled: false, proxyUrl: 'https://cors-anywhere.herokuapp.com/' }
```

### Note on CORS Proxies
- The default proxy URL (cors-anywhere.herokuapp.com) is a public demo service with rate limits
- For production use, consider deploying your own CORS proxy service
- Most modern APIs (including Medicaid, FDA, and RxNorm APIs) already support CORS, so a proxy may not be necessary


