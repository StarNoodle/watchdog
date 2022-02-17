import { getListOfRelations, searchLastItems } from "../helpers/medias.js";

// id	origine	valeur	cible	source	datePublication	dateConsultation	url
const relationsMedias = [
  {
    cible: "lexpress",
    origine: "entity1",
    valeur: "values",
  },
  {
    cible: "lexpress",
    origine: "entity2",
    valeur: "values",
  },
  {
    cible: "entity1",
    origine: "entity3",
    valeur: "values",
  },
  {
    cible: "entity1",
    origine: "entity4",
    valeur: "values",
  },
  {
    cible: "entity4",
    origine: "entity5",
    valeur: "values",
  },
  {
    cible: "entity4",
    origine: "entity6",
    valeur: "values",
  },
  {
    cible: "entity5",
    origine: "entity7",
    valeur: "values",
  },
  {
    cible: "entity6",
    origine: "entity7",
    valeur: "values",
  },
];

describe("#getListOfRelations", () => {
  it("should return the good structure", () => {
    const resultExpected = [
      [
        {
          name: "entity3",
          valeur: "values",
        },
        {
          name: "entity1",
          valeur: "values",
        },
        {
          name: "lexpress",
        },
      ],
      [
        {
          name: "entity7",
          valeur: "values",
        },
        {
          name: "entity5",
          valeur: "values",
        },
        {
          name: "entity4",
          valeur: "values",
        },
        {
          name: "entity1",
          valeur: "values",
        },
        {
          name: "lexpress",
        },
      ],
      [
        {
          name: "entity7",
          valeur: "values",
        },
        {
          name: "entity6",
          valeur: "values",
        },
        {
          name: "entity4",
          valeur: "values",
        },
        {
          name: "entity1",
          valeur: "values",
        },
        {
          name: "lexpress",
        },
      ],
      [
        {
          name: "entity2",
          valeur: "values",
        },
        {
          name: "lexpress",
        },
      ],
    ];

    const listOfRelations = getListOfRelations(relationsMedias, "lexpress");
    expect(listOfRelations.sort((_lor) => JSON.stringify(_lor))).toEqual(
      resultExpected.sort((_lor) => JSON.stringify(_lor))
    );
  });
});

describe("#searchLastItems", () => {
  it("should return 2 items with diamond structure", () => {
    const relationsMedias = [
      {
        cible: "newspaper",
        origine: "entity1",
        valeur: "values",
      },
      {
        cible: "newspaper",
        origine: "entity2",
        valeur: "values",
      },
      {
        cible: "entity2",
        origine: "entity3",
        valeur: "values",
      },
      {
        cible: "entity1",
        origine: "entity3",
        valeur: "values",
      },
    ];
    const resultExpected = [
      [
        {
          name: "entity3",
          valeur: "values",
        },
        {
          name: "entity1",
          valeur: "values",
        },
        { name: "newspaper" },
      ],
      [
        {
          name: "entity3",
          valeur: "values",
        },
        {
          name: "entity2",
          valeur: "values",
        },
        { name: "newspaper" },
      ],
    ];

    const listOfRelations = getListOfRelations(relationsMedias, "newspaper");
    expect(listOfRelations.sort((_lor) => JSON.stringify(_lor))).toEqual(
      resultExpected.sort((_lor) => JSON.stringify(_lor))
    );
  });
});
