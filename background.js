import { getListOfRelations } from "./helpers/medias.js";
import { tsvJSON, csvJSON } from "./helpers/dataReader.js";

// Global variables to store loaded data
let mediasUrl, mediasArray, organisationsArray, personnesArray;
let organisationOrganisationArray,
  personneMediaArray,
  personneOrganisationArray,
  organisationMediaArray;

const setup = async () => {
  if (!mediasUrl) {
    const result = await Promise.all([
      readCsvFile("./data/medias_extracted.csv"),
      readTsvFile("./data/medias.tsv"),
      readTsvFile("./data/organisations.tsv"),
      readTsvFile("./data/personnes.tsv"),
      readTsvFile("./data/organisation-organisation.tsv"),
      readTsvFile("./data/personne-media.tsv"),
      readTsvFile("./data/personne-organisation.tsv"),
      readTsvFile("./data/organisation-media.tsv"),
    ]);

    // Store results in global variables
    mediasUrl = result[0];
    mediasArray = result[1];
    organisationsArray = result[2];
    personnesArray = result[3];
    organisationOrganisationArray = result[4];
    personneMediaArray = result[5];
    personneOrganisationArray = result[6];
    organisationMediaArray = result[7];
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
    // Check if the media exists in organisationMediaArray
    const isMediaInRelations =
      organisationMediaArray.some((rel) => rel.cible === mediaByUrl.nom) ||
      personneMediaArray.some((rel) => rel.cible === mediaByUrl.nom);
    if (isMediaInRelations) {
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
      // Check if the media exists in organisationMediaArray or personneMediaArray
      const isMediaInRelations =
        organisationMediaArray.some((rel) => rel.cible === mediaByUrl.nom) ||
        personneMediaArray.some((rel) => rel.cible === mediaByUrl.nom);
      if (isMediaInRelations) {
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
      // Directly use data already loaded via setup() or load it if necessary
      (mediasUrl ? Promise.resolve() : setup()).then(() => {
        // Check if url exists in relations array
        const mediaByUrl = searchWithSanitizedUrl(mediasUrl, getURL(url));

        if (mediaByUrl) {
          // Check if the media exists in a relationship
          const isMediaInRelations =
            organisationMediaArray.some(
              (rel) => rel.cible === mediaByUrl.nom
            ) || personneMediaArray.some((rel) => rel.cible === mediaByUrl.nom);

          if (isMediaInRelations) {
            try {
              // Get all relationships for this media
              const relationship = getRelationShip(getURL(url));

              // Get media information from mediasArray
              const mediaInfo =
                mediasArray.find((media) => media.Nom === mediaByUrl.nom) || {};

              sendResponse({
                rootUrl: getURL(url),
                url,
                mediaInfo: {
                  cible: mediaByUrl.nom,
                  ...mediaInfo,
                },
                list: relationship,
              });
              return Promise.resolve({
                rootUrl: getURL(url),
                url,
                mediaInfo: {
                  cible: mediaByUrl.nom,
                  ...mediaInfo,
                },
                list: relationship,
              });
            } catch (e) {
              console.error("Error retrieving relationships", e);
              sendResponse({
                rootUrl: getURL(url),
                url,
                mediaInfo: null,
                list: null,
                error: {
                  message:
                    "An error occurred. If you want to report it, please visit <a href='https://github.com/StarNoodle/watch-dogs' onClick='chrome.tabs.create({ url: 'https://github.com/StarNoodle/watch-dogs' });'>this page</a>",
                },
              });
              return Promise.resolve({
                rootUrl: getURL(url),
                url,
                mediaInfo: null,
                list: null,
                error: {
                  message:
                    "An error occurred. If you want to report it, please visit <a href='https://github.com/StarNoodle/watch-dogs' onClick='chrome.tabs.create({ url: 'https://github.com/StarNoodle/watch-dogs' });'>this page</a>",
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

const getRelationShip = (url) => {
  const mediaRelationsFirstElement = searchWithSanitizedUrl(mediasUrl, url);

  if (!mediaRelationsFirstElement) {
    return [];
  }

  // Combine all relevant relationships
  const allRelations = [
    ...organisationMediaArray.map((rel) => ({
      origine: rel.origine,
      cible: rel.cible,
      valeur: rel.valeur,
      type: "organisation-media",
    })),
    ...personneMediaArray.map((rel) => ({
      origine: rel.origine,
      cible: rel.cible,
      valeur: rel.valeur,
      type: "personne-media",
    })),
    ...organisationOrganisationArray.map((rel) => ({
      origine: rel.origine,
      cible: rel.cible,
      valeur: rel.valeur,
      type: "organisation-organisation",
    })),
    ...personneOrganisationArray.map((rel) => ({
      origine: rel.origine,
      cible: rel.cible,
      valeur: rel.valeur,
      type: "personne-organisation",
    })),
  ];

  // Format values (add % if necessary)
  const formattedRelations = allRelations.map((rel) => ({
    ...rel,
    value:
      rel.valeur && /[0-9]+/.test(rel.valeur) ? `${rel.valeur}%` : rel.valeur,
  }));

  // Get structured relationships as before
  const listOfRelations = getListOfRelations(
    formattedRelations,
    mediaRelationsFirstElement.nom
  );

  // Format to match the structure expected by the front-end
  const formattedOutput = listOfRelations.map((chain) => {
    // Expected format: each chain element with type (start, middle, end) and value if available
    return chain.map((node, index) => {
      // Determine type based on position
      let type =
        index === 0 ? "start" : index === chain.length - 1 ? "end" : "middle";

      // Build object with required properties
      return {
        name: node.name,
        ...(node.value ? { value: node.value } : {}),
        type,
      };
    });
  });

  return formattedOutput;
};

const searchWithSanitizedUrl = (list, url) => {
  const resultByUrl = list.filter(
    (_l) =>
      _l.url.replace(/(http:\/\/|https:\/\/)?/, "").replace(/\/$/, "") === url
  );
  if (resultByUrl.length === 1) {
    return resultByUrl[0];
  } else if (resultByUrl.length > 1) {
    // Check if arrival url matches the url parameter
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

const loadData = async () => {
  // Reuse the setup function to load data
  await setup();

  // Return all loaded data
  return [
    mediasUrl,
    mediasArray,
    organisationsArray,
    personnesArray,
    organisationOrganisationArray,
    personneMediaArray,
    personneOrganisationArray,
    organisationMediaArray,
  ];
};
