import {getDatasetByKeyword, convertDatasetToDistributionId} from "../metastore.js";
import {getDatastoreQuerySql} from "../sql.js";
import {getAllData, plot, plotifyData, convertDate} from "./plot.js";
import {endpointStore} from "../httpMethods.js";
import {getDatastoreImport} from "../datastore.js";

endpointStore.setItem("NadacUpdate", Date.now());
let ndcs;
let distributions;
await preImport();

/**
 * Retrieves all National Drug Code (NDC) objects from the NADAC dataset.
 * Creates a map of medicine descriptions to their associated NDC codes.
 * Results are cached for performance.
 * 
 * @returns {Promise<Map<string, Set<string>>>} A Map where keys are medicine descriptions 
 *          (ndc_description) and values are Sets of NDC codes
 */
async function getAllNdcObjs() {
    await updateNadac();
    const ndcs = new Map();
    const cacheObj = await endpointStore.getItem("ndcObjMap")
    if (cacheObj !== null) {return cacheObj.response}
    for (let i = 0; i < distributions.length; i += 4){
        if (i >= distributions.length) break;
        const response = await getDatastoreQuerySql(`[SELECT ndc,ndc_description FROM ${distributions[i]}]`);
        response.forEach(ndcObj => {
            if (!ndcs.has(ndcObj["ndc_description"])){
                ndcs.set(ndcObj["ndc_description"], new Set());
            }
            ndcs.get(ndcObj["ndc_description"]).add(ndcObj["ndc"]);
        })
    }
    endpointStore.setItem("ndcObjMap", {response: ndcs, time: Date.now()});
    return ndcs;
}

/**
 * Retrieves a sorted list of all medicine descriptions from the NADAC dataset.
 * 
 * @returns {Promise<string[]>} Sorted array of medicine description strings
 */
async function getNadacMeds(){
    let ndcObjMap = await getAllNdcObjs();
    return [...ndcObjMap.keys()].sort()
}

/**
 * Retrieves all unique National Drug Codes (NDCs) from the NADAC dataset.
 * 
 * @returns {Promise<Set<string>>} Set of all unique NDC codes
 */
async function getNadacNdcs(){
    let ndcObjMap = await getAllNdcObjs();
    return new Set([...ndcObjMap.values()].flatMap(x => Array.from(x)))
}

/**
 * Retrieves all NDC codes associated with a specific medicine description.
 * 
 * @param {string} med - The medicine description (e.g., "CALCITRIOL 1 MCG/ML SOLUTION")
 * @returns {Promise<string[]>} Array of NDC codes for the specified medicine
 * @throws {Error} Throws "Please provide a medicine that is included in the medicaid dataset."
 *         if the medicine is not found
 */
async function getNdcFromMed(med){
    let ndcObjMap = await getAllNdcObjs();
    if (ndcObjMap.has(med)){
        return Array.from(ndcObjMap.get(med));
    }
    throw new Error("Please provide a medicine that is included in the medicaid dataset.");
}

/**
 * Retrieves all medicine descriptions that match the base name of the provided medicine.
 * Matches are based on the first word of the medicine name (case-insensitive).
 * 
 * @param {string} medicine - The medicine name to search for (e.g., "calcitriol")
 * @returns {Promise<string[]>} Array of matching medicine descriptions
 * @example
 * // Returns all medicines starting with "CALCITRIOL"
 * await getMedNames("calcitriol");
 */
async function getMedNames(medicine){
    const baseMedName = medicine.split(" ")[0];
    const medList = Array.from(await getNadacMeds());
    return medList.filter(med => med.split(' ')[0] === `${baseMedName.toUpperCase()}`)
}

/**
 * Retrieves NADAC data for specified items (NDCs or medicine descriptions).
 * 
 * @param {string|string[]} items - NDC code(s) or medicine description(s) to retrieve data for
 * @param {string} [filter="ndc"] - Filter type: "ndc" for NDC codes or "ndc_description" for medicine names
 * @param {string[]} [dataVariables=["as_of_date", "nadac_per_unit"]] - Data fields to retrieve
 * @returns {Promise<Object[]>} Array of data objects containing the requested variables
 * @throws {Error} If items is undefined or if an NDC is not in the dataset
 */
async function getMedData(items, filter = "ndc", dataVariables = ["as_of_date", "nadac_per_unit"]){
    if (items === undefined) throw new Error("Please provide valid items.");
    if (filter === "ndc"){
        if (ndcs === undefined) ndcs = await getNadacNdcs();
        items.forEach(item => {if (!ndcs.has(item)) throw new Error("This NDC is not contained within the Medicaid Dataset.");})
    }
    await updateNadac();
    const rawData = await getAllData(items, filter, distributions, dataVariables);
    return rawData.flat()
}

async function getMedPlotData(meds, filter, axis = {xAxis: "as_of_date", yAxis: "nadac_per_unit"}){
    const medList = Array.isArray(meds) ? meds : [meds];
    const medData = await getMedData(medList, filter, Object.values(axis));
    medData.sort((a,b) => convertDate(a[axis.xAxis]) - convertDate(b[axis.xAxis]))
    const plotData = plotifyData(medData, axis);
    return {x: plotData[axis.xAxis], y: plotData[axis.yAxis], name: medList[0]}
}

/**
 * Creates a line plot of NADAC data for one or more NDC codes over time.
 * 
 * @param {string|string[]} ndcs - Single NDC code or array of NDC codes to plot
 * @param {Object} layout - Plotly layout configuration object (titles, axis labels, etc.)
 * @param {string} div - ID of the HTML div element where the plot will be rendered
 * @param {Object} [axis] - Optional axis configuration specifying xAxis and yAxis fields
 * @param {string} [axis.xAxis="as_of_date"] - Field to use for x-axis
 * @param {string} [axis.yAxis="nadac_per_unit"] - Field to use for y-axis
 * @returns {Promise<void>} Returns undefined if ndcs is undefined, otherwise creates the plot
 * @example
 * // Plot NADAC price over time for a specific NDC
 * await plotNadacNdc("00002-7510-01", { title: "Drug Price" }, "myDiv");
 */
async function plotNadacNdc(ndcs, layout, div, axis) {
    if (ndcs === undefined){
        return;
    }
    const medList = Array.isArray(ndcs) ? ndcs : [ndcs];
    const data = await Promise.all(medList.map(med => getMedPlotData(med, "ndc", axis)))
    return plot(data, layout, "line", div);
}
/**
 * Creates a line plot of NADAC data for one or more medicine descriptions over time.
 * This function plots National Average Drug Acquisition Cost data based on medicine names
 * rather than specific NDC codes, making it easier to visualize pricing trends for drugs
 * without needing to know their NDC codes.
 * 
 * @param {string|string[]} meds - Single medicine description or array of medicine descriptions to plot
 * @param {Object} layout - Plotly layout configuration object (titles, axis labels, etc.)
 * @param {string} div - ID of the HTML div element where the plot will be rendered
 * @param {Object} [axis] - Optional axis configuration specifying xAxis and yAxis fields
 * @param {string} [axis.xAxis="as_of_date"] - Field to use for x-axis (default: date)
 * @param {string} [axis.yAxis="nadac_per_unit"] - Field to use for y-axis (default: price per unit)
 * @returns {Promise<void>} Returns undefined if meds is undefined, otherwise creates the plot
 * @example
 * // Plot NADAC price over time for a specific medicine
 * await plotNadacMed("CALCITRIOL 1 MCG/ML SOLUTION", 
 *   { title: "NADAC Price Over Time", xaxis: { title: "Date" }, yaxis: { title: "Price ($)" } }, 
 *   "myPlotDiv");
 * 
 * @example
 * // Plot multiple medicines for comparison
 * await plotNadacMed(
 *   ["CALCITRIOL 1 MCG/ML SOLUTION", "CALCITRIOL 0.5 MCG CAPSULE"],
 *   { title: "NADAC Price Comparison" },
 *   "comparisonDiv"
 * );
 */
async function plotNadacMed(meds, layout, div, axis){
    if (meds === undefined){
        return;
    }
    const medList = Array.isArray(meds) ? meds : [meds];
    const data = await Promise.all(medList.map(med => getMedPlotData(med, "ndc_description", axis)))
    return plot(data, layout, "line", div);
}

/**
 * Retrieves metadata information about the latest NADAC dataset.
 * 
 * @returns {Promise<Object>} Metadata object containing information about the NADAC dataset
 */
async function getNadacInfo(){
    return getDatastoreImport(distributions[distributions.length - 1]);
}

async function preImport(){
    let datasets = (await getDatasetByKeyword("nadac", false)).filter(r => r.title.includes("(National Average Drug Acquisition Cost)"))
    datasets = datasets.sort((a, b) => a.title.localeCompare(b.title))
    distributions = await Promise.all(datasets.map(r => {return convertDatasetToDistributionId(r.identifier)}));
    //ensures latest NADAC dataset is retrieved rather than cached
    await endpointStore.removeItem(`metastore/schemas/dataset/items/${datasets[datasets.length - 1].identifier}`) 
}

async function updateNadac() {
    if (Date.now() - await endpointStore.getItem("NadacUpdate") > 3600000) {
        await endpointStore.setItem("NadacUpdate", Date.now());
        await endpointStore.removeItem("NdcObjMap");
        await preImport();
    }
}

export {
    //general
    getNadacMeds,
    getNadacNdcs,
    getNdcFromMed,
    getMedNames,
    getAllNdcObjs,
    getNadacInfo,
    //data collection
    getMedData,
    //plotting
    plotNadacNdc,
    plotNadacMed
}