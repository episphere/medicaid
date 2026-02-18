import {getDatastoreQuerySql} from "../sql.js";

let Plotly;
let plotlyLoadError = null;
let plotlySource = null;

// List of CDN URLs to try in sequence
const CDN_URLS = [
    { name: 'UNPKG', url: 'https://unpkg.com/plotly.js-dist@latest/plotly.js', type: 'script' },
    { name: 'Plotly Official', url: 'https://cdn.plot.ly/plotly-2.27.0.min.js', type: 'script' },
    { name: 'Skypack', url: 'https://cdn.skypack.dev/plotly.js-dist', type: 'module' },
    { name: 'ESM.sh', url: 'https://esm.sh/plotly.js-dist', type: 'module' },
    { name: 'jsDelivr', url: 'https://cdn.jsdelivr.net/npm/plotly.js-dist@2.27.0/+esm', type: 'module' }
];

/**
 * Attempts to load Plotly from a script tag (for non-ESM CDNs)
 */
async function loadPlotlyScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            if (window.Plotly) {
                resolve(window.Plotly);
            } else {
                reject(new Error('Plotly object not found on window after script load'));
            }
        };
        script.onerror = () => reject(new Error(`Failed to load script from ${url}`));
        document.head.appendChild(script);
    });
}

/**
 * Attempts to load Plotly from an ES module import
 */
async function loadPlotlyModule(url) {
    const module = await import(url);
    return module.default || module;
}

/**
 * Attempts to load Plotly from multiple CDN sources with fallback
 */
async function loadPlotly() {
    for (const cdn of CDN_URLS) {
        try {
            console.log(`[Plotly Loader] Attempting to load from ${cdn.name} (${cdn.url})...`);
            
            let loadedPlotly;
            if (cdn.type === 'script') {
                loadedPlotly = await loadPlotlyScript(cdn.url);
            } else {
                loadedPlotly = await loadPlotlyModule(cdn.url);
            }
            
            if (loadedPlotly && typeof loadedPlotly.newPlot === 'function') {
                Plotly = loadedPlotly;
                plotlySource = cdn.name;
                console.log(`[Plotly Loader] ✓ Successfully loaded Plotly from ${cdn.name}`);
                return;
            } else {
                throw new Error('Loaded module does not contain expected Plotly.newPlot function');
            }
        } catch (error) {
            console.warn(`[Plotly Loader] ✗ Failed to load from ${cdn.name}: ${error.message}`);
            plotlyLoadError = error;
            // Continue to next CDN
        }
    }
    
    // If we get here, all CDNs failed
    const errorMsg = `Failed to load Plotly from all CDN sources. Last error: ${plotlyLoadError?.message}`;
    console.error(`[Plotly Loader] ${errorMsg}`);
    plotlyLoadError = new Error(errorMsg);
}

// Load Plotly only in browser environment
if (typeof window !== 'undefined') {
    await loadPlotly();
}
async function getUniqueValues(variable, distribution) {
    // Use State Utilization Data 2014
    let all_values = await getDatastoreQuerySql(`[SELECT ${variable} FROM ${distribution}]`);
    let unique_values = new Set(all_values.map(o => o[variable]));
    return (Array.from(unique_values)).sort();
}

/**
 * Check if Plotly has been successfully loaded
 * @returns {boolean} True if Plotly is loaded and ready to use
 */
function isPlotlyLoaded() {
    return Plotly !== null && Plotly !== undefined && typeof Plotly.newPlot === 'function';
}

function plot(data, layout, type = "line", divElement = null){
    // Validate that Plotly is loaded
    if (!isPlotlyLoaded()) {
        const errorMessage = plotlyLoadError 
            ? `Cannot create plot: Plotly failed to load. Error: ${plotlyLoadError.message}`
            : 'Cannot create plot: Plotly library is not loaded.';
        console.error(`[Plotly] ${errorMessage}`);
        throw new Error(errorMessage);
    }
    
    try {
        const adjustedData = Array.isArray(data) ? data : [data];
        const div = divElement || document.createElement('div');
        adjustedData.forEach(trace => {trace.type = type})
        let config = {
            responsive: true
        }
        
        console.log(`[Plotly] Creating plot with ${adjustedData.length} trace(s) using ${plotlySource || 'unknown'} CDN`);
        Plotly.newPlot(div, adjustedData, layout, config);
        return div;
    } catch (error) {
        const errorMessage = `Failed to create plot: ${error.message}`;
        console.error(`[Plotly] ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

async function getAllData(items, filter, distributions, dataVariables){
    if (items === undefined){
        return;
    }
    const fetchDataPromises = [];
    const itemsArray =  Array.isArray(items) ? items : [items];
    const varsString = dataVariables.join(',')
    const fetchData = async (identifier, item) => {
        let sql = `[SELECT ${varsString} FROM ${identifier}][WHERE ${filter} = "${item}"]`;
        return getDatastoreQuerySql(sql);
    }
    for (let distributionId of distributions) {
        itemsArray.forEach(item => {
            fetchDataPromises.push(fetchData(distributionId, item));
        })
    }
    const result = await Promise.all(fetchDataPromises);
    if (result === undefined){
        throw new Error("All the data could not be retrieved.")
    }
    return result;
}

function plotifyData(data, axis) {
    return Object.values(axis).reduce(
        (result, field) => {
            result[field] = data.map(obj => obj[field]);
            return result;
        },
        {}
    );
}

function averageValues(data) {
    const averagedData = data.reduce((result, obj) => {
        const key = Object.keys(obj)[0];
        const value = parseFloat(obj[key]);
        if (!isNaN(value)) {
            if (!result[key]) {
                result[key] = { sum: value, count: 1 };
            } else {
                result[key].sum += value;
                result[key].count++;
            }
        }
        return result;
    }, {});
    Object.keys(averagedData).forEach((key) => {
        averagedData[key] = averagedData[key].sum / averagedData[key].count;
    });
    return averagedData;
}

function convertDate(date){
    return parseInt(date.split("-").join(""))
}

export {
    getUniqueValues,
    plot,
    getAllData,
    plotifyData,
    averageValues,
    convertDate,
    isPlotlyLoaded
}