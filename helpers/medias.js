/**
 * Recursive function that builds relationships from a list of relations and a starting node
 * @param {Array} list - List of relationships 
 * @param {string} current - Starting node
 * @param {Array} result - Accumulated result
 * @returns {Array} - List of relationship paths
 */
export const getListOfRelationsR = (list, current, result = []) => {
  // If no relationship has current as target, return the result
  if (list.every((_l) => current !== _l.cible)) {
    return result;
  } else {
    // Filter relationships where current is the target
    const scopedList = list.filter((_l) => _l.cible === current);
    
    // For each relationship, add the origin to the relationship chain
    for (let relation of scopedList) {
      let findResultIndex;

      // Search for an existing chain for this target
      const findResult = result.find((_r, index) => {
        if (Array.isArray(_r) && _r[_r.length - 1].name === relation.cible) {
          findResultIndex = index;
          return true;
        }
        return false;
      });

      // If an existing chain is found, add the origin to this chain
      if (findResult) {
        result[findResultIndex].push({
          name: relation.origine,
          value: relation.value,
        });
      } else {
        // Otherwise, create a new chain
        result.push([
          { name: relation.cible },
          { name: relation.origine, value: relation.value },
        ]);
      }
      
      // Recursive call to find the parents of the origin
      getListOfRelationsR(list, relation.origine, result);
    }
    return result;
  }
};

/**
 * Main function that returns the formatted list of relationships
 * @param {Array} list - List of relationships (combination of all relationships)
 * @param {string} current - Starting node (media)
 * @returns {Array} - List of formatted relationship chains
 */
export const getListOfRelations = (list, current) => {
  // Get raw relationships
  let listOfRelations = getListOfRelationsR(list, current);
  
  // Process each relationship chain
  for (let index in listOfRelations) {
    const relations = listOfRelations[index];
    if (relations[0].name !== current) {
      // If the first entry in the chain is not current, try to rebuild
      let currentRelationsToReplace = [...relations];
      const isItemExist = list.some((_l) => _l.cible === current);
      if (isItemExist) {
        currentRelationsToReplace = listToNewspaper(
          list,
          current,
          currentRelationsToReplace
        );
      }
      listOfRelations[index] = currentRelationsToReplace;
    }
  }

  // Reverse each chain to have the media first
  return listOfRelations.map((_lof) => _lof.reverse());
};

/**
 * Recursive function that rebuilds a relationship path to the target
 * @param {Array} collection - Complete list of relationships
 * @param {string} target - Target node (media)
 * @param {Array} relations - Relationship chain to complete
 * @returns {Array|undefined} - Completed relationship chain or undefined if impossible
 */
const listToNewspaper = (collection, target, relations) => {
  // If the first entry is already the target, return the relationships as is
  if (Array.isArray(relations) && relations[0].name === target) {
    return relations;
  }

  // Find previous elements that have the first element of relations as their origin
  const previousListItems = collection.filter(
    (_l) => _l.origine === relations[0].name
  );
  
  // Try each previous element to rebuild the path
  for (let previousItem of previousListItems) {
    let relationsClone = [...relations];
    const currentElement = { name: previousItem.cible };
    relationsClone[0] = Object.assign({}, relationsClone[0], {
      value: previousItem.value,
    });
    
    // Add the current element to the beginning of the chain
    relationsClone = [currentElement, ...relationsClone];
    
    // Recursive call to rebuild the path
    const customRelations = listToNewspaper(collection, target, relationsClone);
    if (customRelations && customRelations[0].name === target) {
      return customRelations;
    }
  }
  
  // If no path was found, return undefined
  return undefined;
};
