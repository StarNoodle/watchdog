const main = () => {
  chrome.tabs
    .query({
      active: true,
      currentWindow: true,
    })
    .then(async ([currentTab]) => {
      const { url } = currentTab;

      if (url) {
        chrome.runtime.sendMessage(
          "handle_get_url_info",
          function ({ rootUrl, url, mediaInfo, list, error }) {
            if (mediaInfo && list && !error) {
              const { origine, cible, value } = mediaInfo;
              // Set title and subtitle
              document.getElementsByClassName(
                "page-container__head__info__title"
              )[0].innerHTML = cible;
              document.getElementsByClassName(
                "page-container__head__info__subtitle"
              )[0].innerHTML = rootUrl || url;

              // Format data
              const dataset = formatForceGraphData(list);

              // Interface
              const chartContainerElem = document.getElementsByClassName(
                "page-container__content__graph"
              )[0];
              const chartElem = document.getElementById("chart");
              const toggleSwitchElem = document.getElementById("toggle-mode");
              const toggleLabelElem = document.getElementById(
                "toggle-mode-label"
              );
              let isSwitchDisabled = false;
              let currentMode = "default";
              const loadTimeMs = 400;

              let graph = new Graph(chartElem, dataset);

              // first load
              window.setTimeout(() => {
                chartContainerElem.classList.toggle(
                  "page-container__content__graph--loaded"
                );
              }, loadTimeMs);

              document.getElementById("toggle-mode").addEventListener(
                "click",
                function (e) {
                  if (isSwitchDisabled == true) {
                    e.preventDefault();
                    return;
                  }
                  isSwitchDisabled = true;

                  chartContainerElem.classList.toggle(
                    "page-container__content__graph--loaded"
                  );
                  window.setTimeout(() => {
                    currentMode =
                      currentMode == "simplified" ? "default" : "simplified";
                    graph.updateMode(currentMode);
                    window.setTimeout(() => {
                      chartContainerElem.classList.toggle(
                        "page-container__content__graph--loaded"
                      );
                      isSwitchDisabled = false;
                    }, loadTimeMs / 2);
                  }, loadTimeMs / 2);
                },
                false
              );
            } else {
              // newspaper not found
              document
                .getElementById("error-page")
                .classList.remove("page--hidden");
              document.getElementById("app-page").classList.add("page--hidden");
              // $("#content #content_test").text("rien trouvé");
            }
          }
        );
      } else {
        document.getElementById("error-page").classList.remove("page--hidden");
        document.getElementById("app-page").classList.add("page--hidden");
        // $("#content #content_test").text("Une erreur est survenue");
      }
    });
};

main();

/*
@params data = [
  [
    { name: "Xavier Niel", value: 50 },
    { name: "Fonds idepedant de la Presse", value: 50 },
    { name: "Le Monde Libre", value: 50 },
    { name: "Le Monde SA", value: 50 },
    { name: "Le Monde" },
  ],
  [
    { name: "Mathieu Pigasse", value: 50 },
    { name: "Combat Solution", value: 50 },
    { name: "Le Nouveau Monde", value: 50},
    { name: "Le Monde Libre", value: 50 },
    { name: "Le Monde SA", value: 50 },
    { name: "Le Monde" },
  ],
  [
    { name: "Daniel Kretinsky", value: 50 },
    { name: "Czech Media Invest", value: 50 },
    { name: "Le Nouveau Monde", value: 50},
    { name: "Le Monde Libre", value: 50 },
    { name: "Le Monde SA", value: 50 },
    { name: "Le Monde" },
  ]
]

@return  nodes = [
    { name: "Le Monde", type: "start" },
    { name: "Le Monde SA", target: 0, value: 50, type: "middle" },
    { name: "Le Monde Libre", target: 1, value: 50, type: "middle" },
    { name: "Le Nouveau Monde", target: 2, value: 50, type: "middle" },
    { name: "Fonds idepedant de la Presse", target: 2, value: 50, type: "middle" },
    { name: "Combat Solution", target: 3, value: 50, type: "middle" },
    { name: "Czech Media Invest", target: 3, value: 50, type: "middle" },
    { name: "Xavier Niel", target: 4, value: 50, type: "end" },
    { name: "Mathieu Pigasse", target: 5, value: 50, type: "end" },
    { name: "Daniel Kretinsky", target: 6, value: 50, type: "end" },
  ];
*/
function formatForceGraphData(data) {
  // each first element are type start and last are end, other are middle
  const reverseDataWithType = attributeType(data.map((_d) => _d.reverse()));

  const result = [];
  // push uniq element in array with target
  reverseDataWithType.forEach((_rdwt) => {
    _rdwt.forEach((_rd, _i) => {
      const index = result.findIndex(
        (_r) => _r.name === _rd.name && _r.value === _rd.value
      );
      if (index === -1) {
        if (_i > 0) {
          const ancestor = _rdwt[_i - 1];
          const targetAncestorIndex = result.findIndex(
            (_ta) => _ta.name === ancestor.name && _ta.value === ancestor.value
          );
          result.push(Object.assign({}, _rd, { target: targetAncestorIndex }));
        } else {
          result.push(Object.assign({}, _rd));
        }
      }
    });
  });

  return result;
}

const attributeType = (data) => {
  let cloneData = Array.from(data);

  for (let i = 0; i < cloneData.length; i++) {
    for (let j = 0; j < cloneData[i].length; j++) {
      if (j === 0) {
        cloneData[i][j].type = "start";
      } else if (j === cloneData[i].length - 1) {
        cloneData[i][j].type = "end";
      } else {
        cloneData[i][j].type = "middle";
      }
    }
  }

  return cloneData;
};
