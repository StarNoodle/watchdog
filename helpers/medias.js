export const getListOfRelationsR = (list, current, result = []) => {
  if (list.every((_l) => current !== _l.cible)) {
    return result;
  } else {
    const scopedList = list.filter((_l) => _l.cible === current);
    for (let relation of scopedList) {
      let findResultIndex;

      // search for existing result array
      const findResult = result.find((_r, index) => {
        if (Array.isArray(_r) && _r[_r.length - 1].name === relation.cible) {
          findResultIndex = index;
          return true;
        }
        return false;
      });

      if (findResult) {
        result[findResultIndex].push({
          name: relation.origine,
          valeur: relation.valeur,
        });
      } else {
        result.push([
          { name: relation.cible },
          { name: relation.origine, valeur: relation.valeur },
        ]);
      }
      getListOfRelationsR(list, relation.origine, result);
    }
    return result;
  }
};

export const getListOfRelations = (list, current) => {
  let listOfRelations = getListOfRelationsR(list, current);
  for (let index in listOfRelations) {
    const relations = listOfRelations[index];
    if (relations[0].name !== current) {
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

  return listOfRelations.map((_lof) => _lof.reverse());
};

const listToNewspaper = (collection, target, relations) => {
  if (Array.isArray(relations) && relations[0].name === target) {
    return relations;
  }

  const previousListItems = collection.filter(
    (_l) => _l.origine === relations[0].name
  );
  for (let previousItem of previousListItems) {
    let relationsClone = [...relations];
    const currentElement = { name: previousItem.cible };
    relationsClone[0] = Object.assign({}, relationsClone[0], {
      valeur: previousItem.valeur,
    });
    // console.log("relationsClone[0]", relationsClone[0], currentElement);
    relationsClone = [currentElement, ...relationsClone];
    const customRelations = listToNewspaper(collection, target, relationsClone);
    if (customRelations && customRelations[0].name === target) {
      return customRelations;
    }
  }
};
