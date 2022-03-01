import { getListOfRelations } from "./helpers/medias.js";
import { tsvJSON, csvJSON } from "./helpers/dataReader.js";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "handle_get_url_info") {
    chrome.tabs.query({ currentWindow: true, active: true }).then((res) => {
      const url = res[0].url;
      Promise.all([
        readTsvFile("./data/medias_francais.tsv"),
        readTsvFile("./data/relations_medias_francais.tsv"),
        readCsvFile("./data/medias_extracted.csv"),
      ]).then(([mediasArray, relationsMediasArray, mediasUrl]) => {
        // check if url exist in relations array
        const mediaByUrl = searchWithSanitizedUrl(mediasUrl, getURL(url));
        const currentMedia = relationsMediasArray.find((_rma) => {
          return _rma.cible === mediaByUrl.nom;
        });

        if (currentMedia) {
          const relationship = getRelationShip(
            { mediasArray, relationsMediasArray, mediasUrl },
            getURL(url)
          );
          sendResponse({ url, mediaInfo: currentMedia, list: relationship });
          return Promise.resolve({
            url,
            mediaInfo: currentMedia,
            list: relationship,
          });
        } else {
          sendResponse({ url, mediaInfo: null, list: null });
          return Promise.resolve(
            chrome.storage.local.remove(["url", "mediaInfo", "list"])
          );
        }
      });
    });
  }
  return true;
});

const readTsvFile = (path) => {
  return new Promise((resolve, reject) => {
    fetch(path)
      .then((response) => {
        return response.blob();
      })
      .then((file) => {
        const reader = new FileReader();
        reader.onload = function (e) {
          const text = e.target.result;
          resolve(tsvJSON(text));
        };

        reader.readAsText(file);
      })
      .catch((err) => reject(err));
  });
};

const readCsvFile = (path) => {
  return new Promise((resolve, reject) => {
    fetch(path)
      .then((response) => {
        return response.blob();
      })
      .then((file) => {
        const reader = new FileReader();
        reader.onload = function (e) {
          const text = e.target.result;
          resolve(csvJSON(text));
        };

        reader.readAsText(file);
      })
      .catch((err) => reject(err));
  });
};

const getURL = (urlStr) => {
  if (urlStr) {
    const url = new URL(urlStr);
    return url.hostname;
  } else {
    return null;
  }
};

const getRelationShip = (
  { mediasArray, relationsMediasArray, mediasUrl },
  url
) => {
  const mediaRelationsFirstElement = searchWithSanitizedUrl(mediasUrl, url);

  // format fields and value for fields "valeur"
  const list = relationsMediasArray.map((_l) =>
    Object.assign({}, _l, {
      value:
        _l.valeur && _l.valeur.match(/[0-9]*/) ? `${_l.valeur}%` : _l.valeur,
    })
  );

  const listOfRelations = getListOfRelations(
    list,
    mediaRelationsFirstElement.nom
  );
  return listOfRelations;
};

const searchWithSanitizedUrl = (list, url) => {
  const resultByUrl = list.filter(
    (_l) =>
      _l.url.replace(/(http:\/\/|https:\/\/)?/, "").replace(/\/$/, "") === url
  );
  if (resultByUrl.length === 1) {
    return resultByUrl[0];
  } else if (resultByUrl.length > 1) {
    // check if arrival url fit the url parameter
    const resultByArrivalUrl = resultByUrl.find(
      (_l) =>
        _l.arrival_url
          .replace(/(http:\/\/|https:\/\/)?/, "")
          .replace(/\/$/, "") === url
    );
    if (resultByArrivalUrl) {
      return resultByArrivalUrl;
    } else {
      return null;
    }
  }
  return null;
};
