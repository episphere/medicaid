# CORS Proxy Investigation and Implementation Summary

## Original Question
**"Does this app use a CORS proxy?"**

## Answer
**Before this PR:** No, the MedicaidJS SDK did NOT use a CORS proxy. It made direct fetch requests to three external APIs:
- Medicaid API (`https://data.medicaid.gov/api/1/`)
- FDA API (`https://api.fda.gov/drug/ndc.json`)
- RxNorm API (`https://rxnav.nlm.nih.gov`)

**After this PR:** The SDK now supports optional CORS proxy functionality. By default, it is **disabled** to maintain backward compatibility, but users can enable it if they encounter CORS-related issues.

## Implementation Details

### What Was Added
1. **Optional CORS Proxy Support**: A configurable system that allows routing API requests through a CORS proxy
2. **Configuration Functions**:
   - `setCorsProxy(enabled, proxyUrl)` - Enable/disable proxy with optional custom URL
   - `getCorsProxyConfig()` - Get current proxy configuration
3. **Validation**: Type checking and URL normalization to prevent misconfigurations
4. **Documentation**: Comprehensive README updates and example HTML page

### Why CORS Proxy Might Be Needed
CORS (Cross-Origin Resource Sharing) restrictions can prevent browser-based applications from accessing external APIs if those APIs don't send appropriate CORS headers. A CORS proxy acts as an intermediary that:
1. Receives requests from your application
2. Makes the actual API call on the server side (where CORS doesn't apply)
3. Returns the response with proper CORS headers

### Default Behavior
- **Proxy is DISABLED by default**
- SDK makes direct requests to external APIs
- Most modern APIs (including those used by MedicaidJS) already support CORS

### When to Enable CORS Proxy
- When browser console shows CORS-related errors
- When working in environments with strict CORS policies
- For development/testing purposes

### Production Considerations
- The default proxy URL (cors-anywhere.herokuapp.com) is a public demo with rate limits
- For production use, deploy your own CORS proxy service
- Most of the time, a proxy is NOT needed as the APIs already support CORS

## Usage Examples

### Enable with Default Proxy
```javascript
MedicaidSDK.setCorsProxy(true);
```

### Enable with Custom Proxy
```javascript
MedicaidSDK.setCorsProxy(true, 'https://your-cors-proxy.com/');
```

### Disable Proxy
```javascript
MedicaidSDK.setCorsProxy(false);
```

### Check Current Configuration
```javascript
const config = MedicaidSDK.getCorsProxyConfig();
console.log(config); // { enabled: false, proxyUrl: '...' }
```

## Security Considerations
- ✅ No security vulnerabilities detected by CodeQL
- ✅ Type validation prevents misconfigurations
- ✅ URL normalization prevents malformed requests
- ✅ Default-disabled approach maintains backward compatibility
- ✅ Documentation includes production deployment recommendations

## Testing
All tests passed:
- Configuration getter/setter functions work correctly
- Type validation prevents invalid parameters
- URL normalization adds trailing slashes when needed
- Helper function eliminates code duplication

## Files Modified
1. `sdk/httpMethods.js` - Core proxy implementation
2. `sdk.js` - Export new functions
3. `README.md` - Documentation
4. `examples/cors-proxy-example.html` - Interactive example (new)
