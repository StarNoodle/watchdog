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
        console.log("isItemExist", isItemExist);
        console.log(
          "currentRelationsToReplace[0]",
          currentRelationsToReplace[0].name
        );
        while (currentRelationsToReplace[0].name !== current) {
          const previousListItem = list.filter(
            (_l) => _l.origine === currentRelationsToReplace[0].name
          );
          console.log("previousListItem", previousListItem);
          const currentListItem = list.find(
            (_l) => _l.cible === currentRelationsToReplace[0].name
          );
          if (previousListItem.length > 0 && currentListItem) {
            // build "new" current item
            // add valeur to the first element
            const currentItem = {
              name: currentListItem.cible,
              valeur: currentListItem.valeur,
            };
            currentRelationsToReplace[0] = currentItem;

            // build previous item
            const previousItem = {
              name: previousListItem[0].cible,
            };

            currentRelationsToReplace = [
              previousItem,
              ...currentRelationsToReplace,
            ];
          } else {
            break;
          }
        }
      } else {
        console.log("CURRENT", current);
      }
      listOfRelations[index] = currentRelationsToReplace;
    }
  }
  console.log("getListOfRelations", listOfRelations);

  return listOfRelations.map((_lof) => _lof.reverse());
};
