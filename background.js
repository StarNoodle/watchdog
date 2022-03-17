import { getListOfRelations } from "./helpers/medias.js";
import { tsvJSON, csvJSON } from "./helpers/dataReader.js";

let mediasUrl, relationsMediasArray;

const setup = async () => {
  if (!mediasUrl) {
    const result = await Promise.all([
      readTsvFile("./data/Medias_francais/relations_medias_francais.tsv"),
      readCsvFile("./data/medias_extracted.csv"),
    ]);
    const [relations, urls] = result;
    mediasUrl = urls;
    relationsMediasArray = relations;
  }
};

const notfify = (isKnownMedia) => {
  if (isKnownMedia) {
    chrome.action.setIcon({
      path: {
        16: "icons/icon16-green.png",
        32: "icons/icon32-green.png",
      },
    });
  } else {
    chrome.action.setIcon({
      path: {
        16: "icons/icon16.png",
        32: "icons/icon32.png",
      },
    });
  }
};

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const { url } = tab;
  await setup();
  const mediaByUrl = searchWithSanitizedUrl(mediasUrl, getURL(url));
  if (mediaByUrl) {
    const currentMedia = relationsMediasArray.find((_rma) => {
      return _rma.cible === mediaByUrl.nom;
    });
    if (currentMedia) {
      notfify(true);
    } else {
      notfify(false);
    }
  } else {
    notfify(false);
  }
});

chrome.tabs.onActivated.addListener(async function (activeInfo) {
  await setup();

  // how to fetch tab url using activeInfo.tabid
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    const mediaByUrl = searchWithSanitizedUrl(mediasUrl, getURL(tab.url));
    if (mediaByUrl) {
      const currentMedia = relationsMediasArray.find((_rma) => {
        return _rma.cible === mediaByUrl.nom;
      });
      if (currentMedia) {
        notfify(true);
      } else {
        notfify(false);
      }
    } else {
      notfify(false);
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "handle_get_url_info") {
    chrome.tabs.query({ currentWindow: true, active: true }).then((res) => {
      const url = res[0].url;
      Promise.all([
        readTsvFile("./data/Medias_francais/medias_francais.tsv"),
        readTsvFile("./data/Medias_francais/relations_medias_francais.tsv"),
        readCsvFile("./data/medias_extracted.csv"),
      ]).then(([mediasArray, relationsMediasArray, mediasUrl]) => {
        // check if url exist in relations array
        const mediaByUrl = searchWithSanitizedUrl(mediasUrl, getURL(url));

        if (mediaByUrl) {
          const currentMedia = relationsMediasArray.find((_rma) => {
            return _rma.cible === mediaByUrl.nom;
          });

          if (currentMedia) {
            try {
              const relationship = getRelationShip(
                { mediasArray, relationsMediasArray, mediasUrl },
                getURL(url)
              );

              sendResponse({
                rootUrl: getURL(url),
                url,
                mediaInfo: currentMedia,
                list: relationship,
              });
              return Promise.resolve({
                rootUrl: getURL(url),
                url,
                mediaInfo: currentMedia,
                list: relationship,
              });
            } catch (e) {
              sendResponse({
                rootUrl: getURL(url),
                url,
                mediaInfo: null,
                list: null,
                error: {
                  message:
                    "Un erreur s'est produite, si vous voulez nous la rapportez rendez vous sur <a href='https://github.com/StarNoodle/watch-dogs' onClick='chrome.tabs.create({ url: 'https://github.com/StarNoodle/watch-dogs' });'>cette page </a>",
                },
              });
              return Promise.resolve({
                rootUrl: getURL(url),
                url,
                mediaInfo: null,
                list: null,
                error: {
                  message:
                    "Un erreur s'est produite, si vous voulez nous la rapportez rendez vous sur <a href='https://github.com/StarNoodle/watch-dogs' onClick='chrome.tabs.create({ url: 'https://github.com/StarNoodle/watch-dogs' });'>cette page </a>",
                },
              });
            }
          } else {
            sendResponse({
              rootUrl: getURL(url),
              url,
              mediaInfo: null,
              list: null,
            });
            return Promise.resolve(
              chrome.storage.local.remove(["url", "mediaInfo", "list"])
            );
          }
        } else {
          const error = new Error("url not found");
          sendResponse({
            rootUrl: getURL(url),
            url,
            mediaInfo: null,
            list: null,
            error,
          });

          return Promise.resolve({ error });
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
  const list = relationsMediasArray.map((_l) => {
    return Object.assign({}, _l, {
      value:
        _l.valeur && /[0-9]+/.test(_l.valeur) ? `${_l.valeur}%` : _l.valeur,
    });
  });

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
