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
          function ({ mediaInfo, list }) {
            if (mediaInfo && list) {
              const { url, origine, cible, valeur } = mediaInfo;
              if (url) {
                $("#content #content_test").text("Background JS : " + url);
              } else {
                $("#content #content_test").text("rien trouvé");
              }

              $("#content #owner_name").text(
                `${origine}, ${valeur} %, ${cible}`
              );

              $("#content #owner_name").append("<br/> <br/>");

              const element = document.createElement("div");
              for (let mediaRelationships of list) {
                const relationsElement = document.createElement("p");
                for (let relation of mediaRelationships) {
                  $(relationsElement).append(
                    `<div>${relation.name} ${relation.valeur || ""}</div>`
                  );
                }
                $(element).append(relationsElement);
                $(element).append("<hr/>");
              }
              $("#content #owners_info").append(element);
            } else {
              $("#content #content_test").text("rien trouvé");
            }
          }
        );
      } else {
        $("#content #content_test").text("Une erreur est survenue");
        // throw new Error("No url detected");
      }
    });
};

main();
