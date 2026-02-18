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

## CORS Proxy Support
When using MedicaidJS in a browser environment, you may encounter Cross-Origin Resource Sharing (CORS) restrictions. To handle this, the SDK provides optional CORS proxy support.

### Configuring a CORS Proxy
```javascript
import { setCorsProxy } from 'medicaid';

// Set a CORS proxy URL
setCorsProxy('https://corsproxy.io/?');

// Now all API requests will be routed through the proxy
```

### Disabling the CORS Proxy
```javascript
import { setCorsProxy } from 'medicaid';

// Clear the CORS proxy to make direct API calls
setCorsProxy('');
```

### Checking Current CORS Proxy Configuration
```javascript
import { getCorsProxy } from 'medicaid';

// Get the currently configured CORS proxy URL
const proxyUrl = getCorsProxy();
console.log(proxyUrl); // Returns empty string if no proxy is set
```

### Example: Conditional CORS Proxy Setup
```javascript
import { setCorsProxy, getSchemas } from 'medicaid';

// Configure CORS proxy only in browser environments
if (typeof window !== 'undefined') {
    setCorsProxy('https://corsproxy.io/?');
}

// Make API calls as usual
const schemas = await getSchemas();
```

**Note:** Popular CORS proxy services include:
- `https://corsproxy.io/?`
- `https://api.allorigins.win/raw?url=`
- Or deploy your own CORS proxy server

## Resources
###  [Availability](https://kunaalagarwal.github.io/medicaid/)
Visit the landing page to explore the capabilities and the MedicaidJS ecosystem
### [Publication](https://academic.oup.com/bioinformaticsadvances/article/3/1/vbad170/7455249?login=false)
Refer to the published research article for more information about MedicaidJS.
### [Tutorial](https://www.youtube.com/watch?v=5ie68NFGEHs)
Comprehensive tutorial describing the best practices surrounding usage of MedicaidJS.

Note that the "Official" version of the repository lives within the [Episphere Github Repository](https://github.com/episphere/medicaid). Check out this repository for production-ready features.


