/**
 * Converts TSV content to an array of JavaScript objects
 * Fixes issues with spaces in headers and values
 * 
 * @param {string} tsv - The TSV content to convert
 * @returns {Array} - Array of objects representing TSV data
 */
export const tsvJSON = (tsv) => {
  // Ignore empty lines
  const lines = tsv.split("\n").filter(line => line.trim() !== "");
  
  // Get and clean headers
  const headers = lines[0].split("\t").map(header => header.trim());
  
  // Process each line
  return lines.slice(1).map((line) => {
    const data = line.split("\t");
    const obj = {};
    
    // Associate each value with its header
    headers.forEach((header, index) => {
      // Use an empty string if no data is available for this index
      let value = index < data.length ? data[index] : "";
      value = value ? value.trim() : value;
      
      // Convert percentage values to floating point numbers
      if (value && value.includes('%')) {
        const numericValue = value.replace('%', '');
        if (!isNaN(parseFloat(numericValue))) {
          value = parseFloat(numericValue);
        }
      }
      
      obj[header] = value;
    });
    
    return obj;
  }).filter(item => Object.keys(item).length > 0 && 
               // Check that at least one field contains a non-empty value
               Object.values(item).some(value => value && value.trim() !== ""));
};

/**
 * Converts CSV content to an array of JavaScript objects
 * Fixes issues with spaces in headers and values
 * 
 * @param {string} csv - The CSV content to convert
 * @returns {Array} - Array of objects representing CSV data
 */
export const csvJSON = (csv) => {
  // Ignore empty lines
  const lines = csv.split("\n").filter(line => line.trim() !== "");
  
  // Get and clean headers
  const headers = lines[0].split(";").map(header => header.trim());
  
  const result = [];
  
  // Process each line
  for (let i = 1; i < lines.length; i++) {
    // Ignore empty lines
    if (lines[i].trim() === "") continue;
    
    const obj = {};
    const currentline = lines[i].split(";");
    
    // Associate each value with its header
    for (let j = 0; j < headers.length; j++) {
      // Use an empty string if no data is available for this index
      let value = j < currentline.length ? currentline[j] : "";
      value = value ? value.trim() : value;
      
      // Convert percentage values to floating point numbers
      if (value && value.includes('%')) {
        const numericValue = value.replace('%', '');
        if (!isNaN(parseFloat(numericValue))) {
          value = parseFloat(numericValue);
        }
      }
      
      obj[headers[j]] = value;
    }
    
    // Only add the object if it has at least one non-empty value
    if (Object.keys(obj).length > 0 && Object.values(obj).some(value => value && value.trim() !== "")) {
      result.push(obj);
    }
  }
  
  return result;
};
